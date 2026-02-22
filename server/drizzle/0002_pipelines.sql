CREATE TABLE IF NOT EXISTS `pipelines` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `name` text NOT NULL,
  `type` text NOT NULL,
  `status` text NOT NULL,
  `capacity_value` real,
  `capacity_unit` text,
  `length_km` real,
  `countries` text NOT NULL,
  `year_built` integer,
  `path` text NOT NULL
);
