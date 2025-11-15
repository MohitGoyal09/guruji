import { NextResponse } from 'next/server';
import { renderVideo } from '@/lib/video/renderService';
import path from 'path';

export async function POST(req: Request) {
  try {
    const { script, language, audioPath, videoId } = await req.json();
    
    if (!script || !language || !audioPath) {
      return NextResponse.json(
        { error: 'Missing required fields: script, language, audioPath' },
        { status: 400 }
      );
    }
    
    const outputPath = path.join(process.cwd(), 'tmp', `video_${videoId}_${language}.mp4`);
    
    // Render video using Remotion
    const videoPath = await renderVideo(
      script,
      language,
      audioPath,
      outputPath
    );
    
    // TODO: Upload to S3/Cloudinary and return public URL
    // For now, return local path
    const videoUrl = `/tmp/video_${videoId}_${language}.mp4`;
    
    return NextResponse.json({ 
      videoUrl,
      videoPath,
      status: 'rendered'
    });
  } catch (error) {
    console.error('Video rendering error:', error);
    return NextResponse.json(
      { error: 'Failed to render video', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

