CREATE TABLE "jewelries" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"name" varchar(100) NOT NULL,
	"category_id" integer NOT NULL,
	"images" jsonb,
	"cover_image" varchar(500),
	"purchase_price" numeric(12, 2) NOT NULL,
	"purchase_date" date NOT NULL,
	"channel_id" integer NOT NULL,
	"seller_name" varchar(100),
	"current_value" numeric(12, 2),
	"value_updated_at" timestamp,
	"specifications" jsonb,
	"quality_grade" varchar(20),
	"certificate_no" varchar(100),
	"certificate_images" jsonb,
	"status" varchar(20) DEFAULT 'collected',
	"remark" text,
	"extra_data" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "jewelry_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"icon" varchar(255),
	"color" varchar(20),
	"sort_order" integer DEFAULT 0,
	"is_system" boolean DEFAULT false,
	"user_id" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "jewelry_value_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"jewelry_id" integer NOT NULL,
	"value" numeric(12, 2) NOT NULL,
	"source" varchar(50),
	"remark" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "purchase_channels" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"icon" varchar(255),
	"sort_order" integer DEFAULT 0,
	"is_system" boolean DEFAULT false,
	"user_id" integer,
	"remark" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_vip" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"vip_level_id" integer NOT NULL,
	"start_at" timestamp NOT NULL,
	"expire_at" timestamp NOT NULL,
	"status" varchar(20) DEFAULT 'active',
	"order_no" varchar(100),
	"pay_amount" numeric(10, 2),
	"pay_method" varchar(50),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "vip_levels" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"level" integer DEFAULT 0 NOT NULL,
	"price" numeric(10, 2) DEFAULT '0',
	"duration" integer DEFAULT 30,
	"max_jewelries" integer DEFAULT 50,
	"max_categories" integer DEFAULT 10,
	"max_channels" integer DEFAULT 10,
	"features" jsonb,
	"icon" varchar(255),
	"color" varchar(20),
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
