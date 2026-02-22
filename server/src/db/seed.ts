import { db, countries, stats } from "./index.js";

async function seed() {
  await db.delete(stats);
  await db.delete(countries);

  const [usa, chn, deu] = await db
    .insert(countries)
    .values([
      { iso3: "USA", name: "United States" },
      { iso3: "CHN", name: "China" },
      { iso3: "DEU", name: "Germany" },
    ])
    .returning({ id: countries.id });

  const countryIds = { USA: usa!.id, CHN: chn!.id, DEU: deu!.id };

  const seedStats = [
    { countryId: countryIds.USA, year: 2022, metricType: "energy_consumption", value: "12.5", unit: "TWh" },
    { countryId: countryIds.USA, year: 2022, metricType: "exports", value: "2.6", unit: "trillion USD" },
    { countryId: countryIds.USA, year: 2022, metricType: "imports", value: "3.2", unit: "trillion USD" },
    { countryId: countryIds.CHN, year: 2022, metricType: "energy_consumption", value: "8.5", unit: "TWh" },
    { countryId: countryIds.CHN, year: 2022, metricType: "exports", value: "3.6", unit: "trillion USD" },
    { countryId: countryIds.CHN, year: 2022, metricType: "imports", value: "2.7", unit: "trillion USD" },
    { countryId: countryIds.DEU, year: 2022, metricType: "energy_consumption", value: "2.4", unit: "TWh" },
    { countryId: countryIds.DEU, year: 2022, metricType: "exports", value: "1.6", unit: "trillion USD" },
    { countryId: countryIds.DEU, year: 2022, metricType: "imports", value: "1.5", unit: "trillion USD" },
  ];

  await db.insert(stats).values(seedStats);
  console.log("Seed complete: 3 countries, 9 stats");
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
