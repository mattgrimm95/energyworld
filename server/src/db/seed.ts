import { db, countries, stats } from "./index.js";
import {
  COUNTRIES,
  YEARS,
  ENERGY_CONSUMPTION,
  EXPORTS,
  IMPORTS,
} from "./seed-data.js";

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

  console.log(
    `Seed complete: ${idMap.size} countries, ${rows.length} stat rows`
  );
}

seed();
