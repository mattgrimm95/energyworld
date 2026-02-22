import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import { db, pipelines } from "../db/index.js";
import { eq } from "drizzle-orm";

const VALID_TYPES = ["oil", "gas", "products", "lng"] as const;
const VALID_STATUSES = [
  "operational",
  "planned",
  "decommissioned",
  "under_construction",
] as const;

export async function pipelinesRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  app.get<{
    Querystring: { type?: string; status?: string };
  }>("/pipelines", async (request, reply) => {
    const { type, status } = request.query;

    let rows;
    if (type && VALID_TYPES.includes(type as (typeof VALID_TYPES)[number])) {
      rows = await db
        .select()
        .from(pipelines)
        .where(eq(pipelines.type, type));
    } else if (
      status &&
      VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])
    ) {
      rows = await db
        .select()
        .from(pipelines)
        .where(eq(pipelines.status, status));
    } else {
      rows = await db.select().from(pipelines);
    }

    const parsed = rows.map((r) => ({
      ...r,
      path: JSON.parse(r.path) as [number, number][],
    }));

    return reply.send(parsed);
  });
}
