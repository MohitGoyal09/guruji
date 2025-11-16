import { NextResponse } from "next/server";
import { db } from "@/config/db";
import { ROADMAPS_TABLE } from "@/config/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const createdBy = searchParams.get("createdBy");

    if (!createdBy) {
      return NextResponse.json(
        { error: "createdBy query parameter is required" },
        { status: 400 }
      );
    }

    const roadmaps = await db
      .select()
      .from(ROADMAPS_TABLE)
      .where(eq(ROADMAPS_TABLE.createdBy, createdBy))
      .orderBy(desc(ROADMAPS_TABLE.createdAt));

    return NextResponse.json({ roadmaps }, { status: 200 });
  } catch (error) {
    console.error("Error fetching roadmaps:", error);
    return NextResponse.json(
      { error: "Failed to fetch roadmaps" },
      { status: 500 }
    );
  }
}

