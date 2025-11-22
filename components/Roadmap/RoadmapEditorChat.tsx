"use client";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import axios from "axios";
import { toast } from "sonner";

interface RoadmapEditorChatProps {
  roadmapId: string;
  onRoadmapUpdate: () => void;
}

export default function RoadmapEditorChat({
  roadmapId,
  onRoadmapUpdate,
}: RoadmapEditorChatProps) {
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<string>("");

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue;
    setInputValue("");
    setIsLoading(true);
    setResponse("");

    try {
      const res = await axios.post(
        `/api/roadmaps/${roadmapId}/edit`,
        {
          prompt: userMessage,
        }
      );

      setResponse(res.data.message);

      // If roadmap was modified, trigger refresh
      if (res.data.roadmapModified) {
        onRoadmapUpdate();
        toast.success("Roadmap updated successfully!");
      }
    } catch (error: any) {
      console.error("Error editing roadmap:", error);
      setResponse("Sorry, I couldn't process that request. Please try again.");
      toast.error("Failed to update roadmap");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card className="border-2 border-blue-500/20 shadow-lg bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100">
                AI Roadmap Assistant
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Ask me to add sections, modify topics, or reorganize your roadmap
              </p>
            </div>
          </div>

          {/* Response Area */}
          {(isLoading || response) && (
            <div className="mb-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              {isLoading ? (
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Processing your request...</span>
                </div>
              ) : (
                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                  {response}
                </p>
              )}
            </div>
          )}

          {/* Input Area */}
          <div className="flex gap-3">
            <Textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="e.g., 'Add a new section about API Design' or 'Remove the testing section'"
              className="min-h-[60px] resize-none"
              disabled={isLoading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="h-[60px] w-[60px] shrink-0 bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>

          {/* Quick Actions */}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInputValue("Add a new beginner section")}
              disabled={isLoading}
              className="text-xs"
            >
              Add section
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInputValue("Reorganize by difficulty")}
              disabled={isLoading}
              className="text-xs"
            >
              Reorganize
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInputValue("Add more topics to intermediate level")}
              disabled={isLoading}
              className="text-xs"
            >
              Add topics
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
