import React from "react";
import { Course } from "@/Types/course";
import { BarChart2, BookOpen, Layers } from "lucide-react";

export default function CourseIntro({ course }: { course: Course }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-1">
      <div className="relative bg-background rounded-2xl p-8 md:p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl" />

        <div className="relative space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 rounded-full border border-blue-500/20">
            <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Course</span>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              {course?.courseLayout?.course_title || "No Title Available"}
            </h1>

            <p className="text-lg text-muted-foreground max-w-3xl leading-relaxed">
              {course?.courseLayout?.course_summary || "No Summary Available"}
            </p>
          </div>

          <div className="flex flex-wrap gap-4 pt-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
              <Layers className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-medium">
                {course?.courseLayout?.chapters.length || 0} Chapters
              </span>
            </div>

            <div className="flex items-center gap-2 px-4 py-2 bg-pink-500/10 rounded-lg border border-pink-500/20">
              <BarChart2 className="w-5 h-5 text-pink-600 dark:text-pink-400" />
              <span className="text-sm font-medium capitalize">
                {course?.courseLayout?.difficulty || "No Difficulty Set"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
