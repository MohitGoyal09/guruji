import {
  boolean,
  integer,
  json,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const USER_TABLE = pgTable("users", {
  id: serial().primaryKey(),
  name: varchar().notNull(),
  email: varchar().notNull(),
  isMember: boolean().default(false),
  createdAt: timestamp().notNull(),
  customerId : varchar().default(''),
});

export const STUDY_MATERIAL_TABLE = pgTable("studyMaterial", {
  id: serial().primaryKey(),
  courseId: varchar().notNull(),
  courseType: varchar().notNull(),
  topic: varchar().notNull(),
  difficultyLevel: varchar().default("Easy"),
  courseLayout: json(),
  createdBy: varchar().notNull(),
  status: varchar().default("Generating"),
});

export const CHAPTER_NOTES_TABLE = pgTable("chapter_notes", {
  id: serial().primaryKey(),
  courseId: varchar().notNull(),
  chapterId: integer().notNull(),
  notes: text(),
});

export const STUDY_TYPE_CONTENT_TABLE = pgTable('studyTypeContent', {
  id: serial().primaryKey(),
  courseId: varchar().notNull(),
  content:json(),
  type: varchar().notNull(),
  status: varchar().default("Generating"),
});

export const PAYMENT_RECORD_TABLE = pgTable("paymentRecord", {
  id: serial().primaryKey(),
  customerId: varchar(),
  sessionId: varchar(),
});

export const VIDEO_CONTENT_TABLE = pgTable("video_content", {
  id: serial().primaryKey(),
  courseId: varchar().notNull(),
  chapterId: integer().notNull(),
  videoUrl: varchar(),
  thumbnailUrl: varchar(),
  status: varchar().default("Pending"), // Pending, Generating, Ready, Failed
  language: varchar().default("en"),
  duration: integer(), // in seconds
  script: json(), // Generated script structure
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp(),
});

export const TRANSLATION_CACHE_TABLE = pgTable("translation_cache", {
  id: serial().primaryKey(),
  sourceText: text().notNull(),
  targetLanguage: varchar().notNull(),
  translatedText: text().notNull(),
  contentType: varchar(), // 'script', 'narration', etc.
  createdAt: timestamp().defaultNow().notNull(),
});

export const ROADMAPS_TABLE = pgTable("roadmaps", {
  id: serial().primaryKey(),
  roadmapId: varchar().notNull(),
  topic: varchar().notNull(),
  skillLevel: varchar().notNull(), // 'beginner' | 'intermediate' | 'pro'
  structure: json().notNull(), // hierarchical tree: Levels → Sections → Subtopics
  prerequisites: json(), // prerequisites map for each topic
  createdBy: varchar().notNull(),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp(),
});

export const ROADMAP_PROGRESS_TABLE = pgTable("roadmap_progress", {
  id: serial().primaryKey(),
  roadmapId: varchar().notNull(),
  userId: varchar().notNull(), // user email from Clerk
  topicId: varchar().notNull(), // subtopic ID
  completed: boolean().default(false),
  completedAt: timestamp(),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp(),
});