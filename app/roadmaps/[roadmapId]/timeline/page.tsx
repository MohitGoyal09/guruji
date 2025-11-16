"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { Roadmap } from "@/Types/roadmap";
import TimelineView from "@/components/Roadmap/TimelineView";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, BookOpen, Map as MapIcon } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ProgressItem {
  id: number;
  roadmapId: string;
  userId: string;
  topicId: string;
  completed: boolean;
  completedAt: Date | null;
}

export default function RoadmapTimelinePage() {
  const { roadmapId } = useParams();
  const router = useRouter();
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-12 w-64 mb-4" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !roadmap) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => router.push("/roadmaps")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Roadmaps
        </Button>
        <div className="text-center py-16">
          <h2 className="text-2xl font-bold mb-2">Roadmap not found</h2>
          <p className="text-muted-foreground mb-4">{error || "The roadmap you're looking for doesn't exist"}</p>
          <Button onClick={() => router.push("/roadmaps")}>
            View All Roadmaps
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push(`/roadmaps/${roadmapId}`)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{roadmap.topic}</h1>
            <p className="text-muted-foreground mt-1">
              Week-by-week learning timeline
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="capitalize">
          {roadmap.skillLevel}
        </Badge>
      </div>

      {/* View Navigation */}
      <div className="mb-4 flex items-center gap-2">
        <Link href={`/roadmaps/${roadmapId}`}>
          <Button variant="outline" size="sm">
            <BookOpen className="mr-2 h-4 w-4" />
            Syllabus View
          </Button>
        </Link>
        <Button variant="default" size="sm" disabled>
          <Calendar className="mr-2 h-4 w-4" />
          Timeline View
        </Button>
        <Link href={`/roadmaps/${roadmapId}/graph`}>
          <Button variant="outline" size="sm">
            <MapIcon className="mr-2 h-4 w-4" />
            Graph View
          </Button>
        </Link>
      </div>

      {/* Timeline View */}
      <TimelineView roadmap={roadmap} progress={progress} onToggleCompletion={toggleTopicCompletion} />
    </div>
  );
}

