CREATE TABLE IF NOT EXISTS "countries" (
  "id" serial PRIMARY KEY NOT NULL,
  "iso3" varchar(3) NOT NULL UNIQUE,
  "name" varchar(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS "stats" (
  "id" serial PRIMARY KEY NOT NULL,
  "country_id" integer NOT NULL REFERENCES "countries"("id") ON DELETE CASCADE,
  "year" integer NOT NULL,
  "metric_type" varchar(64) NOT NULL,
  "value" decimal(20, 4) NOT NULL,
  "unit" varchar(32)
);
