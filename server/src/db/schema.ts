import { sqliteTable, integer, text, real } from "drizzle-orm/sqlite-core";

export const countries = sqliteTable("countries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  iso3: text("iso3").notNull().unique(),
  name: text("name").notNull(),
});

export const stats = sqliteTable("stats", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  countryId: integer("country_id")
    .notNull()
    .references(() => countries.id, { onDelete: "cascade" }),
  year: integer("year").notNull(),
  metricType: text("metric_type").notNull(),
  value: real("value").notNull(),
  unit: text("unit"),
});

export const energyReserves = sqliteTable("energy_reserves", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  type: text("type").notNull(),
  subtype: text("subtype"),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  estimatedReserves: real("estimated_reserves"),
  unit: text("unit"),
  country: text("country").notNull(),
  iso3: text("iso3").notNull(),
  year: integer("year"),
});

export type Country = typeof countries.$inferSelect;
export type NewCountry = typeof countries.$inferInsert;
export type Stat = typeof stats.$inferSelect;
export type NewStat = typeof stats.$inferInsert;
export type EnergyReserve = typeof energyReserves.$inferSelect;
export type NewEnergyReserve = typeof energyReserves.$inferInsert;
