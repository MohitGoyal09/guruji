'use client';
import { useParams } from 'next/navigation';
import { VideoPlayer } from '@/components/Course/VideoPlayer';
import { LanguageSelector } from '@/components/LanguageSelector';

export default function VideoPage() {
  const { courseId } = useParams();
  
  return (
    <div className="mx-10 md:mx-36 lg:px-60 mt-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Chapter Video</h1>
        <LanguageSelector />
      </div>
      
      <VideoPlayer
        courseId={courseId as string}
        chapterId={0}
      />
    </div>
  );
}

