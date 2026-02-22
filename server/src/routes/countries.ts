import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import { db, countries } from "../db/index.js";

export async function countriesRoutes(
  app: FastifyInstance,
  _opts: FastifyPluginOptions
) {
  app.get("/countries", async (_request, reply) => {
    const list = await db.select().from(countries).orderBy(countries.name);
    return reply.send(list);
  });
}
