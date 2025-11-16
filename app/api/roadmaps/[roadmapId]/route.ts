import { NextResponse } from "next/server";
import { db } from "@/config/db";
import { ROADMAPS_TABLE } from "@/config/schema";
import { eq } from "drizzle-orm";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ roadmapId: string }> }
) {
  try {
    const { roadmapId } = await params;

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

    return NextResponse.json({ roadmap: roadmaps[0] }, { status: 200 });
  } catch (error) {
    console.error("Error fetching roadmap:", error);
    return NextResponse.json(
      { error: "Failed to fetch roadmap" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ roadmapId: string }> }
) {
  try {
    const { roadmapId } = await params;
    const { structure, prerequisites } = await req.json();

    const result = await db
      .update(ROADMAPS_TABLE)
      .set({
        structure: structure || undefined,
        prerequisites: prerequisites || undefined,
        updatedAt: new Date(),
      })
      .where(eq(ROADMAPS_TABLE.roadmapId, roadmapId))
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Roadmap not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ roadmap: result[0] }, { status: 200 });
  } catch (error) {
    console.error("Error updating roadmap:", error);
    return NextResponse.json(
      { error: "Failed to update roadmap" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ roadmapId: string }> }
) {
  try {
    const { roadmapId } = await params;

    const result = await db
      .delete(ROADMAPS_TABLE)
      .where(eq(ROADMAPS_TABLE.roadmapId, roadmapId))
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Roadmap not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error deleting roadmap:", error);
    return NextResponse.json(
      { error: "Failed to delete roadmap" },
      { status: 500 }
    );
  }
}

