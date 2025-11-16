"use client";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import axios from "axios";
import {
  Brain,
  CheckCircle2,
  XCircle,
  Trophy,
  Target,
  Sparkles,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface QuizQuestion {
  id: string;
  type: "multiple-choice" | "true-false" | "code";
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: "beginner" | "intermediate" | "advanced";
}

interface QuizData {
  title: string;
  description: string;
  questions: QuizQuestion[];
  passingScore: number;
}

interface QuizPanelProps {
  roadmapId: string;
  topicId: string;
  topicTitle: string;
}

export default function QuizPanel({
  roadmapId,
  topicId,
  topicTitle,
}: QuizPanelProps) {
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);

  const startQuiz = async (difficulty: string = "intermediate") => {
    setLoading(true);

    try {
      const response = await axios.post(
        `/api/roadmaps/${roadmapId}/quiz/${topicId}`,
        {
          difficulty,
          questionCount: 5,
        }
      );
      setQuizData(response.data.quiz);
      setQuizStarted(true);
      setCurrentQuestion(0);
      setUserAnswers({});
      setShowResults(false);
    } catch (error: any) {
      console.error("Error generating quiz:", error);
      toast.error("Failed to generate quiz");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (questionId: string, answer: string) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const nextQuestion = () => {
    if (quizData && currentQuestion < quizData.questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
    }
  };

  const submitQuiz = () => {
    setShowResults(true);
  };

  const resetQuiz = () => {
    setQuizStarted(false);
    setQuizData(null);
    setUserAnswers({});
    setShowResults(false);
    setCurrentQuestion(0);
  };

  const calculateScore = () => {
    if (!quizData) return { correct: 0, total: 0, percentage: 0 };

    let correct = 0;
    quizData.questions.forEach((q) => {
      if (userAnswers[q.id] === q.correctAnswer) {
        correct++;
      }
    });

    return {
      correct,
      total: quizData.questions.length,
      percentage: Math.round((correct / quizData.questions.length) * 100),
    };
  };

  // Start screen
  if (!quizStarted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Test Your Knowledge
          </CardTitle>
          <CardDescription>
            Take an AI-generated quiz on <strong>{topicTitle}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Challenge yourself with an adaptive quiz tailored to your learning level.
            Choose your difficulty to get started!
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col gap-2"
              onClick={() => startQuiz("beginner")}
              disabled={loading}
            >
              <Target className="h-5 w-5 text-green-600" />
              <span className="font-semibold">Beginner</span>
              <span className="text-xs text-muted-foreground">
                Basic concepts
              </span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col gap-2"
              onClick={() => startQuiz("intermediate")}
              disabled={loading}
            >
              <Brain className="h-5 w-5 text-yellow-600" />
              <span className="font-semibold">Intermediate</span>
              <span className="text-xs text-muted-foreground">
                Applied knowledge
              </span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col gap-2"
              onClick={() => startQuiz("advanced")}
              disabled={loading}
            >
              <Sparkles className="h-5 w-5 text-purple-600" />
              <span className="font-semibold">Advanced</span>
              <span className="text-xs text-muted-foreground">
                Expert level
              </span>
            </Button>
          </div>
          {loading && (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Results screen
  if (showResults && quizData) {
    const score = calculateScore();
    const passed = score.percentage >= (quizData.passingScore || 70);

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className={cn("h-6 w-6", passed ? "text-yellow-500" : "text-slate-400")} />
            Quiz Results
          </CardTitle>
          <CardDescription>Your performance on {topicTitle}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Score Summary */}
          <div className="text-center py-6 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
            <div className="text-6xl font-bold mb-2">{score.percentage}%</div>
            <div className="text-lg text-muted-foreground">
              {score.correct} out of {score.total} correct
            </div>
            <Badge
              className={cn(
                "mt-4",
                passed ? "bg-green-500" : "bg-orange-500"
              )}
            >
              {passed ? "Passed!" : "Keep Learning"}
            </Badge>
          </div>

          {/* Question Review */}
          <div className="space-y-4">
            <h3 className="font-semibold">Review Your Answers</h3>
            {quizData.questions.map((question, idx) => {
              const userAnswer = userAnswers[question.id];
              const isCorrect = userAnswer === question.correctAnswer;

              return (
                <Card key={question.id} className={cn(
                  "border-l-4",
                  isCorrect ? "border-l-green-500" : "border-l-red-500"
                )}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {isCorrect ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600" />
                          )}
                          <span className="font-semibold">Question {idx + 1}</span>
                        </div>
                        <p className="text-sm">{question.question}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="grid gap-2">
                      <div className={cn(
                        "p-2 rounded text-sm",
                        isCorrect ? "bg-green-100 dark:bg-green-950/30" : "bg-red-100 dark:bg-red-950/30"
                      )}>
                        <strong>Your answer:</strong> {userAnswer || "Not answered"}
                      </div>
                      {!isCorrect && (
                        <div className="p-2 rounded text-sm bg-green-100 dark:bg-green-950/30">
                          <strong>Correct answer:</strong> {question.correctAnswer}
                        </div>
                      )}
                    </div>
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg text-sm">
                      <strong className="flex items-center gap-2 mb-1">
                        <AlertCircle className="h-4 w-4" />
                        Explanation:
                      </strong>
                      <p className="text-muted-foreground">{question.explanation}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="flex gap-2">
            <Button onClick={resetQuiz} className="flex-1">
              <RotateCcw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            {!passed && (
              <Button variant="outline" className="flex-1">
                <Brain className="mr-2 h-4 w-4" />
                Study More
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Quiz in progress
  if (quizData) {
    const question = quizData.questions[currentQuestion];
    const progress = ((currentQuestion + 1) / quizData.questions.length) * 100;
    const allAnswered = quizData.questions.every((q) => userAnswers[q.id]);

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <Badge variant="secondary">
              Question {currentQuestion + 1} of {quizData.questions.length}
            </Badge>
            <Badge className={cn(
              question.difficulty === "beginner" && "bg-green-500",
              question.difficulty === "intermediate" && "bg-yellow-500",
              question.difficulty === "advanced" && "bg-purple-500"
            )}>
              {question.difficulty}
            </Badge>
          </div>
          <Progress value={progress} className="h-2" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">{question.question}</h3>

            {question.type === "true-false" ? (
              <RadioGroup
                value={userAnswers[question.id] || ""}
                onValueChange={(value) => handleAnswer(question.id, value)}
              >
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="True" id={`${question.id}-true`} />
                  <Label htmlFor={`${question.id}-true`} className="flex-1 cursor-pointer">
                    True
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="False" id={`${question.id}-false`} />
                  <Label htmlFor={`${question.id}-false`} className="flex-1 cursor-pointer">
                    False
                  </Label>
                </div>
              </RadioGroup>
            ) : (
              <RadioGroup
                value={userAnswers[question.id] || ""}
                onValueChange={(value) => handleAnswer(question.id, value)}
              >
                {question.options?.map((option, idx) => (
                  <div
                    key={idx}
                    className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer"
                  >
                    <RadioGroupItem value={option} id={`${question.id}-${idx}`} />
                    <Label htmlFor={`${question.id}-${idx}`} className="flex-1 cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}
          </div>

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={previousQuestion}
              disabled={currentQuestion === 0}
            >
              Previous
            </Button>

            {currentQuestion === quizData.questions.length - 1 ? (
              <Button
                onClick={submitQuiz}
                disabled={!allAnswered}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Submit Quiz
              </Button>
            ) : (
              <Button onClick={nextQuestion}>
                Next
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
