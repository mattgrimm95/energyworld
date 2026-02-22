/**
 * Fetches the latest indicator data from the World Bank API and upserts into
 * the local SQLite database. No API key required.
 *
 * Indicators used:
 * - NE.EXP.GNFS.CD  Exports of goods and services (current US$)
 * - NE.IMP.GNFS.CD  Imports of goods and services (current US$)
 * - EG.USE.ELEC.KH  Electric power consumption (kWh) → converted to TWh (electricity only, not primary energy)
 *
 * Also updates energy reserve estimates when EIA_API_KEY is set,
 * otherwise refreshes from the bundled reserves dataset.
 *
 * Run: npm run db:fetch
 * Optional env: FETCH_YEAR_START=2015 FETCH_YEAR_END=2024 (default: 2018 to current year)
 *               EIA_API_KEY=<your key> (optional, for reserve estimate updates)
 */

import { db, countries, stats, energyReserves } from "./index.js";
import { eq, and } from "drizzle-orm";
import { ENERGY_RESERVES } from "./reserves-data.js";

const WB_BASE = "https://api.worldbank.org/v2";
const PER_PAGE = 10000;

type WBPayload = Array<{
  countryiso3code?: string;
  date?: string;
  value?: number | null;
}>;

async function fetchIndicator(
  indicator: string,
  dateRange: string
): Promise<Map<string, Map<number, number>>> {
  const url = `${WB_BASE}/country/all/indicator/${indicator}?format=json&date=${dateRange}&per_page=${PER_PAGE}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`World Bank API error: ${res.status} ${res.statusText}`);
  const data = (await res.json()) as [unknown, WBPayload];
  const rows = data[1];
  if (!Array.isArray(rows)) return new Map();

  const byIso3Year = new Map<string, Map<number, number>>();
  for (const row of rows) {
    const iso3 = row.countryiso3code;
    const year = row.date ? parseInt(row.date, 10) : NaN;
    const raw = row.value;
    if (!iso3 || Number.isNaN(year) || raw == null || typeof raw !== "number") continue;
    if (!byIso3Year.has(iso3)) byIso3Year.set(iso3, new Map());
    byIso3Year.get(iso3)!.set(year, raw);
  }
  return byIso3Year;
}

function getYearRange(): string {
  const start = parseInt(process.env.FETCH_YEAR_START ?? "2015", 10);
  const end = parseInt(process.env.FETCH_YEAR_END ?? String(new Date().getFullYear()), 10);
  return `${start}:${end}`;
}

async function main() {
  const dateRange = getYearRange();
  console.log("Fetching World Bank data for", dateRange, "...");

  const [exportsByCountry, importsByCountry, elecByCountry] = await Promise.all([
    fetchIndicator("NE.EXP.GNFS.CD", dateRange),
    fetchIndicator("NE.IMP.GNFS.CD", dateRange),
    fetchIndicator("EG.USE.ELEC.KH", dateRange),
  ]);

  const countryRows = db.select({ id: countries.id, iso3: countries.iso3 }).from(countries).all();
  const idByIso3 = new Map(countryRows.map((r) => [r.iso3, r.id]));

  let rowsWritten = 0;

  const metrics: Array<{
    data: Map<string, Map<number, number>>;
    metricType: string;
    unit: string;
    scale: number; // e.g. 1e9 for USD -> billion USD, 1e9 for kWh -> TWh
  }> = [
    { data: exportsByCountry, metricType: "exports", unit: "billion USD", scale: 1e9 },
    { data: importsByCountry, metricType: "imports", unit: "billion USD", scale: 1e9 },
    { data: elecByCountry, metricType: "energy_consumption", unit: "TWh", scale: 1e9 },
  ];

  for (const { data: byCountry, metricType, unit, scale } of metrics) {
    for (const [iso3, yearValues] of byCountry) {
      const countryId = idByIso3.get(iso3);
      if (countryId == null) continue;

      for (const [year, rawValue] of yearValues) {
        const value = rawValue / scale;
        if (!Number.isFinite(value) || value < 0) continue;

        db.delete(stats)
          .where(
            and(
              eq(stats.countryId, countryId),
              eq(stats.year, year),
              eq(stats.metricType, metricType)
            )
          )
          .run();

        db.insert(stats)
          .values({ countryId, year, metricType, value, unit })
          .run();
        rowsWritten += 1;
      }
    }
  }

  console.log("Done. Stat rows written:", rowsWritten);

  await fetchLatestReserves();
}

/**
 * Updates energy reserve data. If EIA_API_KEY is set, attempts to pull
 * proved-reserves data from the EIA API (api.eia.gov) for oil and gas.
 * Otherwise falls back to the bundled static dataset and refreshes
 * the year to the current year.
 *
 * The EIA International Energy Statistics endpoint provides country-level
 * proved reserves that can be mapped to our per-field estimates using
 * proportional scaling when more granular data becomes available.
 */
async function fetchLatestReserves() {
  const eiaKey = process.env.EIA_API_KEY;
  const currentYear = new Date().getFullYear();

  if (eiaKey) {
    console.log("Fetching reserve estimates from EIA API...");
    try {
      const oilReserves = await fetchEIAReserves(eiaKey, "PET.RCRR01");
      let updated = 0;

      for (const reserve of ENERGY_RESERVES) {
        if (reserve.type === "oil" || reserve.type === "shale" || reserve.type === "oil_sands") {
          const countryEstimate = oilReserves.get(reserve.iso3);
          if (countryEstimate != null) {
            const countryFields = ENERGY_RESERVES.filter(
              (r) => r.iso3 === reserve.iso3 && (r.type === "oil" || r.type === "shale" || r.type === "oil_sands")
            );
            const totalSeedForCountry = countryFields.reduce(
              (sum, r) => sum + (r.estimatedReserves ?? 0), 0
            );
            if (totalSeedForCountry > 0) {
              const scaleFactor = countryEstimate / totalSeedForCountry;
              const scaledValue = Math.round((reserve.estimatedReserves ?? 0) * scaleFactor * 10) / 10;
              db.delete(energyReserves)
                .where(
                  and(
                    eq(energyReserves.name, reserve.name),
                    eq(energyReserves.iso3, reserve.iso3)
                  )
                )
                .run();
              db.insert(energyReserves)
                .values({ ...reserve, estimatedReserves: scaledValue, year: currentYear })
                .run();
              updated++;
            }
          }
        }
      }
      console.log(`EIA reserve update: ${updated} oil/shale records scaled.`);
    } catch (err) {
      console.warn("EIA fetch failed, falling back to static data:", err);
      upsertStaticReserves(currentYear);
    }
  } else {
    upsertStaticReserves(currentYear);
  }
}

function upsertStaticReserves(year: number) {
  console.log("Refreshing reserves from bundled dataset...");
  db.delete(energyReserves).run();
  for (const reserve of ENERGY_RESERVES) {
    db.insert(energyReserves).values({ ...reserve, year }).run();
  }
  console.log(`Reserves refreshed: ${ENERGY_RESERVES.length} records.`);
}

type EIARecord = { period: string; "iso3166-alpha3"?: string; value?: number | null };

async function fetchEIAReserves(
  apiKey: string,
  seriesId: string
): Promise<Map<string, number>> {
  const url =
    `https://api.eia.gov/v2/international/data/?api_key=${apiKey}` +
    `&frequency=annual&data[0]=value&facets[seriesId][]=${seriesId}` +
    `&sort[0][column]=period&sort[0][direction]=desc&length=500`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`EIA API ${res.status}: ${res.statusText}`);
  const json = (await res.json()) as { response?: { data?: EIARecord[] } };
  const rows = json.response?.data ?? [];

  const byIso3 = new Map<string, number>();
  for (const row of rows) {
    const iso3 = row["iso3166-alpha3"];
    const val = row.value;
    if (!iso3 || val == null) continue;
    if (!byIso3.has(iso3)) byIso3.set(iso3, val);
  }
  return byIso3;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
