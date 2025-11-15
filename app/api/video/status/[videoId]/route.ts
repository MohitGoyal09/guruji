import { NextResponse } from 'next/server';
import { db } from '@/config/db';
import { VIDEO_CONTENT_TABLE } from '@/config/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await params;
    const video = await db
      .select()
      .from(VIDEO_CONTENT_TABLE)
      .where(eq(VIDEO_CONTENT_TABLE.id, parseInt(videoId)));
    
    if (video.length === 0) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }
    
    return NextResponse.json(video[0]);
  } catch (error) {
    console.error('Error fetching video status:', error);
    return NextResponse.json({ error: 'Failed to fetch video status' }, { status: 500 });
  }
}

