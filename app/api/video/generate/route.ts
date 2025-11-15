import { NextResponse } from 'next/server';
import { inngest } from '@/inngest/client';
import { db } from '@/config/db';
import { VIDEO_CONTENT_TABLE } from '@/config/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    const { courseId, chapterId, language = 'en' } = await req.json();
    
    if (!courseId || chapterId === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Check if video already exists
    const existing = await db
      .select()
      .from(VIDEO_CONTENT_TABLE)
      .where(
        and(
          eq(VIDEO_CONTENT_TABLE.courseId, courseId),
          eq(VIDEO_CONTENT_TABLE.chapterId, chapterId),
          eq(VIDEO_CONTENT_TABLE.language, language)
        )
      );
    
    if (existing.length > 0 && existing[0].status === 'Ready') {
      return NextResponse.json(existing[0]);
    }
    
    // Create video record
    const videoRecord = await db
      .insert(VIDEO_CONTENT_TABLE)
      .values({
        courseId,
        chapterId,
        language,
        status: 'Pending',
      })
      .returning();
    
    // Queue video generation job
    await inngest.send({
      name: 'video.generate',
      data: {
        videoId: videoRecord[0].id,
        courseId,
        chapterId,
        language,
      },
    });
    
    return NextResponse.json(videoRecord[0], { status: 201 });
  } catch (error) {
    console.error('Video generation error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate video generation' },
      { status: 500 }
    );
  }
}

