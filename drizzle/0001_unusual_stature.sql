CREATE TABLE "schedules" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text,
	"name" text NOT NULL,
	"method" text DEFAULT 'GET' NOT NULL,
	"url" text NOT NULL,
	"headers" jsonb DEFAULT '[]'::jsonb,
	"queryParams" jsonb DEFAULT '[]'::jsonb,
	"body" jsonb,
	"auth" jsonb,
	"config" jsonb NOT NULL,
	"stats" jsonb,
	"status" text DEFAULT 'idle' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;