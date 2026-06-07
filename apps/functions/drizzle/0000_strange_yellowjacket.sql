CREATE TABLE "Kotae" (
	"id" text PRIMARY KEY NOT NULL,
	"odaiId" text NOT NULL,
	"content" text NOT NULL,
	"createdBy" text NOT NULL,
	"createdAt" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Odai" (
	"id" text PRIMARY KEY NOT NULL,
	"teamId" text NOT NULL,
	"title" text NOT NULL,
	"type" text NOT NULL,
	"status" text NOT NULL,
	"dueDate" text NOT NULL,
	"imageUrl" text,
	"createdBy" text NOT NULL,
	"createdAt" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Result" (
	"id" text PRIMARY KEY NOT NULL,
	"odaiId" text NOT NULL,
	"kotaeId" text NOT NULL,
	"type" text NOT NULL,
	"point" integer NOT NULL,
	"rank" integer NOT NULL,
	"createdAt" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Team" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Vote" (
	"id" text PRIMARY KEY NOT NULL,
	"odaiId" text NOT NULL,
	"kotaeId" text NOT NULL,
	"rank" integer NOT NULL,
	"createdBy" text NOT NULL,
	"createdAt" text NOT NULL
);
