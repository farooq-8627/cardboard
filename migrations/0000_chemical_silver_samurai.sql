CREATE TABLE "biometric_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"timestamp" integer NOT NULL,
	"attention_score" integer,
	"heart_rate" integer,
	"emotion" text,
	"emotion_confidence" integer,
	"eye_tracking_data" jsonb
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"created_at" integer NOT NULL,
	"connection_type" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"metrics" jsonb,
	CONSTRAINT "sessions_session_id_unique" UNIQUE("session_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
