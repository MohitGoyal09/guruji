"use client";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Map, Calendar, BookOpen } from "lucide-react";
import Link from "next/link";
import { Roadmap } from "@/Types/roadmap";

export default function RoadmapsPage() {
  const { user } = useUser();
  const router = useRouter();
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoadmaps = async () => {
      if (!user?.primaryEmailAddress?.emailAddress) {
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get("/api/roadmaps", {
          params: { createdBy: user.primaryEmailAddress.emailAddress },
        });
        setRoadmaps(response.data.roadmaps || []);
      } catch (error) {
        console.error("Error fetching roadmaps:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRoadmaps();
  }, [user]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading roadmaps...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Roadmaps</h1>
          <p className="text-muted-foreground">
            AI-generated learning paths tailored to your skill level
          </p>
        </div>
        <Link href="/roadmaps/create">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create Roadmap
          </Button>
        </Link>
      </div>

      {roadmaps.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Map className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No roadmaps yet</h3>
            <p className="text-muted-foreground mb-6 text-center">
              Create your first AI-powered learning roadmap to get started
            </p>
            <Link href="/roadmaps/create">
              <Button>Create Your First Roadmap</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roadmaps.map((roadmap) => (
            <Card
              key={roadmap.roadmapId}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(`/roadmaps/${roadmap.roadmapId}`)}
            >
              <CardHeader>
                <CardTitle className="line-clamp-2">{roadmap.topic}</CardTitle>
                <CardDescription>
                  <span className="capitalize">{roadmap.skillLevel}</span> level
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    <span>
                      {roadmap.structure.metadata?.totalTopics || 0} topics
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {roadmap.structure.metadata?.totalEstimatedHours || 0}h
                    </span>
                  </div>
                </div>
                <div className="mt-4 text-xs text-muted-foreground">
                  Created {new Date(roadmap.createdAt).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

