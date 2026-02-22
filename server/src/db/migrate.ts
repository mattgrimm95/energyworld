import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createSqlite } from "./connection.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const sqlite = createSqlite();
const db = drizzle(sqlite);

migrate(db, { migrationsFolder: resolve(__dirname, "../../drizzle") });
sqlite.close();
console.log("Migrations complete.");
