"use client";
import { useParams } from "next/navigation";
import FlashCardflip from "@/components/Course/FlashCardflip";
import axios from "axios";
import { toast } from "sonner";
import React, { useEffect, useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useLanguage } from "@/app/_context/LanguageContext";
import { translateArray } from "@/lib/translation/lingoTranslation";

interface Flashcard {
  front: string;
  back: string;
}
interface ApiResponse {
  id: number;
  courseId: string;
  content: {
    [key: string]: any[];
  };
  type: string;
  status: string;
}

export default function Flashcards() {
  const { courseId } = useParams();
  const { language, availableLanguages } = useLanguage();
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [originalFlashcards, setOriginalFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [translating, setTranslating] = useState(false);
  const [translationProgress, setTranslationProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [currentFlashcard, setCurrentFlashcard] = useState(0);

  const currentLanguage = availableLanguages.find(l => l.code === language) || availableLanguages[0];

  useEffect(() => {
    GetFlashcards();
    toast("Please keep refreshing the page to see the changes while content is generating")
  }, [courseId]);

  // Translate flashcards when language changes
  useEffect(() => {
    console.log("🔔 [Flashcards] Language change detected:", {
      language,
      currentLanguage: currentLanguage?.name,
      hasFlashcards: originalFlashcards.length > 0,
      flashcardCount: originalFlashcards.length,
    });

    if (originalFlashcards.length > 0) {
      console.log("▶️ [Flashcards] Triggering translation");
      translateFlashcards();
    } else {
      console.log("⏸️ [Flashcards] No flashcards to translate yet");
    }
  }, [language, originalFlashcards]);

  const translateFlashcards = async () => {
    console.log("🎯 [Flashcards] translateFlashcards called:", {
      language,
      languageName: currentLanguage?.name,
      flashcardCount: originalFlashcards.length,
    });

    if (language === "en") {
      console.log("⏭️ [Flashcards] Language is English, using original flashcards");
      setFlashcards(originalFlashcards);
      return;
    }

    console.log("🚀 [Flashcards] Starting translation process");
    setTranslating(true);
    setTranslationProgress(0);

    try {
      const translated = await translateArray(
        originalFlashcards,
        language,
        (progress) => {
          console.log(`📊 [Flashcards] Translation progress: ${progress}%`);
          setTranslationProgress(progress);
        }
      );
      console.log("✅ [Flashcards] Translation successful, updating state");
      setFlashcards(translated);
    } catch (error) {
      console.error("❌ [Flashcards] Translation error:", error);
      toast.error("Translation failed. Showing original content.");
      setFlashcards(originalFlashcards);
    } finally {
      console.log("🏁 [Flashcards] Translation process finished");
      setTranslating(false);
      setTranslationProgress(0);
    }
  };
  const GetFlashcards = async () => {
    setLoading(true);
    try {
      const result = await axios.post("/api/study-type", {
        courseId: courseId,
        studyType: "flashcards",
      });
      const data = result.data as ApiResponse;
      const flashcardsKey = Object.keys(data.content)[0];
      const flashcardsData = data.content[flashcardsKey];
      if (Array.isArray(flashcardsData)) {
        const validFlashcards = flashcardsData.filter(
          (fc) =>
            typeof fc === "object" &&
            fc !== null &&
            "front" in fc &&
            "back" in fc
        );
        setOriginalFlashcards(validFlashcards as Flashcard[]);
        setFlashcards(validFlashcards as Flashcard[]);
      } else {
        setError("Invalid flashcards data received from API.");
      }
    } catch (error) {
      console.error("Error fetching flashcards:", error);
      setError("Error fetching flashcards.");
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-4">
      <Link
        href={`/course/${courseId}`}
        className="flex items-center px-3 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:opacity-90 transition-all duration-200 shadow-md hover:translate-x-[-4px] md:px-4 md:text-base self-start"
      >
        <ChevronLeft className="w-4 h-4 mr-1 md:mr-2" />
        <span className="hidden sm:inline">Back to Course</span>
        <span className="sm:hidden">Back</span>
      </Link>
      <div className="text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-linear-to-r from-primary to-primary/70">
        Flashcards
        </h2>
        <p className="text-gray-600 text-lg md:text-xl font-medium">
        The Ultimate Tool to Lock in Concepts!
        </p>
      </div>
      <div className="hidden md:block w-[100px]"></div>
      </div>

      {translating && (
        <div className="max-w-2xl mx-auto mb-6">
          <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
            <p className="text-center text-sm text-blue-700 dark:text-blue-300 mb-2">
              Translating to {currentLanguage.flag} {currentLanguage.name}... {translationProgress}%
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

      {loading ? (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent"></div>
      </div>
      ) : error ? (
      <div className="text-red-500 text-center p-6 bg-red-50 rounded-xl shadow-lg max-w-2xl mx-auto">
        {error}
      </div>
      ) : (
      <div className="max-w-4xl mx-auto">
        <Carousel
        className="w-full"
        opts={{
          startIndex: currentFlashcard
        }}
        >
        <CarouselContent>
          {flashcards.map((flashcard, index) => (
          <CarouselItem key={index} className="flex justify-center p-4">
            {typeof flashcard === "object" &&
            flashcard !== null &&
            "front" in flashcard &&
            "back" in flashcard ? (
            <FlashCardflip flashcard={flashcard} />
            ) : (
            <div className="text-red-500 p-6 bg-red-50 rounded-xl shadow-lg">
              Invalid flashcard data.
            </div>
            )}
          </CarouselItem>
          ))}
        </CarouselContent>
        <div className="flex justify-center gap-8 mt-10">
          <CarouselPrevious className="relative hover:scale-110 transition-transform duration-200 shadow-md" />
          <CarouselNext className="relative hover:scale-110 transition-transform duration-200 shadow-md" />
        </div>
        </Carousel>
      </div>
      )}
    </div>
  );
}
