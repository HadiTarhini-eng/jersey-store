-- Per-social visibility toggles for the storefront. Keyed map (e.g.
-- `{ "instagram": false }`) mirroring `homepage_sections_visible`. Missing keys
-- default to visible on the client, so an empty `{}` keeps every social on.
-- Idempotent so reseeding / re-running is safe.
ALTER TABLE "site_config" ADD COLUMN IF NOT EXISTS "social_links_visible" jsonb DEFAULT '{}'::jsonb NOT NULL;
