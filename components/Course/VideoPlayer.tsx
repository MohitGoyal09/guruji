'use client';
import { useEffect, useState } from 'react';
import { useLanguage } from '@/app/_context/LanguageContext';
import axios from 'axios';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VideoPlayerProps {
  courseId: string;
  chapterId: number;
}

export function VideoPlayer({ courseId, chapterId }: VideoPlayerProps) {
  const { language } = useLanguage();
  const [videoData, setVideoData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Check for existing video when language changes
    checkExistingVideo();
  }, [courseId, chapterId, language]);
  
  const checkExistingVideo = async () => {
    try {
      const response = await axios.post('/api/video/generate', {
        courseId,
        chapterId,
        language,
      });
      
      if (response.data.videoUrl && response.data.status === 'Ready') {
        setVideoData(response.data);
      } else if (response.data.status === 'Generating' || response.data.status === 'Pending') {
        setVideoData(response.data);
        pollVideoStatus(response.data.id);
      }
    } catch (err) {
      console.error('Error checking video:', err);
    }
  };
  
  const generateVideo = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post('/api/video/generate', {
        courseId,
        chapterId,
        language,
      });
      setVideoData(response.data);
      
      // Poll for video status
      if (response.data.status !== 'Ready') {
        pollVideoStatus(response.data.id);
      }
    } catch (err) {
      setError('Failed to generate video');
      setLoading(false);
    }
  };
  
  const pollVideoStatus = async (videoId: number) => {
    const interval = setInterval(async () => {
      try {
        const response = await axios.get(`/api/video/status/${videoId}`);
        const data = response.data;
        
        if (data.status === 'Ready') {
          setVideoData(data);
          setLoading(false);
          clearInterval(interval);
        } else if (data.status === 'Failed') {
          setError('Video generation failed');
          setLoading(false);
          clearInterval(interval);
        }
      } catch (err) {
        console.error('Error polling video status:', err);
        clearInterval(interval);
        setLoading(false);
      }
    }, 5000);
    
    // Cleanup after 5 minutes
    setTimeout(() => {
      clearInterval(interval);
      if (loading) {
        setLoading(false);
        setError('Video generation is taking longer than expected');
      }
    }, 300000);
  };
  
  if (loading || (videoData && videoData.status !== 'Ready')) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Generating video...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg">
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <Button onClick={generateVideo} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }
  
  if (!videoData || !videoData.videoUrl) {
    return (
      <div className="p-6 text-center">
        <p className="mb-4">No video available for this chapter</p>
        <Button onClick={generateVideo}>
          Generate Video
        </Button>
      </div>
    );
  }
  
  return (
    <div className="rounded-lg overflow-hidden">
      <video
        controls
        className="w-full"
        src={videoData.videoUrl}
        poster={videoData.thumbnailUrl}
      >
        Your browser does not support video playback.
      </video>
    </div>
  );
}

