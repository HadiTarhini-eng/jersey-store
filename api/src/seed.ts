import { db, connection } from './infrastructure/database/db.js'
import { eq } from 'drizzle-orm'
import { users } from './infrastructure/database/schema.js'
import { User } from './core/entities/user.js'

const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    ?? 'admin@admin.com'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'P@ssw0rd'

try {
    const existing = await db
        .select()
        .from(users)
        .where(eq(users.email, ADMIN_EMAIL))
        .limit(1)

    if (existing.length === 0) {
        const admin = new User({
            firstName:   'Admin',
            lastName:    'Admin',
            phone:       '0000000000',
            email:       ADMIN_EMAIL,
            password:    ADMIN_PASSWORD,
            role:        'Admin',
        })

        await db.insert(users).values({
            id: admin.id,
            firstName: admin.firstName,
            lastName: admin.lastName,
            phone: admin.phone,
            email: admin.email,
            passwordHash: admin.passwordHash,
            role: admin.role,
            profileImageUrl: admin.profileImageUrl,
            isActive: admin.isActive,
            createdAt: admin.createdAt,
            updatedAt: admin.updatedAt,
        })
        console.log(`Admin user created: ${ADMIN_EMAIL}`)
    } else {
        console.log('Admin user already exists — skipping seed')
    }
} catch (err) {
    console.error('Seeding failed:', err)
    process.exit(1)
} finally {
    await connection.end()
}
