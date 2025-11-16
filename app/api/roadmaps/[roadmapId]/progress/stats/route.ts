import { NextResponse } from "next/server";
import { db } from "@/config/db";
import { ROADMAP_PROGRESS_TABLE, ROADMAPS_TABLE } from "@/config/schema";
import { eq, and } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";
import { RoadmapStructure } from "@/Types/roadmap";

// Helper function to count all subtopics in a roadmap
function countTotalTopics(structure: RoadmapStructure): number {
  let total = 0;
  structure.levels.forEach((level) => {
    level.sections.forEach((section) => {
      total += section.subtopics.length;
    });
  });
  return total;
}

// GET: Get progress statistics for a roadmap
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

    // Fetch roadmap to get total topics
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
    const totalTopics = countTotalTopics(structure);

    // Fetch progress
    const progress = await db
      .select()
      .from(ROADMAP_PROGRESS_TABLE)
      .where(
        and(
          eq(ROADMAP_PROGRESS_TABLE.roadmapId, roadmapId),
          eq(ROADMAP_PROGRESS_TABLE.userId, userId)
        )
      );

    const completedTopics = progress.filter((p) => p.completed).length;
    const percentageComplete =
      totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

    // Calculate estimated hours remaining
    let totalHours = 0;
    let completedHours = 0;
    const completedTopicIds = new Set(
      progress.filter((p) => p.completed).map((p) => p.topicId)
    );

    structure.levels.forEach((level) => {
      level.sections.forEach((section) => {
        section.subtopics.forEach((subtopic) => {
          totalHours += subtopic.estimatedHours || 0;
          if (completedTopicIds.has(subtopic.id)) {
            completedHours += subtopic.estimatedHours || 0;
          }
        });
      });
    });

    const remainingHours = totalHours - completedHours;

    return NextResponse.json(
      {
        stats: {
          totalTopics,
          completedTopics,
          remainingTopics: totalTopics - completedTopics,
          percentageComplete,
          totalHours,
          completedHours,
          remainingHours,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching progress stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch progress stats" },
      { status: 500 }
    );
  }
}
