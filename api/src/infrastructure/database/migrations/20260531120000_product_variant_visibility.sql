-- Adds admin-controlled storefront visibility flag for product variants
-- (sizes). Independent of `is_active` (soft-delete). When false, the size
-- is hidden from the storefront variant picker entirely. When true and
-- stock is 0, the storefront renders the size disabled with a toast.
-- Idempotent so reseeding is safe.
ALTER TABLE "product_variants" ADD COLUMN IF NOT EXISTS "is_visible" boolean DEFAULT true NOT NULL;
