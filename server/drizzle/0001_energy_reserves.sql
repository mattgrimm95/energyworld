CREATE TABLE IF NOT EXISTS `energy_reserves` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `name` text NOT NULL,
  `type` text NOT NULL,
  `subtype` text,
  `lat` real NOT NULL,
  `lng` real NOT NULL,
  `estimated_reserves` real,
  `unit` text,
  `country` text NOT NULL,
  `iso3` text NOT NULL,
  `year` integer
);
