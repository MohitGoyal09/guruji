"use client";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import axios from "axios";
import {
  Rocket,
  Target,
  CheckCircle2,
  ChevronDown,
  Sparkles,
  Code,
  Lightbulb,
  Clock,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Project {
  title: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedHours: number;
  learningObjectives: string[];
  features: string[];
  acceptanceCriteria: string[];
  techStack?: string[];
  bonusChallenges?: string[];
}

interface ProjectsPanelProps {
  roadmapId: string;
  sectionId: string;
  sectionTitle: string;
}

const difficultyConfig = {
  beginner: {
    color: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200",
    icon: TrendingUp,
    label: "Beginner",
  },
  intermediate: {
    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200",
    icon: Target,
    label: "Intermediate",
  },
  advanced: {
    color: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
    icon: Rocket,
    label: "Advanced",
  },
};

export default function ProjectsPanel({
  roadmapId,
  sectionId,
  sectionTitle,
}: ProjectsPanelProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedProjects, setExpandedProjects] = useState<Set<number>>(new Set());

  const fetchProjects = async () => {
    if (projects.length > 0) return; // Already fetched

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        `/api/roadmaps/${roadmapId}/projects/${sectionId}`
      );
      setProjects(response.data.projects || []);
    } catch (err: any) {
      console.error("Error fetching projects:", err);
      setError(err.response?.data?.error || "Failed to load projects");
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const toggleProject = (index: number) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedProjects(newExpanded);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <Code className="h-5 w-5" />
              Hands-on Projects
            </CardTitle>
            <CardDescription className="mt-2">
              AI-generated projects for <strong>{sectionTitle}</strong>
            </CardDescription>
          </div>
          {projects.length === 0 && !loading && (
            <Button
              onClick={fetchProjects}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Projects
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {loading && (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <Button onClick={fetchProjects} variant="outline">
              Try Again
            </Button>
          </div>
        )}

        {!loading && !error && projects.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <Lightbulb className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              No projects generated yet. Click the button above to generate
              hands-on learning projects with AI!
            </p>
          </div>
        )}

        {!loading && !error && projects.length > 0 && (
          <div className="space-y-4">
            {projects.map((project, index) => {
              const DifficultyIcon = difficultyConfig[project.difficulty].icon;
              const isExpanded = expandedProjects.has(index);

              return (
                <Card
                  key={index}
                  className="border-l-4 border-l-primary transition-all hover:shadow-md"
                >
                  <Collapsible
                    open={isExpanded}
                    onOpenChange={() => toggleProject(index)}
                  >
                    <CollapsibleTrigger className="w-full">
                      <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 text-left">
                            <div className="flex items-center gap-2 mb-2">
                              <ChevronDown
                                className={cn(
                                  "h-5 w-5 transition-transform",
                                  isExpanded && "rotate-180"
                                )}
                              />
                              <CardTitle className="text-lg">
                                {project.title}
                              </CardTitle>
                            </div>
                            <CardDescription>
                              {project.description}
                            </CardDescription>
                          </div>
                          <div className="flex flex-col gap-2 ml-4">
                            <Badge
                              className={cn(
                                "gap-1",
                                difficultyConfig[project.difficulty].color
                              )}
                            >
                              <DifficultyIcon className="h-3 w-3" />
                              {difficultyConfig[project.difficulty].label}
                            </Badge>
                            <Badge variant="outline" className="gap-1">
                              <Clock className="h-3 w-3" />
                              {project.estimatedHours}h
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <CardContent className="pt-0 space-y-4">
                        {/* Learning Objectives */}
                        <div>
                          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                            <Target className="h-4 w-4 text-blue-600" />
                            Learning Objectives
                          </h4>
                          <ul className="space-y-1 ml-6">
                            {project.learningObjectives.map((objective, idx) => (
                              <li
                                key={idx}
                                className="text-sm text-muted-foreground flex items-start gap-2"
                              >
                                <span className="text-blue-600 mt-0.5">•</span>
                                <span>{objective}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Features */}
                        <div>
                          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                            <Code className="h-4 w-4 text-green-600" />
                            Features to Implement
                          </h4>
                          <ul className="space-y-1 ml-6">
                            {project.features.map((feature, idx) => (
                              <li
                                key={idx}
                                className="text-sm text-muted-foreground flex items-start gap-2"
                              >
                                <span className="text-green-600 mt-0.5">✓</span>
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Tech Stack */}
                        {project.techStack && project.techStack.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-sm mb-2">
                              Tech Stack
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {project.techStack.map((tech, idx) => (
                                <Badge key={idx} variant="secondary">
                                  {tech}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Acceptance Criteria */}
                        <div>
                          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-purple-600" />
                            Acceptance Criteria
                          </h4>
                          <ul className="space-y-1 ml-6">
                            {project.acceptanceCriteria.map((criteria, idx) => (
                              <li
                                key={idx}
                                className="text-sm text-muted-foreground flex items-start gap-2"
                              >
                                <span className="text-purple-600 mt-0.5">□</span>
                                <span>{criteria}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Bonus Challenges */}
                        {project.bonusChallenges &&
                          project.bonusChallenges.length > 0 && (
                            <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg border border-amber-200 dark:border-amber-900">
                              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2 text-amber-900 dark:text-amber-100">
                                <Rocket className="h-4 w-4" />
                                Bonus Challenges
                              </h4>
                              <ul className="space-y-1 ml-6">
                                {project.bonusChallenges.map((challenge, idx) => (
                                  <li
                                    key={idx}
                                    className="text-sm text-amber-800 dark:text-amber-200 flex items-start gap-2"
                                  >
                                    <span className="mt-0.5">⚡</span>
                                    <span>{challenge}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                        <div className="pt-2 flex gap-2">
                          <Button className="flex-1" variant="default">
                            <Rocket className="mr-2 h-4 w-4" />
                            Start Project
                          </Button>
                          <Button variant="outline">
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Mark Complete
                          </Button>
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
