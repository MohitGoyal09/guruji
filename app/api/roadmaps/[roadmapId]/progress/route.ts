import { NextResponse } from "next/server";
import { db } from "@/config/db";
import { ROADMAP_PROGRESS_TABLE } from "@/config/schema";
import { eq, and } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";

// GET: Fetch all progress for a roadmap (for current user)
export async function GET(
  req: Request,
  { params }: { params: Promise<{ roadmapId: string }> }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roadmapId } = await params;
    const userId = user.emailAddresses[0].emailAddress;

    const progress = await db
      .select()
      .from(ROADMAP_PROGRESS_TABLE)
      .where(
        and(
          eq(ROADMAP_PROGRESS_TABLE.roadmapId, roadmapId),
          eq(ROADMAP_PROGRESS_TABLE.userId, userId)
        )
      );

    return NextResponse.json({ progress }, { status: 200 });
  } catch (error) {
    console.error("Error fetching progress:", error);
    return NextResponse.json(
      { error: "Failed to fetch progress" },
      { status: 500 }
    );
  }
}

// POST: Toggle progress for a topic
export async function POST(
  req: Request,
  { params }: { params: Promise<{ roadmapId: string }> }
) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roadmapId } = await params;
    const { topicId, completed } = await req.json();
    const userId = user.emailAddresses[0].emailAddress;

    if (!topicId) {
      return NextResponse.json(
        { error: "topicId is required" },
        { status: 400 }
      );
    }

    // Check if progress entry already exists
    const existing = await db
      .select()
      .from(ROADMAP_PROGRESS_TABLE)
      .where(
        and(
          eq(ROADMAP_PROGRESS_TABLE.roadmapId, roadmapId),
          eq(ROADMAP_PROGRESS_TABLE.userId, userId),
          eq(ROADMAP_PROGRESS_TABLE.topicId, topicId)
        )
      );

    let result;

    if (existing.length > 0) {
      // Update existing entry
      result = await db
        .update(ROADMAP_PROGRESS_TABLE)
        .set({
          completed,
          completedAt: completed ? new Date() : null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(ROADMAP_PROGRESS_TABLE.roadmapId, roadmapId),
            eq(ROADMAP_PROGRESS_TABLE.userId, userId),
            eq(ROADMAP_PROGRESS_TABLE.topicId, topicId)
          )
        )
        .returning();
    } else {
      // Create new entry
      result = await db
        .insert(ROADMAP_PROGRESS_TABLE)
        .values({
          roadmapId,
          userId,
          topicId,
          completed,
          completedAt: completed ? new Date() : null,
        })
        .returning();
    }

    return NextResponse.json({ progress: result[0] }, { status: 200 });
  } catch (error) {
    console.error("Error updating progress:", error);
    return NextResponse.json(
      { error: "Failed to update progress" },
      { status: 500 }
    );
  }
}
