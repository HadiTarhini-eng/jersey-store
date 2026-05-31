-- Tracks how many items each order applied a coupon to. The coupon service
-- sums this column across a user's prior orders to enforce the per-user
-- item cap (`itemsAllowedPerUser` on the coupon payload). 0 when no coupon
-- was used. Idempotent so reseeding is safe.
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "coupon_items_applied" integer DEFAULT 0 NOT NULL;
