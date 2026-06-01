-- Flat delivery fee charged at checkout (below the free-shipping threshold),
-- admin-configurable and waived by a free-delivery coupon. Idempotent.
ALTER TABLE "site_config" ADD COLUMN IF NOT EXISTS "shipping_fee" numeric(12, 2) DEFAULT '0' NOT NULL;
