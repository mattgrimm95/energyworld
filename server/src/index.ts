import Fastify from "fastify";
import cors from "@fastify/cors";
import { countriesRoutes } from "./routes/countries.js";
import { statsRoutes } from "./routes/stats.js";
import { reservesRoutes } from "./routes/reserves.js";
import { pipelinesRoutes } from "./routes/pipelines.js";

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: true,
});

await app.register(countriesRoutes, { prefix: "/api" });
await app.register(statsRoutes, { prefix: "/api" });
await app.register(reservesRoutes, { prefix: "/api" });
await app.register(pipelinesRoutes, { prefix: "/api" });

const port = Number(process.env.PORT) || 3000;
try {
  await app.listen({ port, host: "0.0.0.0" });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
