import { defineConfig } from "drizzle-kit"
import "dotenv/config"

export default defineConfig({
    dialect: "mysql",
    schema: "./src/infrastructure/database/schema.ts",
    out: "./src/infrastructure/database/migrations",
    dbCredentials:{
        host: process.env.DB_HOST as string,
        user: process.env.DB_USER as string,
        password: process.env.DB_PASSWORD as string,
        database: process.env.DATABASE as string,
    },
    migrations:{
        prefix:'timestamp'
    },
    verbose:true,
    strict:true
  })