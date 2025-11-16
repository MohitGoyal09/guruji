"use client";
import { useState, useEffect } from "react";
import { Roadmap } from "@/Types/roadmap";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SyllabusView from "./SyllabusView";
import ProjectsPanel from "./ProjectsPanel";
import { Map as MapIcon, Calendar, BookOpen, Target, CheckCircle2, Code } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import axios from "axios";

interface RoadmapViewProps {
  roadmap: Roadmap;
  roadmapId: string;
}

interface ProgressItem {
  id: number;
  roadmapId: string;
  userId: string;
  topicId: string;
  completed: boolean;
  completedAt: Date | null;
}

interface ProgressStats {
  totalTopics: number;
  completedTopics: number;
  remainingTopics: number;
  percentageComplete: number;
  totalHours: number;
  completedHours: number;
  remainingHours: number;
}

export default function RoadmapView({ roadmap, roadmapId }: RoadmapViewProps) {
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [progress, setProgress] = useState<Map<string, boolean>>(new Map());
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch progress data on mount
  useEffect(() => {
    fetchProgress();
    fetchStats();
  }, [roadmapId]);

  const fetchProgress = async () => {
    try {
      const response = await axios.get(`/api/roadmaps/${roadmapId}/progress`);
      const progressData: ProgressItem[] = response.data.progress;

      const progressMap = new Map<string, boolean>();
      progressData.forEach((item) => {
        progressMap.set(item.topicId, item.completed);
      });

      setProgress(progressMap);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching progress:", error);
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`/api/roadmaps/${roadmapId}/progress/stats`);
      setStats(response.data.stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const toggleTopicCompletion = async (topicId: string) => {
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

      // Refresh stats after update
      fetchStats();
    } catch (error) {
      console.error("Error updating progress:", error);
      // Revert on error
      setProgress(progress);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-3xl mb-2">{roadmap.topic}</CardTitle>
              <CardDescription className="text-base">
                {roadmap.structure.levels[0]?.description || "AI-generated learning roadmap"}
              </CardDescription>
            </div>
            <Badge variant="secondary" className="capitalize">
              {roadmap.skillLevel}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">
                  {roadmap.structure.metadata?.totalTopics || 0}
                </div>
                <div className="text-sm text-muted-foreground">Topics</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">
                  {roadmap.structure.metadata?.totalEstimatedHours || 0}
                </div>
                <div className="text-sm text-muted-foreground">Hours</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">
                  {roadmap.structure.levels.length}
                </div>
                <div className="text-sm text-muted-foreground">Levels</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">
                  {stats?.percentageComplete || 0}%
                </div>
                <div className="text-sm text-muted-foreground">Complete</div>
              </div>
            </div>
          </div>
          {stats && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{stats.completedTopics} of {stats.totalTopics} topics completed</span>
                <span>{stats.completedHours}h / {stats.totalHours}h</span>
              </div>
              <Progress value={stats.percentageComplete} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Navigation */}
      <div className="flex items-center gap-2">
        <Link href={`/roadmaps/${roadmapId}/timeline`}>
          <Button variant="outline" size="sm">
            <Calendar className="mr-2 h-4 w-4" />
            Timeline View
          </Button>
        </Link>
        <Link href={`/roadmaps/${roadmapId}/graph`}>
          <Button variant="outline" size="sm">
            <MapIcon className="mr-2 h-4 w-4" />
            Graph View
          </Button>
        </Link>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="syllabus" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="syllabus">
            <BookOpen className="mr-2 h-4 w-4" />
            Syllabus
          </TabsTrigger>
          <TabsTrigger value="projects">
            <Code className="mr-2 h-4 w-4" />
            Projects
          </TabsTrigger>
        </TabsList>

        <TabsContent value="syllabus" className="mt-6">
          <SyllabusView
            roadmap={roadmap}
            roadmapId={roadmapId}
            selectedTopicId={selectedTopicId}
            onTopicSelect={setSelectedTopicId}
            progress={progress}
            onToggleCompletion={toggleTopicCompletion}
          />
        </TabsContent>

        <TabsContent value="projects" className="mt-6 space-y-6">
          {roadmap.structure.levels.map((level) =>
            level.sections.map((section) => (
              <ProjectsPanel
                key={section.id}
                roadmapId={roadmapId}
                sectionId={section.id}
                sectionTitle={section.title}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

