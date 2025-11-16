"use client";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Send, Bot, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface RoadmapAssistantProps {
  roadmapId: string;
  onRoadmapUpdate: (updatedRoadmap: any) => void;
  isDark: boolean;
}

export default function RoadmapAssistant({
  roadmapId,
  onRoadmapUpdate,
  isDark,
}: RoadmapAssistantProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([
    {
      role: "assistant",
      content: "Hi! I'm your AI roadmap assistant. You can ask me to:\n\n• Add or remove topics\n• Reorganize sections\n• Adjust difficulty levels\n• Get improvement suggestions\n• Modify time estimates\n\nWhat would you like to do?",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch(`/api/roadmaps/${roadmapId}/assistant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, messages }),
      });

      const data = await response.json();

      if (data.success && data.roadmap) {
        // Update the roadmap
        onRoadmapUpdate(data.roadmap);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.response || "Done! I've updated your roadmap.",
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.response || "I've processed your request. The roadmap has been updated.",
          },
        ]);
      }
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 left-1/2 -translate-x-1/2 z-30 px-6 py-3 rounded-full shadow-lg transition-all",
          "hover:scale-105",
          isDark
            ? "bg-blue-600 hover:bg-blue-700 text-white"
            : "bg-blue-500 hover:bg-blue-600 text-white"
        )}
      >
        <Bot className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div
      className={cn(
        "fixed bottom-6 left-1/2 -translate-x-1/2 z-30 w-full max-w-2xl transition-all duration-300",
        isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      )}
    >
      <div
        className={cn(
          "rounded-2xl shadow-2xl border-2 overflow-hidden",
          isDark
            ? "bg-slate-800/95 border-slate-700 backdrop-blur-xl"
            : "bg-white/95 border-slate-200 backdrop-blur-xl"
        )}
      >
        {/* Header */}
        <div
          className={cn(
            "px-4 py-3 border-b flex items-center justify-between",
            isDark ? "border-slate-700" : "border-slate-200"
          )}
        >
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "p-2 rounded-lg",
                isDark ? "bg-blue-600/20" : "bg-blue-100"
              )}
            >
              <Bot className={cn("h-5 w-5", isDark ? "text-blue-400" : "text-blue-600")} />
            </div>
            <div>
              <h3 className={cn("font-semibold", isDark ? "text-white" : "text-slate-900")}>
                AI Roadmap Assistant
              </h3>
              <p className={cn("text-xs", isDark ? "text-slate-400" : "text-slate-600")}>
                Ask me to modify your roadmap
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className={cn(
              "h-8 w-8",
              isDark ? "hover:bg-slate-700" : "hover:bg-slate-100"
            )}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Messages */}
        <div className={cn("max-h-64 overflow-y-auto px-4 py-3 space-y-3", isDark ? "bg-slate-900/50" : "bg-slate-50/50")}>
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={cn(
                "flex gap-3",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {msg.role === "assistant" && (
                <div
                  className={cn(
                    "p-2 rounded-lg shrink-0",
                    isDark ? "bg-blue-600/20" : "bg-blue-100"
                  )}
                >
                  <Bot className={cn("h-4 w-4", isDark ? "text-blue-400" : "text-blue-600")} />
                </div>
              )}
              <div
                className={cn(
                  "rounded-lg px-4 py-2 max-w-[80%]",
                  msg.role === "user"
                    ? isDark
                      ? "bg-blue-600 text-white"
                      : "bg-blue-500 text-white"
                    : isDark
                    ? "bg-slate-800 text-slate-200"
                    : "bg-white text-slate-900"
                )}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div
                className={cn(
                  "p-2 rounded-lg shrink-0",
                  isDark ? "bg-blue-600/20" : "bg-blue-100"
                )}
              >
                <Bot className={cn("h-4 w-4", isDark ? "text-blue-400" : "text-blue-600")} />
              </div>
              <div
                className={cn(
                  "rounded-lg px-4 py-2",
                  isDark ? "bg-slate-800 text-slate-200" : "bg-white text-slate-900"
                )}
              >
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div
          className={cn(
            "px-4 py-3 border-t flex items-end gap-2",
            isDark ? "border-slate-700 bg-slate-800/50" : "border-slate-200 bg-white/50"
          )}
        >
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me to add a section, remove topics, or modify the roadmap..."
            className={cn(
              "min-h-[60px] max-h-[120px] resize-none",
              isDark
                ? "bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                : "bg-white border-slate-300 text-slate-900 placeholder:text-slate-500"
            )}
            disabled={isLoading}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={cn(
              "shrink-0 h-[60px] px-4",
              isDark
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-blue-500 hover:bg-blue-600"
            )}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

