import { NextResponse } from "next/server";
import { db } from "@/config/db";
import { ROADMAPS_TABLE } from "@/config/schema";
import { eq } from "drizzle-orm";
import { OpenAI } from "openai";
import { PROJECT_GENERATION_PROMPT } from "@/lib/ai/roadmapPrompts";
import { RoadmapStructure } from "@/Types/roadmap";

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
});

// Helper to find a section by ID in the roadmap structure
function findSectionById(
  structure: RoadmapStructure,
  sectionId: string
): { title: string; description?: string; subtopics: any[] } | null {
  for (const level of structure.levels) {
    for (const section of level.sections) {
      if (section.id === sectionId) {
        return section;
      }
    }
  }
  return null;
}

// POST: Generate AI projects for a specific section
export async function POST(
  req: Request,
  {
    params,
  }: { params: Promise<{ roadmapId: string; sectionId: string }> }
) {
  try {
    const { roadmapId, sectionId } = await params;

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

    // Find the specific section
    const section = findSectionById(structure, sectionId);

    if (!section) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    // Generate projects using AI
    const topicsList = section.subtopics.map((t) => t.title).join(", ");
    const prompt = `${PROJECT_GENERATION_PROMPT}

Section Title: ${section.title}
Section Description: ${section.description || "No description provided"}
Topics Covered: ${topicsList}

Generate 3-5 hands-on learning projects for this section with varying difficulty levels. Each project should help learners apply the concepts from these topics.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are an expert curriculum designer who creates engaging, practical learning projects. Provide only valid JSON responses.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.8,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error("No content received from AI");
    }

    const projectsData = JSON.parse(content);

    return NextResponse.json(
      {
        section: {
          id: sectionId,
          title: section.title,
          description: section.description,
        },
        projects: projectsData.projects || projectsData,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error generating projects:", error);
    return NextResponse.json(
      { error: "Failed to generate projects" },
      { status: 500 }
    );
  }
}
