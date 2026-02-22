CREATE TABLE IF NOT EXISTS `countries` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `iso3` text NOT NULL,
  `name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `countries_iso3_unique` ON `countries` (`iso3`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `stats` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `country_id` integer NOT NULL REFERENCES `countries`(`id`) ON DELETE CASCADE,
  `year` integer NOT NULL,
  `metric_type` text NOT NULL,
  `value` real NOT NULL,
  `unit` text
);
