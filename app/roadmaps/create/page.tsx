"use client";
import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function CreateRoadmapPage() {
  const { user } = useUser();
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [skillLevel, setSkillLevel] = useState<"beginner" | "intermediate" | "pro" | "">("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error("Please enter a topic");
      return;
    }

    if (!skillLevel) {
      toast.error("Please select a skill level");
      return;
    }

    if (!user?.primaryEmailAddress?.emailAddress) {
      toast.error("Please sign in to create a roadmap");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post("/api/roadmaps/generate", {
        topic: topic.trim(),
        skillLevel,
        createdBy: user.primaryEmailAddress.emailAddress,
      });

      if (response.data.roadmap) {
        toast.success("Roadmap generated successfully!");
        router.push(`/roadmaps/${response.data.roadmap.roadmapId}`);
      }
    } catch (error: any) {
      console.error("Error generating roadmap:", error);
      toast.error(
        error.response?.data?.error || "Failed to generate roadmap. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Create AI Roadmap
          </CardTitle>
          <CardDescription>
            Generate a personalized learning roadmap tailored to your skill level
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="topic" className="font-bold text-md">
              What do you want to learn?
            </Label>
            <Textarea
              id="topic"
              placeholder="e.g., AI Engineer, Data Science, Blockchain Development, Full Stack Web Development..."
              className="min-h-[120px]"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={loading}
            />
            <p className="text-sm text-muted-foreground">
              Enter a topic or career path you want to master
            </p>
          </div>

          <div className="space-y-2">
            <Label className="font-bold text-md">Skill Level</Label>
            <Select
              value={skillLevel}
              onValueChange={(value) =>
                setSkillLevel(value as "beginner" | "intermediate" | "pro")
              }
              disabled={loading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select your current skill level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner - Just starting out</SelectItem>
                <SelectItem value="intermediate">
                  Intermediate - Have some experience
                </SelectItem>
                <SelectItem value="pro">Pro - Advanced learner</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              The roadmap will be personalized based on your skill level
            </p>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={loading || !topic.trim() || !skillLevel}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Roadmap...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Roadmap
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

