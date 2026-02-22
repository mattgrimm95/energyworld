import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";

const connectionString =
  process.env.DATABASE_URL ?? "postgresql://energyworld:energyworld@localhost:5432/energyworld";

const pool = new pg.Pool({ connectionString });
const db = drizzle(pool);

async function run() {
  await migrate(db, { migrationsFolder: "./drizzle" });
  await pool.end();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
