-- Adds a JSONB map for per-section homepage visibility flags. The map is
-- keyed by section id (e.g. `shop-by-sport`); missing keys default to
-- "visible" on the client, so an empty `{}` leaves every section on.
-- Idempotent via IF NOT EXISTS so reseeding is safe.
ALTER TABLE "site_config" ADD COLUMN IF NOT EXISTS "homepage_sections_visible" jsonb DEFAULT '{}'::jsonb NOT NULL;
