"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { Roadmap } from "@/Types/roadmap";
import RoadmapView from "@/components/Roadmap/RoadmapView";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function RoadmapDetailPage() {
  const { roadmapId } = useParams();
  const router = useRouter();
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      <Button
        variant="ghost"
        onClick={() => router.push("/roadmaps")}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Roadmaps
      </Button>
      <RoadmapView roadmap={roadmap} roadmapId={roadmapId as string} />
    </div>
  );
}

