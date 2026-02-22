import { pgTable, serial, varchar, integer, decimal, text } from "drizzle-orm/pg-core";

export const countries = pgTable("countries", {
  id: serial("id").primaryKey(),
  iso3: varchar("iso3", { length: 3 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
});

export const stats = pgTable("stats", {
  id: serial("id").primaryKey(),
  countryId: integer("country_id")
    .notNull()
    .references(() => countries.id, { onDelete: "cascade" }),
  year: integer("year").notNull(),
  metricType: varchar("metric_type", { length: 64 }).notNull(),
  value: decimal("value", { precision: 20, scale: 4 }).notNull(),
  unit: varchar("unit", { length: 32 }),
});

export type Country = typeof countries.$inferSelect;
export type NewCountry = typeof countries.$inferInsert;
export type Stat = typeof stats.$inferSelect;
export type NewStat = typeof stats.$inferInsert;
