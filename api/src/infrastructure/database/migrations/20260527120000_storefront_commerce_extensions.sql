ALTER TABLE "products" ADD COLUMN "compare_at_price" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "printable" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "cart_items" ADD COLUMN "custom_name" varchar(40);--> statement-breakpoint
ALTER TABLE "cart_items" ADD COLUMN "custom_number" varchar(8);--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "guest_email" varchar(320);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "coupon_code" varchar(80);--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "custom_name" varchar(40);--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "custom_number" varchar(8);
