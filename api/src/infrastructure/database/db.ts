import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import "dotenv/config"

export const connection = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export const db = drizzle(connection);
