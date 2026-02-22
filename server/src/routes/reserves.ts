import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import { db, energyReserves } from "../db/index.js";
import { eq } from "drizzle-orm";

const VALID_TYPES = ["oil", "natural_gas", "coal", "oil_sands", "shale"] as const;

export async function reservesRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  app.get<{
    Querystring: { type?: string };
  }>("/reserves", async (request, reply) => {
    const { type } = request.query;

    let rows;
    if (type && VALID_TYPES.includes(type as (typeof VALID_TYPES)[number])) {
      rows = await db
        .select()
        .from(energyReserves)
        .where(eq(energyReserves.type, type));
    } else {
      rows = await db.select().from(energyReserves);
    }

    return reply.send(rows);
  });
}
