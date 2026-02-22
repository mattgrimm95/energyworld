import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema.js";
import { createSqlite } from "./connection.js";

export const db = drizzle(createSqlite(), { schema });
export * from "./schema.js";
