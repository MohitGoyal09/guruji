"use client";
import React, { useContext, useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { CourseCountContext } from "@/app/_context/CourseCountContext";
import { useLanguage } from "@/app/_context/LanguageContext";
import { translateText } from "@/lib/translation/lingoTranslation";

export default function WelcomeBanner() {
  const { user } = useUser();
  const { language } = useLanguage();
  const courseContext = useContext(CourseCountContext);
  const courseCount = courseContext?.courseCount;

  const [welcomeText, setWelcomeText] = useState(`Welcome, ${user?.firstName || 'Student'}!`);
  const [descriptionText, setDescriptionText] = useState(
    courseCount === 0
      ? "We're excited to have you here! Start your learning journey by exploring our diverse collection of courses. Your path to knowledge begins now! 🌟"
      : "Ready to continue your learning journey? You're doing great! Keep up the momentum and explore our latest courses."
  );

  useEffect(() => {
    const originalWelcome = `Welcome, ${user?.firstName || 'Student'}!`;
    const originalDescription = courseCount === 0
      ? "We're excited to have you here! Start your learning journey by exploring our diverse collection of courses. Your path to knowledge begins now! 🌟"
      : "Ready to continue your learning journey? You're doing great! Keep up the momentum and explore our latest courses.";

    if (language === "en") {
      setWelcomeText(originalWelcome);
      setDescriptionText(originalDescription);
    } else {
      // Translate both texts
      translateText(originalWelcome, language).then(setWelcomeText);
      translateText(originalDescription, language).then(setDescriptionText);
    }
  }, [language, user?.firstName, courseCount]);

  return (
    <div className="p-6 md:p-8 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 w-full text-white rounded-xl flex flex-col md:flex-row items-center gap-6 shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="flex items-center gap-6 w-full">
        <div className="flex flex-col gap-2 flex-1">
          <div className="flex items-center gap-3">
            <h1 className="font-bold text-2xl md:text-3xl text-white dark:text-white">
              {welcomeText} 🎉
            </h1>
          </div>
          <p className="text-white/80 dark:text-white/70 text-sm md:text-base max-w-2xl">
            {descriptionText}
          </p>
        </div>
      </div>
    </div>
  );
}
