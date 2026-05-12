import { drizzle } from "drizzle-orm/mysql2"
import mysql from "mysql2/promise"
import "dotenv/config"

export const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DATABASE,
})

export const db = drizzle(connection)
