"use client";
import { Roadmap } from "@/Types/roadmap";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ChevronDown, Clock, BookOpen, Brain } from "lucide-react";
import { useState } from "react";
import PrerequisitesCard from "./PrerequisitesCard";
import ResourcesCard from "./ResourcesCard";
import QuizPanel from "./QuizPanel";
import { cn } from "@/lib/utils";

interface SyllabusViewProps {
  roadmap: Roadmap;
  roadmapId: string;
  selectedTopicId: string | null;
  onTopicSelect: (topicId: string | null) => void;
  progress?: Map<string, boolean>;
  onToggleCompletion?: (topicId: string) => void;
}

export default function SyllabusView({
  roadmap,
  roadmapId,
  selectedTopicId,
  onTopicSelect,
  progress,
  onToggleCompletion,
}: SyllabusViewProps) {
  // Find selected topic details
  let selectedTopic = null;
  if (selectedTopicId) {
    for (const level of roadmap.structure.levels) {
      for (const section of level.sections) {
        const topic = section.subtopics.find((sub) => sub.id === selectedTopicId);
        if (topic) {
          selectedTopic = topic;
          break;
        }
      }
      if (selectedTopic) break;
    }
  }
  const [expandedLevels, setExpandedLevels] = useState<Set<string>>(
    new Set(roadmap.structure.levels.map((l) => l.id))
  );
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set()
  );
  const [quizTopicId, setQuizTopicId] = useState<string | null>(null);
  const [quizTopicTitle, setQuizTopicTitle] = useState<string | null>(null);
  const [quizSheetOpen, setQuizSheetOpen] = useState(false);

  const toggleLevel = (levelId: string) => {
    const newExpanded = new Set(expandedLevels);
    if (newExpanded.has(levelId)) {
      newExpanded.delete(levelId);
    } else {
      newExpanded.add(levelId);
    }
    setExpandedLevels(newExpanded);
  };

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  return (
    <div className="space-y-4">
      {roadmap.structure.levels.map((level) => (
        <Card key={level.id}>
          <Collapsible
            open={expandedLevels.has(level.id)}
            onOpenChange={() => toggleLevel(level.id)}
          >
            <CollapsibleTrigger className="w-full">
              <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ChevronDown
                      className={cn(
                        "h-5 w-5 transition-transform",
                        expandedLevels.has(level.id) && "rotate-180"
                      )}
                    />
                    <div>
                      <CardTitle>{level.title}</CardTitle>
                      {level.description && (
                        <CardDescription className="mt-1">
                          {level.description}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                  {level.estimatedHours && (
                    <Badge variant="secondary" className="gap-1">
                      <Clock className="h-3 w-3" />
                      {level.estimatedHours}h
                    </Badge>
                  )}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-3 pt-0">
                {level.sections.map((section) => (
                  <Card key={section.id} className="border-l-4 border-l-primary">
                    <Collapsible
                      open={expandedSections.has(section.id)}
                      onOpenChange={() => toggleSection(section.id)}
                    >
                      <CollapsibleTrigger className="w-full">
                        <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors py-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <ChevronDown
                                className={cn(
                                  "h-4 w-4 transition-transform",
                                  expandedSections.has(section.id) && "rotate-180"
                                )}
                              />
                              <div>
                                <CardTitle className="text-lg">
                                  {section.title}
                                </CardTitle>
                                {section.description && (
                                  <CardDescription className="mt-1">
                                    {section.description}
                                  </CardDescription>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {section.estimatedHours && (
                                <Badge variant="outline" className="gap-1">
                                  <Clock className="h-3 w-3" />
                                  {section.estimatedHours}h
                                </Badge>
                              )}
                              <Badge variant="secondary">
                                {section.subtopics.length} topics
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="pt-0 space-y-2">
                          {section.subtopics.map((subtopic) => {
                            const isSelected = selectedTopicId === subtopic.id;
                            const prereqs = roadmap.prerequisites?.[subtopic.id];
                            const isCompleted = progress?.get(subtopic.id) || false;

                            return (
                              <div
                                key={subtopic.id}
                                className={cn(
                                  "p-3 rounded-lg border transition-colors",
                                  isSelected
                                    ? "bg-primary/10 border-primary"
                                    : "hover:bg-accent",
                                  isCompleted && "bg-green-50 dark:bg-green-950/20"
                                )}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex items-start gap-3 flex-1">
                                    {onToggleCompletion && (
                                      <Checkbox
                                        checked={isCompleted}
                                        onCheckedChange={() => onToggleCompletion(subtopic.id)}
                                        className="mt-1"
                                      />
                                    )}
                                    <div className="flex-1 cursor-pointer" onClick={() => onTopicSelect(isSelected ? null : subtopic.id)}>
                                      <div className="flex items-center gap-2">
                                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                                        <div className={cn("font-medium", isCompleted && "line-through text-muted-foreground")}>
                                          {subtopic.title}
                                        </div>
                                      </div>
                                      {subtopic.description && (
                                        <div className="text-sm text-muted-foreground mt-1 ml-6">
                                          {subtopic.description}
                                        </div>
                                      )}
                                      {prereqs && prereqs.requiredTopics.length > 0 && (
                                        <div className="mt-2 ml-6">
                                          <PrerequisitesCard
                                            prerequisite={prereqs}
                                            roadmap={roadmap}
                                          />
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {subtopic.estimatedHours && (
                                      <Badge variant="outline">
                                        {subtopic.estimatedHours}h
                                      </Badge>
                                    )}
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="gap-1"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setQuizTopicId(subtopic.id);
                                        setQuizTopicTitle(subtopic.title);
                                        setQuizSheetOpen(true);
                                      }}
                                    >
                                      <Brain className="h-3 w-3" />
                                      Quiz
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </CardContent>
                      </CollapsibleContent>
                    </Collapsible>
                  </Card>
                ))}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      ))}

      {/* Resources Card - Show when a topic is selected */}
      {selectedTopic && (
        <ResourcesCard
          roadmapId={roadmapId}
          topicId={selectedTopic.id}
          topicTitle={selectedTopic.title}
        />
      )}

      {/* Quiz Sheet */}
      <Sheet open={quizSheetOpen} onOpenChange={setQuizSheetOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader className="pb-4">
            <SheetTitle>Assessment Quiz</SheetTitle>
            <SheetDescription>
              Test your knowledge on {quizTopicTitle}
            </SheetDescription>
          </SheetHeader>
          {quizTopicId && (
            <QuizPanel
              roadmapId={roadmapId}
              topicId={quizTopicId}
              topicTitle={quizTopicTitle || ""}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

