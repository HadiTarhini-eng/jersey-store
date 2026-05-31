/**
 * Targeted footer refresh — replaces only the `footer-column` ui_content rows
 * with the current set (mirrors the footer block in seed-all.ts). Used to apply
 * footer link changes to a live DB WITHOUT a full reseed, so customised data in
 * other slots (teams, offers, hero, etc.) is left untouched.
 *
 *   bun src/update-footer.ts
 */
import { eq } from 'drizzle-orm'
import { db, connection } from './infrastructure/database/db.js'
import { uiContent } from './infrastructure/database/schema.js'

const COLUMNS = [
  {
    slot: 'footer-column', sortOrder: 0,
    payload: {
      title: 'Shop',
      links: [
        { label: 'All Items',    href: '/shop' },
        { label: 'Football',     href: '/shop?sport=football' },
        { label: 'Basketball',   href: '/shop?sport=basketball' },
        { label: 'Gym',          href: '/shop?sport=gym' },
        { label: 'New Arrivals', href: '/shop?badge=New' },
        { label: 'Sale',         href: '/shop?badge=Sale' },
      ],
    },
  },
  {
    slot: 'footer-column', sortOrder: 1,
    payload: {
      title: 'Account',
      links: [
        { label: 'Login',    href: '/login' },
        { label: 'Register', href: '/register' },
        { label: 'Profile',  href: '/profile' },
      ],
    },
  },
  {
    slot: 'footer-column', sortOrder: 2,
    payload: {
      title: 'Support',
      links: [
        { label: 'FAQ',             href: '/faq' },
        { label: 'Shipping Policy', href: '/shipping-policy' },
        { label: 'Returns',         href: '/returns' },
        { label: 'Size Guide',      href: '/size-guide' },
        { label: 'Contact Us',      href: '/contact' },
      ],
    },
  },
  {
    slot: 'footer-column', sortOrder: 3,
    payload: {
      title: 'Company',
      links: [
        { label: 'About Us',         href: '/about' },
        { label: 'Company',          href: '/company' },
        { label: 'Privacy Policy',   href: '/privacy' },
        { label: 'Terms of Service', href: '/terms' },
      ],
    },
  },
]

async function main() {
  await db.transaction(async (tx) => {
    await tx.delete(uiContent).where(eq(uiContent.slot, 'footer-column'))
    await tx.insert(uiContent).values(COLUMNS)
  })
  console.log(`✅ Footer refreshed — ${COLUMNS.length} columns set.`)
  await connection.end()
}

main().catch(async (err) => {
  console.error('Footer update failed (rolled back):', err)
  await connection.end()
  process.exit(1)
})
