-- Supabase Auth becomes the source of truth for authentication.
--
-- Non-destructive by design: existing password hashes are left untouched so the
-- legacy login can be re-enabled during the migration window. Only two changes:
--   1. users.supabase_user_id links an app profile to its Supabase Auth user.
--   2. users.password_hash becomes nullable — Supabase-authenticated accounts
--      never carry a local hash.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "supabase_user_id" uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_supabase_user_id_unique'
  ) THEN
    ALTER TABLE "users" ADD CONSTRAINT "users_supabase_user_id_unique" UNIQUE ("supabase_user_id");
  END IF;
END $$;

ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL;
