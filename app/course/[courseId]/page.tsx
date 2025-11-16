"use client";
import { useParams } from "next/navigation";
import axios from "axios";
import React, { useState, useEffect } from "react";
import CourseIntro from "@/components/Course/CourseIntro";
import { Course } from "@/Types/course";
import StudyMaterial from "@/components/Course/StudyMaterial";
import ChapterList from "@/components/Course/ChapterList";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/app/_context/LanguageContext";
import { translateObject } from "@/lib/translation/lingoTranslation";

export default function CoursePage() {
  const { courseId } = useParams();
  const { language, availableLanguages } = useLanguage();
  const [courseState, setCourseState] = useState<
    "loading" | "success" | "error"
  >("loading");
  const [course, setCourse] = useState<Course | null>(null);
  const [originalCourse, setOriginalCourse] = useState<Course | null>(null);
  const [translating, setTranslating] = useState(false);
  const [translationProgress, setTranslationProgress] = useState(0);
  const [error, setError] = useState<unknown | null>(null);

  const currentLanguage = availableLanguages.find(l => l.code === language) || availableLanguages[0];

  useEffect(() => {
    if (courseId) {
      GetCourse();
    }
  }, [courseId]);

  // Translate course when language changes
  useEffect(() => {
    if (originalCourse) {
      translateCourse();
    }
  }, [language, originalCourse]);

  const translateCourse = async () => {
    console.log("🎯 [Course] translateCourse called:", {
      language,
      languageName: currentLanguage?.name,
      hasCourse: !!originalCourse,
    });

    if (language === "en" || !originalCourse) {
      console.log("⏭️ [Course] Language is English or no course, using original");
      setCourse(originalCourse);
      return;
    }

    console.log("🚀 [Course] Starting translation process");
    setTranslating(true);
    setTranslationProgress(0);

    try {
      const translated = await translateObject(
        originalCourse,
        language,
        (progress) => {
          console.log(`📊 [Course] Translation progress: ${progress}%`);
          setTranslationProgress(progress);
        }
      );
      console.log("✅ [Course] Translation successful");
      setCourse(translated as Course);
    } catch (error) {
      console.error("❌ [Course] Translation error:", error);
      setCourse(originalCourse);
    } finally {
      console.log("🏁 [Course] Translation finished");
      setTranslating(false);
      setTranslationProgress(0);
    }
  };

  const GetCourse = async () => {
    try {
      const result = await axios.get("/api/courses", {
        params: {
          courseId: courseId,
        },
      });

      if (result.data.course && Array.isArray(result.data.course)) {
        if (result.data.course.length > 0) {
          const courseData = result.data.course[0];

          if (typeof courseData.courseLayout === "string") {
            courseData.courseLayout = JSON.parse(courseData.courseLayout);
          }
          setOriginalCourse(courseData);
          setCourse(courseData);
          setCourseState("success");
        } else {
          setError("Course not found");
          setCourseState("error");
        }
      } else {
        setError("Invalid course data format");
        setCourseState("error");
      }
    } catch (error) {
      setError(error);
      setCourseState("error");
    }
  };

  if (courseState === "loading") {
    return (
      <div>
        <div className="mx-10 md:mx-36 lg:px-60 mt-10">
          
          <div className="space-y-4">
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
          </div>

          
          <div className="mt-10">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
          </div>

         
          <div className="mt-10 space-y-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
          </div>
        </div>
      </div>
    );
  } else if (courseState === "error") {
    return (
      <div>
        <div className="mx-10 md:mx-36 lg:px-60 mt-10">
          <div className="p-6 bg-red-50 border border-red-200 rounded-lg"></div>
        <p className="text-red-600 font-medium text-center">
          Error fetching course data. Please try again later.
        </p>
          </div>
        </div>
      
    );
  } else if (courseState === "success") {
    console.log(course);
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
          {translating && (
            <div className="max-w-4xl mx-auto mb-6">
              <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
                <p className="text-center text-sm text-blue-700 dark:text-blue-300 mb-2">
                  Translating course to {currentLanguage.flag} {currentLanguage.name}... {translationProgress}%
                </p>
                <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                  <div
                    className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${translationProgress}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {course && <CourseIntro course={course} />}

          <div className="space-y-8">
            <div className="space-y-3">
              <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Study Materials
              </h2>
              <p className="text-muted-foreground text-lg">
                Choose your preferred learning method
              </p>
            </div>

            {courseId && course && (
              <StudyMaterial
                courseId={Array.isArray(courseId) ? courseId[0] : courseId}
                course={course}
              />
            )}
          </div>

          <div className="space-y-8">
            <div className="space-y-3">
              <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Course Curriculum
              </h2>
              <p className="text-muted-foreground text-lg">
                Explore the chapters and topics covered in this course
              </p>
            </div>

            {course && <ChapterList courseLayout={course.courseLayout} />}
          </div>
        </div>
      </div>
    );
  }
}
