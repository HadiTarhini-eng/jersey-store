ALTER TABLE "site_config" ADD COLUMN "hero_design_your_own_label" varchar(80);--> statement-breakpoint
ALTER TABLE "site_config" ADD COLUMN "hero_design_your_own_href" varchar(255);--> statement-breakpoint
ALTER TABLE "site_config" ADD COLUMN "filter_min_price" numeric(12, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_config" ADD COLUMN "filter_max_price" numeric(12, 2) DEFAULT '1000' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_config" ADD COLUMN "sort_options" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "site_config" ADD COLUMN "cart_empty_message" varchar(255);--> statement-breakpoint
ALTER TABLE "site_config" ADD COLUMN "cart_empty_cta_label" varchar(80);--> statement-breakpoint
ALTER TABLE "site_config" ADD COLUMN "cart_empty_cta_href" varchar(255);