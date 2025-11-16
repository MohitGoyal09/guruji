CREATE TABLE "roadmap_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"roadmapId" varchar NOT NULL,
	"userId" varchar NOT NULL,
	"topicId" varchar NOT NULL,
	"completed" boolean DEFAULT false,
	"completedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp
);
