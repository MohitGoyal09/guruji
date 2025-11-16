"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { Roadmap } from "@/Types/roadmap";
import GraphView from "@/components/Roadmap/GraphView";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, BookOpen, Map as MapIcon } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface ProgressItem {
  id: number;
  roadmapId: string;
  userId: string;
  topicId: string;
  completed: boolean;
  completedAt: Date | null;
}

export default function RoadmapGraphPage() {
  const { roadmapId } = useParams();
  const router = useRouter();
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [progress, setProgress] = useState<Map<string, boolean>>(new Map());

  useEffect(() => {
    const fetchRoadmap = async () => {
      if (!roadmapId || typeof roadmapId !== "string") {
        setError("Invalid roadmap ID");
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`/api/roadmaps/${roadmapId}`);
        setRoadmap(response.data.roadmap);
        fetchProgress();
      } catch (err: any) {
        console.error("Error fetching roadmap:", err);
        setError(err.response?.data?.error || "Failed to load roadmap");
        toast.error("Failed to load roadmap");
      } finally {
        setLoading(false);
      }
    };

    fetchRoadmap();
  }, [roadmapId]);

  const fetchProgress = async () => {
    if (!roadmapId || typeof roadmapId !== "string") return;

    try {
      const response = await axios.get(`/api/roadmaps/${roadmapId}/progress`);
      const progressData: ProgressItem[] = response.data.progress;

      const progressMap = new Map<string, boolean>();
      progressData.forEach((item) => {
        progressMap.set(item.topicId, item.completed);
      });

      setProgress(progressMap);
    } catch (error) {
      console.error("Error fetching progress:", error);
    }
  };

  const toggleTopicCompletion = async (topicId: string) => {
    if (!roadmapId || typeof roadmapId !== "string") return;

    const currentState = progress.get(topicId) || false;
    const newState = !currentState;

    // Optimistic update
    const newProgress = new Map(progress);
    newProgress.set(topicId, newState);
    setProgress(newProgress);

    try {
      await axios.post(`/api/roadmaps/${roadmapId}/progress`, {
        topicId,
        completed: newState,
      });
    } catch (error) {
      console.error("Error updating progress:", error);
      // Revert on error
      setProgress(progress);
      toast.error("Failed to update progress");
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-900 flex items-center justify-center">
        <Skeleton className="h-screen w-full" />
      </div>
    );
  }

  if (error || !roadmap) {
    return (
      <div className="fixed inset-0 bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2 text-white">Roadmap not found</h2>
          <p className="text-slate-400 mb-4">{error || "The roadmap you're looking for doesn't exist"}</p>
          <Button onClick={() => router.push("/roadmaps")}>
            View All Roadmaps
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900">
      {/* Top Navigation Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.push(`/roadmaps/${roadmapId}`)}
              className="gap-2 text-slate-300 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-xl font-bold text-white">{roadmap.topic}</h1>
            </div>
          </div>
          
          {/* View Navigation */}
          <div className="flex items-center gap-2">
            <Link href={`/roadmaps/${roadmapId}`}>
              <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
                <BookOpen className="mr-2 h-4 w-4" />
                Syllabus
              </Button>
            </Link>
            <Link href={`/roadmaps/${roadmapId}/timeline`}>
              <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
                <Calendar className="mr-2 h-4 w-4" />
                Timeline
              </Button>
            </Link>
            <Button variant="default" size="sm" disabled>
              <MapIcon className="mr-2 h-4 w-4" />
              Graph
            </Button>
          </div>
        </div>
      </div>

      {/* Full Page Graph View */}
      <GraphView
        roadmap={roadmap}
        selectedTopicId={selectedTopicId}
        onTopicSelect={setSelectedTopicId}
        progress={progress}
        onToggleCompletion={toggleTopicCompletion}
      />
    </div>
  );
}
