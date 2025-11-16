CREATE TABLE "chapter_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"courseId" varchar NOT NULL,
	"chapterId" integer NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "paymentRecord" (
	"id" serial PRIMARY KEY NOT NULL,
	"customerId" varchar,
	"sessionId" varchar
);
--> statement-breakpoint
CREATE TABLE "roadmaps" (
	"id" serial PRIMARY KEY NOT NULL,
	"roadmapId" varchar NOT NULL,
	"topic" varchar NOT NULL,
	"skillLevel" varchar NOT NULL,
	"structure" json NOT NULL,
	"prerequisites" json,
	"createdBy" varchar NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "studyMaterial" (
	"id" serial PRIMARY KEY NOT NULL,
	"courseId" varchar NOT NULL,
	"courseType" varchar NOT NULL,
	"topic" varchar NOT NULL,
	"difficultyLevel" varchar DEFAULT 'Easy',
	"courseLayout" json,
	"createdBy" varchar NOT NULL,
	"status" varchar DEFAULT 'Generating'
);
--> statement-breakpoint
CREATE TABLE "studyTypeContent" (
	"id" serial PRIMARY KEY NOT NULL,
	"courseId" varchar NOT NULL,
	"content" json,
	"type" varchar NOT NULL,
	"status" varchar DEFAULT 'Generating'
);
--> statement-breakpoint
CREATE TABLE "translation_cache" (
	"id" serial PRIMARY KEY NOT NULL,
	"sourceText" text NOT NULL,
	"targetLanguage" varchar NOT NULL,
	"translatedText" text NOT NULL,
	"contentType" varchar,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"email" varchar NOT NULL,
	"isMember" boolean DEFAULT false,
	"createdAt" timestamp NOT NULL,
	"customerId" varchar DEFAULT ''
);
--> statement-breakpoint
CREATE TABLE "video_content" (
	"id" serial PRIMARY KEY NOT NULL,
	"courseId" varchar NOT NULL,
	"chapterId" integer NOT NULL,
	"videoUrl" varchar,
	"thumbnailUrl" varchar,
	"status" varchar DEFAULT 'Pending',
	"language" varchar DEFAULT 'en',
	"duration" integer,
	"script" json,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp
);
