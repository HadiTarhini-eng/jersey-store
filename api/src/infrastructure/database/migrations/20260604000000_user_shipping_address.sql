-- Saved default shipping address per user (AddressSnapshot shape). Optional,
-- set from checkout's "save my info" toggle or the profile page. Idempotent.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "shipping_address" jsonb;
