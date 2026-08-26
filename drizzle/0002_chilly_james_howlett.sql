CREATE TABLE "schedule_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"scheduleId" text NOT NULL,
	"userId" text,
	"runIndex" integer DEFAULT 1 NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"method" text DEFAULT 'GET' NOT NULL,
	"url" text NOT NULL,
	"status" integer NOT NULL,
	"statusText" text DEFAULT 'OK' NOT NULL,
	"duration" integer DEFAULT 0 NOT NULL,
	"responseSize" integer DEFAULT 0 NOT NULL,
	"responseBody" text DEFAULT '',
	"isError" boolean DEFAULT false NOT NULL,
	"retryAttempt" integer DEFAULT 0,
	"executedBy" text DEFAULT 'cloud-cron' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "schedules" ADD COLUMN "currentRunIndex" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "schedules" ADD COLUMN "lastRunAt" timestamp;--> statement-breakpoint
ALTER TABLE "schedules" ADD COLUMN "nextRunAt" timestamp;--> statement-breakpoint
ALTER TABLE "schedule_logs" ADD CONSTRAINT "schedule_logs_scheduleId_schedules_id_fk" FOREIGN KEY ("scheduleId") REFERENCES "public"."schedules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_logs" ADD CONSTRAINT "schedule_logs_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;