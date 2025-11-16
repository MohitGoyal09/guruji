"use client";
import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import axios from "axios";
import {
  Lightbulb,
  BookOpen,
  Code,
  AlertCircle,
  Link as LinkIcon,
  Sparkles,
  X,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface TopicExplanationPanelProps {
  roadmapId: string;
  topicId: string | null;
  topicTitle: string | null;
  isOpen: boolean;
  onClose: () => void;
}

interface ExplanationData {
  beginner?: {
    overview: string;
    keyPoints: string[];
    analogy?: string;
  };
  intermediate?: {
    deepDive: string;
    technicalDetails: string[];
    bestPractices: string[];
  };
  expert?: {
    advancedConcepts: string;
    architecturePatterns: string[];
    optimizationTips: string[];
  };
  examples?: {
    title: string;
    code?: string;
    description: string;
  }[];
  commonMistakes?: {
    mistake: string;
    solution: string;
  }[];
  relatedTopics?: (string | { topic: string; relationship?: string })[];
  quickTips?: string[];
}

export default function TopicExplanationPanel({
  roadmapId,
  topicId,
  topicTitle,
  isOpen,
  onClose,
}: TopicExplanationPanelProps) {
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState<ExplanationData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && topicId && roadmapId) {
      fetchExplanation();
    } else {
      setExplanation(null);
      setError(null);
    }
  }, [isOpen, topicId, roadmapId]);

  const fetchExplanation = async () => {
    if (!topicId || !roadmapId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        `/api/roadmaps/${roadmapId}/explain/${topicId}`
      );
      setExplanation(response.data.explanation);
    } catch (err: any) {
      console.error("Error fetching explanation:", err);
      setError(err.response?.data?.error || "Failed to load explanation");
      toast.error("Failed to load explanation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-3xl overflow-y-auto bg-slate-900 dark:bg-slate-900 p-0 border-l border-slate-700">
        <SheetHeader className="sticky top-0 z-10 bg-slate-900 dark:bg-slate-900 border-b border-slate-700 px-6 py-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <SheetTitle className="text-xl font-semibold flex items-center gap-2 text-white dark:text-white">
                <Sparkles className="h-5 w-5 text-blue-400" />
                {topicTitle || "Topic Explanation"}
              </SheetTitle>
              <SheetDescription className="mt-1 text-sm text-slate-400 dark:text-slate-400">
                AI-powered comprehensive explanation
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="px-6 py-6 bg-slate-900">
          {loading && (
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-10 w-10 animate-spin text-blue-400 mb-3" />
                <p className="text-sm text-slate-400 dark:text-slate-400">Generating explanation...</p>
              </div>
            </div>
          )}

          {error && (
            <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-red-900 dark:text-red-200">
                      Failed to load explanation
                    </h3>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                      {error}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchExplanation}
                      className="mt-3"
                    >
                      Try Again
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {!loading && !error && explanation && (
            <Tabs defaultValue="beginner" className="w-full">
              <TabsList className="grid w-full grid-cols-3 h-11 bg-slate-800 dark:bg-slate-800 border border-slate-700">
                <TabsTrigger value="beginner" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-400 dark:text-slate-400">
                  <BookOpen className="h-4 w-4 mr-2" />
                  <span className="font-medium">Beginner</span>
                </TabsTrigger>
                <TabsTrigger value="intermediate" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-400 dark:text-slate-400">
                  <Code className="h-4 w-4 mr-2" />
                  <span className="font-medium">Intermediate</span>
                </TabsTrigger>
                <TabsTrigger value="expert" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-400 dark:text-slate-400">
                  <Sparkles className="h-4 w-4 mr-2" />
                  <span className="font-medium">Expert</span>
                </TabsTrigger>
              </TabsList>

              {/* Beginner Tab */}
              <TabsContent value="beginner" className="space-y-3 mt-6">
                {explanation.beginner && (
                  <>
                    <Card className="shadow-sm border-slate-700 dark:border-slate-700 bg-slate-800 dark:bg-slate-800">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold flex items-center gap-2 text-white dark:text-white">
                          <BookOpen className="h-4 w-4 text-blue-400" />
                          Overview
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm leading-relaxed text-slate-300 dark:text-slate-300">
                          {explanation.beginner.overview}
                        </p>
                      </CardContent>
                    </Card>

                    {explanation.beginner.analogy && (
                      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2 text-blue-900 dark:text-blue-100">
                            <Lightbulb className="h-5 w-5" />
                            Simple Analogy
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm leading-relaxed text-blue-800 dark:text-blue-200">
                            {explanation.beginner.analogy}
                          </p>
                        </CardContent>
                      </Card>
                    )}

                    {explanation.beginner.keyPoints &&
                      explanation.beginner.keyPoints.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">Key Points</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-2">
                              {explanation.beginner.keyPoints.map(
                                (point, idx) => (
                                  <li
                                    key={idx}
                                    className="flex items-start gap-2"
                                  >
                                    <span className="text-primary mt-0.5">
                                      •
                                    </span>
                                    <span className="text-sm">{point}</span>
                                  </li>
                                )
                              )}
                            </ul>
                          </CardContent>
                        </Card>
                      )}
                  </>
                )}
              </TabsContent>

              {/* Intermediate Tab */}
              <TabsContent value="intermediate" className="space-y-4 mt-4">
                {explanation.intermediate && (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Code className="h-5 w-5" />
                          Deep Dive
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm leading-relaxed">
                          {explanation.intermediate.deepDive}
                        </p>
                      </CardContent>
                    </Card>

                    {explanation.intermediate.technicalDetails &&
                      explanation.intermediate.technicalDetails.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">
                              Technical Details
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-2">
                              {explanation.intermediate.technicalDetails.map(
                                (detail, idx) => (
                                  <li
                                    key={idx}
                                    className="flex items-start gap-2"
                                  >
                                    <Badge variant="outline" className="mt-0.5">
                                      {idx + 1}
                                    </Badge>
                                    <span className="text-sm">{detail}</span>
                                  </li>
                                )
                              )}
                            </ul>
                          </CardContent>
                        </Card>
                      )}

                    {explanation.intermediate.bestPractices &&
                      explanation.intermediate.bestPractices.length > 0 && (
                        <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
                          <CardHeader>
                            <CardTitle className="text-lg text-green-900 dark:text-green-100">
                              Best Practices
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-2">
                              {explanation.intermediate.bestPractices.map(
                                (practice, idx) => (
                                  <li
                                    key={idx}
                                    className="flex items-start gap-2 text-green-800 dark:text-green-200"
                                  >
                                    <span className="text-green-600 dark:text-green-400 mt-0.5">
                                      ✓
                                    </span>
                                    <span className="text-sm">{practice}</span>
                                  </li>
                                )
                              )}
                            </ul>
                          </CardContent>
                        </Card>
                      )}
                  </>
                )}

                {explanation.examples && explanation.examples.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Examples</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {explanation.examples.map((example, idx) => (
                        <div key={idx} className="space-y-2">
                          <h4 className="font-semibold text-sm">
                            {example.title}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {example.description}
                          </p>
                          {example.code && (
                            <pre className="bg-slate-100 dark:bg-slate-900 p-3 rounded-lg overflow-x-auto">
                              <code className="text-xs">{example.code}</code>
                            </pre>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Expert Tab */}
              <TabsContent value="expert" className="space-y-4 mt-4">
                {explanation.expert && (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Sparkles className="h-5 w-5" />
                          Advanced Concepts
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm leading-relaxed">
                          {explanation.expert.advancedConcepts}
                        </p>
                      </CardContent>
                    </Card>

                    {explanation.expert.architecturePatterns &&
                      explanation.expert.architecturePatterns.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">
                              Architecture Patterns
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-2">
                              {explanation.expert.architecturePatterns.map(
                                (pattern, idx) => (
                                  <li
                                    key={idx}
                                    className="flex items-start gap-2"
                                  >
                                    <Badge className="mt-0.5">{idx + 1}</Badge>
                                    <span className="text-sm">{pattern}</span>
                                  </li>
                                )
                              )}
                            </ul>
                          </CardContent>
                        </Card>
                      )}

                    {explanation.expert.optimizationTips &&
                      explanation.expert.optimizationTips.length > 0 && (
                        <Card className="bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900">
                          <CardHeader>
                            <CardTitle className="text-lg text-purple-900 dark:text-purple-100">
                              Optimization Tips
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-2">
                              {explanation.expert.optimizationTips.map(
                                (tip, idx) => (
                                  <li
                                    key={idx}
                                    className="flex items-start gap-2 text-purple-800 dark:text-purple-200"
                                  >
                                    <span className="text-purple-600 dark:text-purple-400 mt-0.5">
                                      ⚡
                                    </span>
                                    <span className="text-sm">{tip}</span>
                                  </li>
                                )
                              )}
                            </ul>
                          </CardContent>
                        </Card>
                      )}
                  </>
                )}
              </TabsContent>
            </Tabs>
          )}

          {/* Common Mistakes - Show in all tabs */}
          {!loading &&
            !error &&
            explanation?.commonMistakes &&
            explanation.commonMistakes.length > 0 && (
              <Card className="mt-4 bg-slate-800 dark:bg-slate-800 border-2 border-orange-500 dark:border-orange-500">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-white dark:text-white">
                    <AlertCircle className="h-5 w-5 text-orange-500" />
                    Common Mistakes to Avoid
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {explanation.commonMistakes.map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-start gap-2 text-white dark:text-white">
                        <X className="h-4 w-4 mt-0.5 text-red-500 dark:text-red-500" />
                        <span className="text-sm font-medium">
                          {item.mistake}
                        </span>
                      </div>
                      <div className="ml-6 text-sm text-orange-400 dark:text-orange-400">
                        <strong className="text-orange-500">Solution:</strong> {item.solution}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

          {/* Quick Tips - Show in all tabs */}
          {!loading &&
            !error &&
            explanation?.quickTips &&
            explanation.quickTips.length > 0 && (
              <Card className="mt-4 bg-slate-800 dark:bg-slate-800 border-2 border-orange-500 dark:border-orange-500">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-white dark:text-white">
                    <Lightbulb className="h-5 w-5 text-orange-500" />
                    Quick Tips
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {explanation.quickTips.map((tip, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-white dark:text-white"
                      >
                        <span className="text-orange-500 dark:text-orange-500 mt-0.5 text-sm">
                          •
                        </span>
                        <span className="text-sm">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

          {/* Related Topics - Show in all tabs */}
          {!loading &&
            !error &&
            explanation?.relatedTopics &&
            explanation.relatedTopics.length > 0 && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <LinkIcon className="h-5 w-5" />
                    Related Topics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {explanation.relatedTopics.map((topic, idx) => (
                      <Badge key={idx} variant="secondary">
                        {typeof topic === 'string' ? topic : topic.topic || JSON.stringify(topic)}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
