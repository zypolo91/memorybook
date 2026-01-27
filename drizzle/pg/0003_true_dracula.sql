CREATE TABLE "blocks" (
	"id" serial PRIMARY KEY NOT NULL,
	"blocker_id" integer NOT NULL,
	"blocked_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "search_keywords" (
	"id" serial PRIMARY KEY NOT NULL,
	"keyword" varchar(100) NOT NULL,
	"search_count" integer DEFAULT 1,
	"last_searched_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "search_keywords_keyword_unique" UNIQUE("keyword")
);
