import { NextResponse } from "next/server";
import { db } from "@/config/db";
import { ROADMAPS_TABLE } from "@/config/schema";
import { eq } from "drizzle-orm";
import { OpenAI } from "openai";
import { TOPIC_EXPLANATION_PROMPT } from "@/lib/ai/roadmapPrompts";
import { RoadmapStructure, RoadmapSubtopic } from "@/Types/roadmap";

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
});

// Helper to find a topic by ID in the roadmap structure
function findTopicById(
  structure: RoadmapStructure,
  topicId: string
): RoadmapSubtopic | null {
  for (const level of structure.levels) {
    for (const section of level.sections) {
      const topic = section.subtopics.find((sub) => sub.id === topicId);
      if (topic) return topic;
    }
  }
  return null;
}

// POST: Generate AI explanation for a specific topic
export async function POST(
  req: Request,
  {
    params,
  }: { params: Promise<{ roadmapId: string; topicId: string }> }
) {
  try {
    const { roadmapId, topicId } = await params;

    // Fetch the roadmap
    const roadmaps = await db
      .select()
      .from(ROADMAPS_TABLE)
      .where(eq(ROADMAPS_TABLE.roadmapId, roadmapId));

    if (roadmaps.length === 0) {
      return NextResponse.json(
        { error: "Roadmap not found" },
        { status: 404 }
      );
    }

    const roadmap = roadmaps[0];
    const structure = roadmap.structure as RoadmapStructure;

    // Find the specific topic
    const topic = findTopicById(structure, topicId);

    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    // Generate explanation using AI
    const prompt = `${TOPIC_EXPLANATION_PROMPT}

Topic Title: ${topic.title}
Topic Description: ${topic.description || "No description provided"}

Provide a comprehensive explanation of this topic with examples, key concepts, common mistakes, and practical tips.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert educator who explains complex topics clearly and comprehensively. Provide only valid JSON responses.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error("No content received from AI");
    }

    const explanationData = JSON.parse(content);

    return NextResponse.json(
      {
        topic: {
          id: topic.id,
          title: topic.title,
          description: topic.description,
        },
        explanation: explanationData,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error generating explanation:", error);
    return NextResponse.json(
      { error: "Failed to generate explanation" },
      { status: 500 }
    );
  }
}
