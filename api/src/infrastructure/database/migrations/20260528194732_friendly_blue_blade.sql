-- This migration was generated to bring the journal back in sync with a DB
-- that had drifted ahead via hand-applied changes. Every ADD COLUMN is now
-- guarded with `IF NOT EXISTS` so the already-applied columns become no-ops
-- and only the genuinely new ones (`rejection_reason`, `admin_message_read_at`)
-- actually land. `DROP NOT NULL` is naturally idempotent.
ALTER TABLE "orders" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "cart_items" ADD COLUMN IF NOT EXISTS "custom_name" varchar(40);--> statement-breakpoint
ALTER TABLE "cart_items" ADD COLUMN IF NOT EXISTS "custom_number" varchar(8);--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "custom_name" varchar(40);--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "custom_number" varchar(8);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "guest_email" varchar(320);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "coupon_code" varchar(80);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "rejection_reason" varchar(1000);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "admin_message_read_at" timestamp;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "compare_at_price" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "printable" boolean DEFAULT false NOT NULL;
