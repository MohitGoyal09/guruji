import { NextResponse } from "next/server";
import { db } from "@/config/db";
import { ROADMAPS_TABLE } from "@/config/schema";
import { eq } from "drizzle-orm";
import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
});

// POST: Handle chat messages for roadmap editing
export async function POST(
  req: Request,
  { params }: { params: Promise<{ roadmapId: string }> }
) {
  try {
    const { roadmapId } = await params;
    const body = await req.json();
    const { message, conversationHistory } = body;

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

    // Build conversation context
    const messages: any[] = [
      {
        role: "system",
        content: `You are a helpful AI assistant for managing learning roadmaps. The current roadmap is about "${roadmap.topic}" at ${roadmap.skillLevel} level.

You can help users:
- Understand their roadmap structure
- Get suggestions for learning paths
- Find resources for specific topics
- Plan their study schedule
- Get motivation and study tips

Be helpful, encouraging, and provide actionable advice. Keep responses concise and friendly.`,
      },
    ];

    // Add conversation history
    if (conversationHistory && conversationHistory.length > 0) {
      conversationHistory.forEach((msg: any) => {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      });
    }

    // Add current message
    messages.push({
      role: "user",
      content: message,
    });

    // Get AI response
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
      temperature: 0.7,
      max_tokens: 500,
    });

    const assistantMessage = completion.choices[0].message.content;

    return NextResponse.json(
      {
        message: assistantMessage,
        roadmapModified: false, // Set to true if roadmap was actually modified
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing chat message:", error);
    return NextResponse.json(
      { error: "Failed to process message" },
      { status: 500 }
    );
  }
}
