import { db, countries, stats, energyReserves } from "./index.js";
import {
  COUNTRIES,
  YEARS,
  ENERGY_CONSUMPTION,
  EXPORTS,
  IMPORTS,
} from "./seed-data.js";
import { ENERGY_RESERVES } from "./reserves-data.js";

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
  ] as const;

  const EXTRAPOLATE_GROWTH: Record<string, number> = {
    energy_consumption: 1.015,
    exports: 1.03,
    imports: 1.03,
  };

  for (const { data, type, unit } of metrics) {
    const growth = EXTRAPOLATE_GROWTH[type] ?? 1.02;
    for (const [iso3, yearValues] of Object.entries(data)) {
      const countryId = idMap.get(iso3);
      if (!countryId) continue;
      const sortedYears = Object.keys(yearValues)
        .map(Number)
        .filter((y) => !Number.isNaN(y))
        .sort((a, b) => a - b);
      const lastKnownYear = sortedYears[sortedYears.length - 1] ?? 2022;
      const lastValue = yearValues[lastKnownYear] ?? 0;
      for (const year of YEARS) {
        let value = yearValues[year];
        if (value == null && year > lastKnownYear) {
          value = Math.round(
            lastValue * Math.pow(growth, year - lastKnownYear)
          );
        }
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

  console.log(
    `Seed complete: ${idMap.size} countries, ${rows.length} stat rows, ${ENERGY_RESERVES.length} reserves`
  );
}

seed();
