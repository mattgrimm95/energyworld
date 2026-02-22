import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import { eq, and } from "drizzle-orm";
import { db, stats, countries } from "../db/index.js";

const METRIC_TYPES = ["energy_consumption", "exports", "imports"] as const;

export async function statsRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  app.get<{
    Querystring: { country?: string; metrics?: string; year?: string };
  }>("/stats", async (request, reply) => {
    const { country: countryCode, metrics: metricsParam, year: yearParam } = request.query;

    if (!countryCode) {
      return reply.status(400).send({ error: "country (ISO3) is required" });
    }

    const country = await db
      .select()
      .from(countries)
      .where(eq(countries.iso3, countryCode.toUpperCase()))
      .limit(1)
      .then((rows) => rows[0]);

    if (!country) {
      return reply.status(404).send({ error: "Country not found" });
    }

    const requestedMetrics = metricsParam
      ? metricsParam.split(",").map((m) => m.trim().toLowerCase())
      : [...METRIC_TYPES];
    const validMetrics = requestedMetrics.filter((m) =>
      METRIC_TYPES.includes(m as (typeof METRIC_TYPES)[number])
    );
    const yearFilter = yearParam ? parseInt(yearParam, 10) : null;

    const conditions = [eq(stats.countryId, country.id)];
    if (yearFilter && !Number.isNaN(yearFilter)) {
      conditions.push(eq(stats.year, yearFilter));
    }

    const rows = await db
      .select()
      .from(stats)
      .where(and(...conditions));

    const filtered = rows.filter((r) =>
      validMetrics.length ? validMetrics.includes(r.metricType) : true
    );

    return reply.send({
      country: { iso3: country.iso3, name: country.name },
      stats: filtered.map((s) => ({
        year: s.year,
        metricType: s.metricType,
        value: Number(s.value),
        unit: s.unit,
      })),
    });
  });

  app.get<{
    Querystring: { metric?: string; year?: string };
  }>("/stats/choropleth", async (request, reply) => {
    const { metric = "energy_consumption", year: yearParam } = request.query;

    if (!METRIC_TYPES.includes(metric as (typeof METRIC_TYPES)[number])) {
      return reply
        .status(400)
        .send({ error: `Invalid metric. Use: ${METRIC_TYPES.join(", ")}` });
    }

    const year = yearParam ? parseInt(yearParam, 10) : 2022;

    const rows = await db
      .select({
        iso3: countries.iso3,
        name: countries.name,
        value: stats.value,
      })
      .from(stats)
      .innerJoin(countries, eq(stats.countryId, countries.id))
      .where(and(eq(stats.metricType, metric), eq(stats.year, year)));

    return reply.send({ metric, year, data: rows });
  });
}
