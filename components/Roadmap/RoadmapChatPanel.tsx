"use client";
import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MessageSquare,
  Send,
  X,
  Minimize2,
  Maximize2,
  Sparkles,
  Loader2,
  Bot,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import axios from "axios";
import { toast } from "sonner";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface RoadmapChatPanelProps {
  roadmapId: string;
  onRoadmapUpdate?: () => void;
}

export default function RoadmapChatPanel({
  roadmapId,
  onRoadmapUpdate,
}: RoadmapChatPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi! I'm your AI roadmap assistant. You can ask me to:\n\n• Add or remove topics\n• Reorganize sections\n• Adjust difficulty levels\n• Get improvement suggestions\n• Modify time estimates\n\nWhat would you like to do?",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      // TODO: Replace with actual API endpoint for roadmap editing
      const response = await axios.post(
        `/api/roadmaps/${roadmapId}/chat`,
        {
          message: inputValue,
          conversationHistory: messages.slice(-5), // Send last 5 messages for context
        }
      );

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.data.message,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // If roadmap was modified, trigger refresh
      if (response.data.roadmapModified && onRoadmapUpdate) {
        onRoadmapUpdate();
        toast.success("Roadmap updated successfully!");
      }
    } catch (error: any) {
      console.error("Error sending message:", error);

      // Fallback demo response for now
      const demoMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "I understand you'd like to modify the roadmap. This feature is currently being set up. In the meantime, I can help you:\n\n• Plan your next steps\n• Explain specific topics in detail\n• Suggest learning resources\n\nWhat would you like to know more about?",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, demoMessage]);
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

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-50",
          "w-14 h-14 rounded-full shadow-lg",
          "bg-blue-600 hover:bg-blue-700",
          "flex items-center justify-center",
          "transition-all duration-200 hover:scale-110",
          "group"
        )}
        title="AI Roadmap Assistant"
      >
        <Sparkles className="h-6 w-6 text-white animate-pulse" />
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
      </button>
    );
  }

  return (
    <Card
      className={cn(
        "fixed z-50 shadow-2xl transition-all duration-300 border-2",
        isMinimized
          ? "bottom-6 right-6 w-80 h-16"
          : "bottom-6 right-6 w-[420px] h-[600px]",
        "flex flex-col"
      )}
    >
      {/* Header */}
      <CardHeader className="flex-shrink-0 border-b bg-blue-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Sparkles className="h-5 w-5" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full" />
            </div>
            <CardTitle className="text-lg font-semibold">
              AI Assistant
            </CardTitle>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="h-8 w-8 p-0 text-white hover:bg-white/20"
            >
              {isMinimized ? (
                <Maximize2 className="h-4 w-4" />
              ) : (
                <Minimize2 className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 p-0 text-white hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {!isMinimized && (
          <p className="text-xs text-blue-100 mt-2">
            Ask me anything about your roadmap
          </p>
        )}
      </CardHeader>

      {/* Chat Content */}
      {!isMinimized && (
        <>
          <CardContent className="flex-1 p-0 overflow-hidden">
            <ScrollArea className="h-full" ref={scrollRef}>
              <div className="p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-3",
                      message.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {message.role === "assistant" && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[75%] rounded-2xl px-4 py-2.5",
                        message.role === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">
                        {message.content}
                      </p>
                      <span
                        className={cn(
                          "text-xs mt-1 block",
                          message.role === "user"
                            ? "text-blue-100"
                            : "text-slate-500 dark:text-slate-400"
                        )}
                      >
                        {message.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    {message.role === "user" && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                        <User className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-3 justify-start">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                    <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl px-4 py-3">
                      <Loader2 className="h-4 w-4 animate-spin text-slate-600 dark:text-slate-400" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>

          {/* Input Area */}
          <div className="flex-shrink-0 border-t p-4 bg-slate-50 dark:bg-slate-900/50">
            <div className="flex gap-2">
              <Textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type your message... (Shift+Enter for new line)"
                className="min-h-[60px] max-h-[120px] resize-none"
                disabled={isLoading}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="h-[60px] w-[60px] flex-shrink-0 bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge
                variant="secondary"
                className="cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 text-xs"
                onClick={() =>
                  setInputValue("Add a new section about testing best practices")
                }
              >
                Add section
              </Badge>
              <Badge
                variant="secondary"
                className="cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 text-xs"
                onClick={() =>
                  setInputValue("Reorganize topics by difficulty level")
                }
              >
                Reorganize
              </Badge>
              <Badge
                variant="secondary"
                className="cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 text-xs"
                onClick={() =>
                  setInputValue("Suggest improvements to this roadmap")
                }
              >
                Improve
              </Badge>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
