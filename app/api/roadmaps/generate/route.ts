import { NextResponse } from "next/server";
import { generateRoadmapBlueprint, analyzePrerequisites, personalizeRoadmap } from "@/lib/ai/roadmapGenerator";
import { db } from "@/config/db";
import { ROADMAPS_TABLE } from "@/config/schema";
import { nanoid } from "nanoid";

export async function POST(req: Request) {
  try {
    const { topic, skillLevel, createdBy } = await req.json();

    if (!topic || !skillLevel || !createdBy) {
      return NextResponse.json(
        { error: "Missing required fields: topic, skillLevel, and createdBy are required" },
        { status: 400 }
      );
    }

    if (!['beginner', 'intermediate', 'pro'].includes(skillLevel)) {
      return NextResponse.json(
        { error: "Invalid skillLevel. Must be 'beginner', 'intermediate', or 'pro'" },
        { status: 400 }
      );
    }

    console.log("Generating roadmap:", { topic, skillLevel, createdBy });

    // Generate roadmap blueprint
    let structure = await generateRoadmapBlueprint(topic, skillLevel);
    
    // Personalize based on skill level
    structure = await personalizeRoadmap(structure, skillLevel);
    
    // Analyze prerequisites
    const prerequisites = await analyzePrerequisites(structure);

    // Generate unique roadmap ID
    const roadmapId = nanoid();

    // Save to database
    const result = await db
      .insert(ROADMAPS_TABLE)
      .values({
        roadmapId,
        topic,
        skillLevel,
        structure,
        prerequisites,
        createdBy,
      })
      .returning();

    console.log("Roadmap generated successfully:", roadmapId);

    return NextResponse.json({
      roadmap: result[0],
      success: true,
    }, { status: 201 });
  } catch (error) {
    console.error("Error generating roadmap:", error);
    return NextResponse.json(
      { 
        error: "Failed to generate roadmap",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

