/**
 * Targeted data wipe — clears transactional/catalog/customer data while keeping
 * the tables, plus site config, categories, attribute definitions, shipping
 * methods, admin accounts, and non-targeted ui_content (hero/nav/footer/sport/
 * kit-category/offer-banner/featured-section/coupons) intact.
 *
 * Deletes (per request, with dependents since the schema has no FK cascades):
 *   1. All products            → products + variants, attachments, specs,
 *                                 assigned attributes & options, variant attr
 *                                 values, reviews, offer_products links
 *   2. All offer strips        → ui_content slot 'offer-strip'
 *   3. All teams               → ui_content slot 'team'
 *   4. All orders              → orders + order_items
 *   5. All revenue data        → analytics_daily
 *   6. All customers           → users with role <> 'Admin', plus all carts +
 *                                 cart_items (which reference now-deleted data)
 *
 * SAFETY: dry-run by default (prints matched row counts only). Pass `--yes` to
 * actually perform the deletion. All deletes run inside one transaction, so a
 * failure rolls everything back.
 *
 *   bun src/wipe-data.ts          # dry run — counts only
 *   bun src/wipe-data.ts --yes    # perform the deletion
 */
import { inArray, ne, sql } from 'drizzle-orm'
import { db, connection } from './infrastructure/database/db.js'
import {
  attachments,
  cartItems,
  carts,
  offerProducts,
  orderItems,
  orders,
  productAssignedAttributes,
  productAttributeOptions,
  productSpecifications,
  productVariants,
  products,
  reviews,
  uiContent,
  users,
  variantAttributeValues,
  analyticsDaily,
} from './infrastructure/database/schema.js'

const UI_SLOTS_TO_CLEAR = ['team', 'offer-strip']

// Ordered child → parent. No FK constraints exist, so order is cosmetic, but it
// keeps intent readable. `where` omitted = delete every row in the table.
const PLAN: { label: string; table: any; where?: any }[] = [
  { label: 'order_items',                 table: orderItems },
  { label: 'orders',                      table: orders },
  { label: 'cart_items',                  table: cartItems },
  { label: 'carts',                       table: carts },
  { label: 'reviews',                     table: reviews },
  { label: 'offer_products',              table: offerProducts },
  { label: 'variant_attribute_values',    table: variantAttributeValues },
  { label: 'product_attribute_options',   table: productAttributeOptions },
  { label: 'product_assigned_attributes', table: productAssignedAttributes },
  { label: 'product_specifications',      table: productSpecifications },
  { label: 'attachments',                 table: attachments },
  { label: 'product_variants',            table: productVariants },
  { label: 'products',                    table: products },
  { label: 'analytics_daily',             table: analyticsDaily },
  { label: "ui_content (team, offer-strip)", table: uiContent, where: inArray(uiContent.slot, UI_SLOTS_TO_CLEAR) },
  { label: 'users (customers, role != Admin)', table: users, where: ne(users.role, 'Admin') },
]

async function count(table: any, where?: any): Promise<number> {
  const base = db.select({ c: sql<number>`count(*)::int` }).from(table)
  const rows = where ? await base.where(where) : await base
  return Number(rows[0]?.c ?? 0)
}

async function main() {
  const apply = process.argv.includes('--yes')

  console.log(apply ? '\n⚠️  APPLYING DELETIONS\n' : '\n— DRY RUN (no --yes flag): showing matched counts only —\n')
  for (const step of PLAN) {
    const n = await count(step.table, step.where)
    console.log(`  ${step.label.padEnd(42)} ${String(n).padStart(6)} row(s) ${apply ? 'to delete' : 'matched'}`)
  }

  if (!apply) {
    console.log('\nNothing deleted. Re-run with `--yes` to perform the wipe.\n')
    await connection.end()
    return
  }

  await db.transaction(async (tx) => {
    for (const step of PLAN) {
      if (step.where) await tx.delete(step.table).where(step.where)
      else await tx.delete(step.table)
    }
  })

  console.log('\n✅ Wipe complete. Remaining (kept) row counts:')
  console.log(`  users (admins kept):     ${await count(users)}`)
  console.log(`  products:                ${await count(products)}`)
  console.log(`  orders:                  ${await count(orders)}`)
  console.log(`  ui_content (team/strip): ${await count(uiContent, inArray(uiContent.slot, UI_SLOTS_TO_CLEAR))}`)
  console.log(`  analytics_daily:         ${await count(analyticsDaily)}\n`)
  await connection.end()
}

main().catch(async (err) => {
  console.error('Wipe failed (transaction rolled back):', err)
  await connection.end()
  process.exit(1)
})
