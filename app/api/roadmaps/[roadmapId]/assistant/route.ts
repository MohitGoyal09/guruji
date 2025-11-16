import { NextResponse } from "next/server";
import { db } from "@/config/db";
import { ROADMAPS_TABLE } from "@/config/schema";
import { eq } from "drizzle-orm";
import OpenAI from "openai";
import { RoadmapStructure } from "@/Types/roadmap";

const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
if (!apiKey) {
  throw new Error("NEXT_PUBLIC_OPENAI_API_KEY is not set");
}

const openai = new OpenAI({
  apiKey: apiKey,
});

const ROADMAP_EDIT_PROMPT = `You are an AI assistant that helps users modify their learning roadmap. You can:
- Add new sections or topics
- Remove sections or topics
- Reorganize the structure
- Adjust difficulty levels
- Modify time estimates
- Suggest improvements

When the user asks to add something, you should:
1. Understand what they want to add (section, topic, subtopic)
2. Determine where it should be placed in the roadmap
3. Generate appropriate content with proper IDs, titles, descriptions, and time estimates
4. Return the COMPLETE updated roadmap structure as JSON

CRITICAL: Always return the FULL roadmap structure, not just the changes. The structure must follow this format:
{
  "levels": [
    {
      "id": "level-1",
      "title": "Level Title",
      "description": "Level description",
      "estimatedHours": 40,
      "sections": [
        {
          "id": "section-1-1",
          "title": "Section Title",
          "description": "Section description",
          "estimatedHours": 10,
          "subtopics": [
            {
              "id": "subtopic-1-1-1",
              "title": "Subtopic Title",
              "description": "Subtopic description",
              "estimatedHours": 2
            }
          ]
        }
      ]
    }
  ]
}

Ensure:
- All IDs are unique
- The structure maintains hierarchy (Levels → Sections → Subtopics)
- Estimated hours are realistic
- Descriptions are clear and educational`;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ roadmapId: string }> }
) {
  try {
    const { roadmapId } = await params;
    const { message, messages } = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Fetch current roadmap
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
    const currentStructure = roadmap.structure as RoadmapStructure;

    // Build conversation context
    const conversationMessages = [
      {
        role: "system" as const,
        content: `${ROADMAP_EDIT_PROMPT}\n\nCurrent roadmap structure:\n${JSON.stringify(currentStructure, null, 2)}\n\nReturn the result as valid JSON.`,
      },
      ...(messages || []).map((msg: any) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
      {
        role: "user" as const,
        content: message,
      },
    ];

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: conversationMessages,
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from AI");
    }

    // Parse response
    let cleanedContent = content.trim();
    if (cleanedContent.startsWith("```json")) {
      cleanedContent = cleanedContent.replace(/```json\n?/g, "").replace(/```\n?$/g, "");
    } else if (cleanedContent.startsWith("```")) {
      cleanedContent = cleanedContent.replace(/```\n?/g, "");
    }

    const responseData = JSON.parse(cleanedContent);
    
    // Extract updated structure and assistant message
    let updatedStructure: RoadmapStructure | null = null;
    let assistantMessage = "Done! I've updated your roadmap.";

    if (responseData.levels) {
      // Full roadmap structure provided
      updatedStructure = responseData as RoadmapStructure;
    } else if (responseData.structure) {
      updatedStructure = responseData.structure as RoadmapStructure;
      assistantMessage = responseData.message || responseData.response || assistantMessage;
    } else if (responseData.message || responseData.response) {
      assistantMessage = responseData.message || responseData.response;
    }

    // If structure was updated, save it
    if (updatedStructure) {
      // Calculate metadata
      let totalEstimatedHours = 0;
      let totalTopics = 0;

      updatedStructure.levels.forEach((level) => {
        if (level.estimatedHours) {
          totalEstimatedHours += level.estimatedHours;
        }
        level.sections.forEach((section) => {
          totalTopics += section.subtopics.length;
          if (section.estimatedHours) {
            totalEstimatedHours += section.estimatedHours;
          }
        });
      });

      updatedStructure.metadata = {
        totalEstimatedHours,
        totalTopics,
      };

      // Update database
      await db
        .update(ROADMAPS_TABLE)
        .set({
          structure: updatedStructure,
          updatedAt: new Date(),
        })
        .where(eq(ROADMAPS_TABLE.roadmapId, roadmapId));

      // Fetch updated roadmap
      const updatedRoadmaps = await db
        .select()
        .from(ROADMAPS_TABLE)
        .where(eq(ROADMAPS_TABLE.roadmapId, roadmapId));

      return NextResponse.json({
        success: true,
        response: assistantMessage,
        roadmap: updatedRoadmaps[0],
      });
    }

    // If no structure update, just return the message
    return NextResponse.json({
      success: true,
      response: assistantMessage,
    });
  } catch (error: any) {
    console.error("Error in assistant route:", error);
    return NextResponse.json(
      {
        error: "Failed to process request",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

