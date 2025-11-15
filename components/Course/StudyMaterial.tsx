import { BookOpen, FileQuestion, Layers, ListChecks, Video } from "lucide-react";
import React, { useEffect } from "react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton";
import { Course } from "@/Types/course";
import { toast } from "sonner";

export default function StudyMaterial({
  courseId,
  course,
}: {
  courseId: string;
  course: Course;
}) {
  const [studyTypeContent, setStudyTypeContent] = React.useState<
    Record<string, unknown>
  >({});
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const GenerateContent = async (type: string) => {
    try {
      setLoading(true);
      toast('Generating content, please wait...');
      setError(null);

      const chapters = course?.courseLayout.chapters.map((chapter) => ({
        title: chapter.chapter_title,
        content: chapter.topics,
      }));

      const result = await axios.post("/api/study-type-content", {
        courseId: course.courseId,
        type,
        chapters,
      });
      
      setStudyTypeContent((prev) => ({
        ...prev,
        [type]: result.data,
      }));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate content"
      );
    } finally {
      setLoading(false);
      toast('Content generated successfully');
    }
  };
  useEffect(() => {
    GetStudyMaterial();
    toast("Please wait few minutes while the content is being generated");
  }, [courseId]);

  const MaterialList = [
    {
      name: "Notes",
      desc: "Chapter wise notes",
      icon: BookOpen,
      path: "/notes",
      type: "notes",
    },
    {
      name: "Flashcards",
      desc: "Chapter wise flashcards",
      icon: Layers,
      path: "/flashcards",
      type: "flashcards",
    },
    {
      name: "Quizzes",
      desc: "Chapter wise quizzes",
      icon: ListChecks,
      path: "/quizzes",
      type: "quizzes",
    },
    {
      name: "QA",
      desc: "Chapter wise QA",
      icon: FileQuestion,
      path: "/qa",
      type: "qa",
    },
    {
      name: "Video",
      desc: "Animated explanation video",
      icon: Video,
      path: "/video",
      type: "video",
    },
  ];

  const GetStudyMaterial = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await axios.post("/api/study-type", {
        courseId,
        studyType: "ALL",
      });
      setStudyTypeContent(result.data);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      if (axios.isAxiosError(error)) {
        setError(error.response?.data.message || error.message);
      } else {
        setError("Unexpected error occurred.");
      }
    }
  };

  if (loading) {
    return (
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-full" />
            </div>
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-6 text-red-500">
        <div className="bg-red-100 dark:bg-red-900/20 rounded-lg p-4">
          Error: {error}
        </div>
      </div>
    );
  }

  const gradients = [
    "from-blue-500 to-cyan-500",
    "from-purple-500 to-pink-500",
    "from-orange-500 to-red-500",
    "from-green-500 to-emerald-500",
    "from-indigo-500 to-purple-500",
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {MaterialList.map((item, index) => {
        const isAvailable =
          studyTypeContent[item.type] !== null &&
          studyTypeContent[item.type] !== undefined;
        const gradient = gradients[index % gradients.length];

        return isAvailable ? (
          <Link href={`/course/${courseId}${item.path}`} key={item.type}>
            <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 border-2 hover:border-primary/50">
              <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />

              <CardHeader className="space-y-6 p-6">
                <div className={`relative w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
                  <item.icon className="w-8 h-8 text-white" />
                </div>

                <div className="space-y-2">
                  <CardTitle className="text-2xl font-bold">{item.name}</CardTitle>
                  <CardDescription className="text-base">
                    {item.desc}
                  </CardDescription>
                </div>

                <Button
                  className={`w-full mt-4 bg-gradient-to-r ${gradient} text-white border-0 hover:opacity-90 transition-opacity`}
                  size="lg"
                >
                  View
                </Button>
              </CardHeader>
            </Card>
          </Link>
        ) : (
          <Card
            key={item.type}
            className="group relative overflow-hidden transition-all duration-300 border-2 border-dashed opacity-75 hover:opacity-100"
          >
            <CardHeader className="space-y-6 p-6">
              <div className="relative w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                <item.icon className="w-8 h-8 text-muted-foreground" />
              </div>

              <div className="space-y-2">
                <CardTitle className="text-2xl font-bold">{item.name}</CardTitle>
                <CardDescription className="text-base">
                  {item.desc}
                </CardDescription>
              </div>

              <Button
                className="w-full mt-4"
                variant="outline"
                size="lg"
                onClick={() => GenerateContent(item.type)}
              >
                Generate
              </Button>
            </CardHeader>
          </Card>
        );
      })}
    </div>
  );
}
