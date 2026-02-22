import { db, countries, stats, energyReserves, pipelines } from "./index.js";
import {
  COUNTRIES,
  YEARS,
  ENERGY_CONSUMPTION,
  EXPORTS,
  IMPORTS,
  COPPER_PRODUCTION,
  LITHIUM_PRODUCTION,
  COBALT_PRODUCTION,
  RARE_EARTH_PRODUCTION,
  SILICON_PRODUCTION,
  NICKEL_PRODUCTION,
} from "./seed-data.js";
import { ENERGY_RESERVES } from "./reserves-data.js";
import { PIPELINES } from "./pipelines-data.js";

function seed() {
  db.delete(stats).run();
  db.delete(countries).run();

  const idMap = new Map<string, number>();

  for (const c of COUNTRIES) {
    const [row] = db
      .insert(countries)
      .values({ iso3: c.iso3, name: c.name })
      .returning({ id: countries.id })
      .all();
    idMap.set(c.iso3, row!.id);
  }

  const rows: Array<{
    countryId: number;
    year: number;
    metricType: string;
    value: number;
    unit: string;
  }> = [];

  const metrics = [
    { data: ENERGY_CONSUMPTION, type: "energy_consumption", unit: "TWh" },
    { data: EXPORTS, type: "exports", unit: "billion USD" },
    { data: IMPORTS, type: "imports", unit: "billion USD" },
    { data: COPPER_PRODUCTION, type: "copper_production", unit: "kt" },
    { data: LITHIUM_PRODUCTION, type: "lithium_production", unit: "tonnes" },
    { data: COBALT_PRODUCTION, type: "cobalt_production", unit: "tonnes" },
    { data: RARE_EARTH_PRODUCTION, type: "rare_earth_production", unit: "tonnes REO" },
    { data: SILICON_PRODUCTION, type: "silicon_production", unit: "kt" },
    { data: NICKEL_PRODUCTION, type: "nickel_production", unit: "kt" },
  ] as const;

  for (const { data, type, unit } of metrics) {
    for (const [iso3, yearValues] of Object.entries(data)) {
      const countryId = idMap.get(iso3);
      if (!countryId) continue;
      for (const year of YEARS) {
        const value = yearValues[year];
        if (value == null) continue;
        rows.push({ countryId, year, metricType: type, value, unit });
      }
    }
  }

  const BATCH = 500;
  for (let i = 0; i < rows.length; i += BATCH) {
    db.insert(stats).values(rows.slice(i, i + BATCH)).run();
  }

  // Seed energy reserves
  db.delete(energyReserves).run();
  for (const reserve of ENERGY_RESERVES) {
    db.insert(energyReserves).values(reserve).run();
  }

  // Seed pipelines
  db.delete(pipelines).run();
  for (const p of PIPELINES) {
    db.insert(pipelines)
      .values({
        name: p.name,
        type: p.type,
        status: p.status,
        capacityValue: p.capacityValue,
        capacityUnit: p.capacityUnit,
        lengthKm: p.lengthKm,
        countries: p.countries,
        yearBuilt: p.yearBuilt,
        path: JSON.stringify(p.path),
      })
      .run();
  }

  console.log(
    `Seed complete: ${idMap.size} countries, ${rows.length} stat rows, ${ENERGY_RESERVES.length} reserves, ${PIPELINES.length} pipelines`
  );
}

seed();
