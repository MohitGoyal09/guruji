import { NextResponse } from "next/server";
import { db } from "@/config/db";
import { ROADMAPS_TABLE } from "@/config/schema";
import { eq } from "drizzle-orm";
import { OpenAI } from "openai";
import { QUIZ_GENERATION_PROMPT } from "@/lib/ai/roadmapPrompts";
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

// POST: Generate AI quiz for a specific topic
export async function POST(
  req: Request,
  {
    params,
  }: { params: Promise<{ roadmapId: string; topicId: string }> }
) {
  try {
    const { roadmapId, topicId } = await params;
    const body = await req.json();
    const { difficulty = "intermediate", questionCount = 5 } = body;

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

    // Generate quiz using AI
    const prompt = `${QUIZ_GENERATION_PROMPT}

Topic Title: ${topic.title}
Topic Description: ${topic.description || "No description provided"}
Difficulty Level: ${difficulty}
Number of Questions: ${questionCount}

Generate a comprehensive quiz to assess understanding of this topic. Include a mix of multiple choice, true/false, and code-based questions if applicable.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are an expert assessment designer who creates fair, comprehensive quizzes that accurately test knowledge. Provide only valid JSON responses.",
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

    const quizData = JSON.parse(content);

    return NextResponse.json(
      {
        topic: {
          id: topic.id,
          title: topic.title,
          description: topic.description,
        },
        quiz: quizData,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error generating quiz:", error);
    return NextResponse.json(
      { error: "Failed to generate quiz" },
      { status: 500 }
    );
  }
}
