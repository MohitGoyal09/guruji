"use client";
import axios from "axios";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { toast } from "sonner";
import { useLanguage } from "@/app/_context/LanguageContext";
import { translateArray } from "@/lib/translation/lingoTranslation";

interface ChapterNotes {
  chapter_number: number;
  chapter_title: string;
  chapter_summary: string;
  topics: string[];
  notes: {
    html_content: string;
  };
}

interface NotesResponse {
  id: number;
  courseId: string;
  chapterId: number;
  notes: string;
}

function ViewNotes() {
  const { courseId } = useParams();
  const { language, availableLanguages } = useLanguage();
  const [notesData, setNotesData] = useState<ChapterNotes[]>([]);
  const [originalNotesData, setOriginalNotesData] = useState<ChapterNotes[]>([]);
  const [currentNoteIndex, setCurrentNoteIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [translating, setTranslating] = useState(false);
  const [translationProgress, setTranslationProgress] = useState(0);

  const currentLanguage = availableLanguages.find(l => l.code === language) || availableLanguages[0];

  const GetNotes = async () => {
    try {
      // First, fetch the course to get chapter information
      const courseResult = await axios.get("/api/courses", {
        params: { courseId: courseId },
      });

      let courseLayout = null;
      if (courseResult.data.course && Array.isArray(courseResult.data.course) && courseResult.data.course.length > 0) {
        const courseData = courseResult.data.course[0];
        courseLayout = typeof courseData.courseLayout === "string" 
          ? JSON.parse(courseData.courseLayout) 
          : courseData.courseLayout;
      }

      // Fetch notes from database
      const result = await axios.post<NotesResponse[]>("/api/study-type", {
        courseId: courseId,
        studyType: "notes",
      });
      console.log("API Response:", result.data);

      if (!result.data || result.data.length === 0) {
        setNotesData([]);
        setLoading(false);
        return;
      }

      // Parse notes and map to chapters
      const parsedNotes = result.data
        .map((chapterNote) => {
          try {
            // Parse the notes JSON string
            let notesString = chapterNote.notes;
            
            // Handle double-escaped JSON from database
            if (typeof notesString === 'string') {
              // Remove surrounding quotes if present (handles both "..." and """...""")
              notesString = notesString.trim();
              if (notesString.startsWith('"') && notesString.endsWith('"')) {
                notesString = notesString.slice(1, -1);
              }
              
              // Replace double-escaped quotes ("" -> ")
              // This handles PostgreSQL's text escaping where " becomes ""
              notesString = notesString.replace(/""/g, '"');
              
              // Also handle standard JSON escape sequences
              notesString = notesString.replace(/\\"/g, '"');
            }
            
            let parsedNotesObj;
            try {
              // Try parsing the JSON string
              parsedNotesObj = typeof notesString === 'string' ? JSON.parse(notesString) : notesString;
            } catch (parseError) {
              // If parsing fails, try to fix common issues
              console.warn('Failed to parse notes JSON, attempting to fix:', parseError);
              
              // Try to extract JSON-like structure manually using a more robust regex
              try {
                // Look for html_content pattern - handle escaped quotes and newlines
                // Pattern: "html_content":"...content..." (content can have escaped quotes and newlines)
                const htmlContentMatch = notesString.match(/"html_content"\s*:\s*"((?:[^"\\]|\\.)*)"/);
                if (htmlContentMatch && htmlContentMatch[1]) {
                  let extractedContent = htmlContentMatch[1];
                  // Decode escape sequences
                  extractedContent = extractedContent
                    .replace(/\\n/g, '\n')
                    .replace(/\\r/g, '\r')
                    .replace(/\\t/g, '\t')
                    .replace(/\\"/g, '"')
                    .replace(/\\'/g, "'")
                    .replace(/\\\\/g, '\\');
                  
                  parsedNotesObj = {
                    notes: {
                      html_content: extractedContent
                    }
                  };
                } else {
                  // Fallback: try to find any content between quotes after html_content
                  const fallbackMatch = notesString.match(/html_content["\s]*:["\s]*"([\s\S]*?)"(?:\s*[,}])/);
                  if (fallbackMatch && fallbackMatch[1]) {
                    parsedNotesObj = {
                      notes: {
                        html_content: fallbackMatch[1]
                          .replace(/\\n/g, '\n')
                          .replace(/\\r/g, '\r')
                          .replace(/\\t/g, '\t')
                          .replace(/\\"/g, '"')
                          .replace(/\\'/g, "'")
                          .replace(/\\\\/g, '\\')
                      }
                    };
                  } else {
                    // Last fallback: treat entire string as HTML content
                    parsedNotesObj = { notes: { html_content: notesString } };
                  }
                }
              } catch (e) {
                // Last resort: use string as-is
                parsedNotesObj = { notes: { html_content: notesString } };
              }
            }
            
            // Extract html_content from the parsed object
            // Structure can be: {"notes":{"html_content":"..."}} or {"html_content":"..."}
            let htmlContent = "";
            if (parsedNotesObj?.notes?.html_content) {
              htmlContent = parsedNotesObj.notes.html_content;
            } else if (parsedNotesObj?.html_content) {
              htmlContent = parsedNotesObj.html_content;
            } else if (Array.isArray(parsedNotesObj) && parsedNotesObj[0]?.notes?.html_content) {
              htmlContent = parsedNotesObj[0].notes.html_content;
            } else if (typeof parsedNotesObj === "string") {
              htmlContent = parsedNotesObj;
            } else {
              // Fallback: stringify the object
              htmlContent = JSON.stringify(parsedNotesObj);
            }
            
            // Decode HTML escape sequences in the content
            // Replace \n with actual newlines, handle other escape sequences
            htmlContent = htmlContent
              .replace(/\\n/g, '\n')
              .replace(/\\r/g, '\r')
              .replace(/\\t/g, '\t')
              .replace(/\\"/g, '"')
              .replace(/\\'/g, "'")
              .replace(/\\\\/g, '\\');
            
            // Validate that we have content
            if (!htmlContent || htmlContent.trim().length === 0) {
              console.warn(`Empty content for chapter ${chapterNote.chapterId}`);
              return null;
            }

            // Get chapter info from courseLayout using chapterId
            const chapterId = chapterNote.chapterId;
            // Try to match chapterId with chapter_number (handle both 0-indexed and 1-indexed)
            const chapterInfo = courseLayout?.chapters?.find(
              (ch: any) => ch.chapter_number === chapterId || ch.chapter_number === chapterId + 1
            ) || courseLayout?.chapters?.[chapterId]; // Fallback to array index

            // Create ChapterNotes object
            const chapterNotes: ChapterNotes = {
              chapter_number: chapterInfo?.chapter_number ?? chapterId,
              chapter_title: chapterInfo?.chapter_title || `Chapter ${chapterId}`,
              chapter_summary: chapterInfo?.chapter_summary || "",
              topics: chapterInfo?.topics || [],
              notes: {
                html_content: htmlContent,
              },
            };

            return chapterNotes;
          } catch (e) {
            console.error("Error parsing notes for chapter:", chapterNote.id, e, chapterNote.notes);
            return null;
          }
        })
        .filter((note): note is ChapterNotes => note !== null)
        .sort((a, b) => a.chapter_number - b.chapter_number);

      setOriginalNotesData(parsedNotes);
      setNotesData(parsedNotes);
    } catch (error) {
      console.error("Error fetching notes:", error);
      setNotesData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    GetNotes();
    toast(
      "Please keep refreshing the page to see the changes while content is generating"
    );
  }, []);

  // Translate notes when language changes
  useEffect(() => {
    if (originalNotesData.length > 0) {
      translateNotes();
    }
  }, [language, originalNotesData]);

  const translateNotes = async () => {
    console.log("🎯 [Notes] translateNotes called:", {
      language,
      languageName: currentLanguage?.name,
      notesCount: originalNotesData.length,
    });

    if (language === "en") {
      console.log("⏭️ [Notes] Language is English, using original notes");
      setNotesData(originalNotesData);
      return;
    }

    console.log("🚀 [Notes] Starting translation process");
    setTranslating(true);
    setTranslationProgress(0);

    try {
      const translated = await translateArray(
        originalNotesData,
        language,
        (progress) => {
          console.log(`📊 [Notes] Translation progress: ${progress}%`);
          setTranslationProgress(progress);
        }
      );
      console.log("✅ [Notes] Translation successful");
      setNotesData(translated);
    } catch (error) {
      console.error("❌ [Notes] Translation error:", error);
      toast.error("Translation failed. Showing original content.");
      setNotesData(originalNotesData);
    } finally {
      console.log("🏁 [Notes] Translation finished");
      setTranslating(false);
      setTranslationProgress(0);
    }
  };

  const handlePrevNote = () => {
    if (currentNoteIndex > 0 && notesData.length > 0) {
      setCurrentNoteIndex(currentNoteIndex - 1);
    }
  };

  const handleNextNote = () => {
    if (notesData.length > 0 && currentNoteIndex < notesData.length - 1) {
      setCurrentNoteIndex(currentNoteIndex + 1);
    }
  };

  const decodeHtmlContent = (content: string) => {
    if (!content) return "";
    
    // Content should already be decoded, but handle any remaining escape sequences
    return content
      .replace(/\\n/g, "\n")
      .replace(/\\r/g, "\r")
      .replace(/\\t/g, "\t")
      .replace(/\\'/g, "'")
      .replace(/\\"/g, '"')
      .replace(/\\&/g, "&")
      .replace(/\\</g, "<")
      .replace(/\\>/g, ">")
      .replace(/\\;/g, ";")
      .replace(/\\\\/g, "\\");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-full max-w-3xl p-8">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4 mb-2" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    );
  }

  if (notesData.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-xl shadow-md">
          <p className="text-xl text-gray-600 dark:text-gray-300">
            No notes available for this course.
          </p>
        </div>
      </div>
    );
  }

  const currentNote = notesData[currentNoteIndex];

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Translation Progress */}
      {translating && (
        <div className="mb-6">
          <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
            <p className="text-center text-sm text-blue-700 dark:text-blue-300 mb-2">
              Translating notes to {currentLanguage.flag} {currentLanguage.name}... {translationProgress}%
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

      {/* Header Section */}
      <div className="flex items-center justify-between mb-8">
        <Link
          href={`/course/${courseId}`}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 hover:underline"
        >
          <span className="text-lg">←</span> Back to Course
        </Link>
      </div>

      <div className="flex flex-col items-center gap-6 mb-8">
        <div className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 flex items-center justify-between">
          <button
            onClick={handlePrevNote}
            disabled={currentNoteIndex === 0}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all duration-200 transform hover:scale-105
            ${
              currentNoteIndex === 0
                ? "bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700 shadow-md"
            }`}
          >
            <span className="text-lg">←</span> Previous
          </button>

          <div className="flex flex-col items-center">
            <span className="text-lg font-bold text-gray-700 dark:text-gray-200">
              Chapter {currentNote.chapter_number}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              of {notesData[notesData.length - 1].chapter_number} chapters
            </span>
          </div>

          <button
            onClick={handleNextNote}
            disabled={currentNoteIndex === notesData.length - 1}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all duration-200 transform hover:scale-105
            ${
              currentNoteIndex === notesData.length - 1
                ? "bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700 shadow-md"
            }`}
          >
            Next <span className="text-lg">→</span>
          </button>
        </div>

        <div className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 transition-all duration-300 hover:shadow-xl">
          <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-100 border-b dark:border-gray-700 pb-4">
            {currentNote.chapter_title}
          </h1>
          <div
            className="prose prose-lg max-w-none dark:prose-invert prose-headings:text-gray-800 dark:prose-headings:text-gray-100 prose-p:text-gray-600 dark:prose-p:text-gray-300 prose-a:text-blue-600 dark:prose-a:text-blue-400"
            dangerouslySetInnerHTML={{
              __html: decodeHtmlContent(currentNote.notes.html_content),
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default ViewNotes;
