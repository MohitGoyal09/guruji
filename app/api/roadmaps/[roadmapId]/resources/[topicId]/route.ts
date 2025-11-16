import { NextResponse } from "next/server";
import { db } from "@/config/db";
import { ROADMAPS_TABLE } from "@/config/schema";
import { eq } from "drizzle-orm";
import { OpenAI } from "openai";
import { RESOURCE_GENERATION_PROMPT } from "@/lib/ai/roadmapPrompts";
import { RoadmapStructure, RoadmapSubtopic } from "@/Types/roadmap";

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
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

// POST: Generate resources for a specific topic
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

    // Generate resources using AI
    const prompt = `${RESOURCE_GENERATION_PROMPT}

Topic Title: ${topic.title}
Topic Description: ${topic.description || "No description provided"}

Generate curated learning resources for this topic. Make sure to include REAL URLs and resources that actually exist.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert learning resource curator. Provide only valid JSON responses with real, existing resources.",
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

    const resourceData = JSON.parse(content);

    return NextResponse.json(
      {
        topic: {
          id: topic.id,
          title: topic.title,
          description: topic.description,
        },
        resources: resourceData.resources,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error generating resources:", error);
    return NextResponse.json(
      { error: "Failed to generate resources" },
      { status: 500 }
    );
  }
}
