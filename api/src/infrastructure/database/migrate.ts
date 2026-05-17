import { migrate } from 'drizzle-orm/mysql2/migrator'
import { db, connection } from './db.js'
import path from 'path'

const migrationsFolder = path.resolve(process.cwd(), 'src/infrastructure/database/migrations')

console.log(`Running migrations from: ${migrationsFolder}`)

try {
    await migrate(db, { migrationsFolder })
    console.log('Migrations completed successfully')
} catch (err) {
    console.error('Migration failed:', err)
    process.exit(1)
} finally {
    await connection.end()
}
