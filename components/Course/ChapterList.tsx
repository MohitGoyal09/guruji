import React from "react";
import { CourseLayout } from "@/Types/course";
import { BookOpenCheck, CheckCircle2 } from "lucide-react";

export default function ChapterList({
  courseLayout,
}: {
  courseLayout: CourseLayout;
}) {
  const Chapters = courseLayout.chapters;
  const colors = [
    "bg-blue-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-orange-500",
    "bg-green-500",
    "bg-indigo-500",
    "bg-cyan-500",
  ];

  return (
    <div className="space-y-6">
      {Chapters.map((chapter, idx) => {
        const color = colors[idx % colors.length];
        return (
          <div
            key={chapter.chapter_number}
            className="group relative overflow-hidden rounded-2xl border-2 bg-card transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
          >
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${color}`} />

            <div className="p-6 md:p-8">
              <div className="flex items-start gap-4 mb-4">
                <div className={`flex-shrink-0 w-12 h-12 rounded-xl ${color} flex items-center justify-center shadow-lg`}>
                  <BookOpenCheck className="w-6 h-6 text-white" />
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${color} text-white`}>
                      Chapter {chapter.chapter_number}
                    </span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-3">
                    {chapter.chapter_title}
                  </h2>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    {chapter.chapter_summary}
                  </p>
                </div>
              </div>

              <div className="mt-6 pl-16">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Topics Covered
                </h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {chapter.topics.map((topic, index) => (
                    <li key={index} className="flex items-start gap-2 group/item">
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-foreground group-hover/item:text-primary transition-colors">
                        {topic}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
