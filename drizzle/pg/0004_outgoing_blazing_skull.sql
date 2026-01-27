CREATE TABLE "user_preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"reduced_categories" jsonb DEFAULT '[]'::jsonb,
	"reduced_topics" jsonb DEFAULT '[]'::jsonb,
	"blocked_users" jsonb DEFAULT '[]'::jsonb,
	"not_interested_posts" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "user_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "user_view_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"post_id" integer NOT NULL,
	"view_duration" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "reply_to_id" integer;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "file_url" varchar(500);--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "file_name" varchar(255);--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "file_size" integer;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "collection_id" integer;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "is_deleted" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "is_recalled" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "recalled_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "mobile" varchar(20);