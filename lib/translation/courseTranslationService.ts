import { translateText, translateObject } from '../i18n/translationService';

type Locale = 'en' | 'es' | 'fr' | 'de' | 'pt' | 'zh' | 'ja' | 'ar' | 'hi';

export interface CourseTranslation {
  locale: Locale;
  title: string;
  description: string;
  chapters: Array<{
    chapter_number: number;
    chapter_title: string;
    topics: string[];
  }>;
}

export interface CourseData {
  course_title: string;
  course_description: string;
  chapters: Array<{
    chapter_number: number;
    chapter_title: string;
    topics: string[];
  }>;
}

/**
 * Translate a single course to a target language
 */
export async function translateCourse(
  courseData: CourseData,
  targetLocale: Locale
): Promise<CourseTranslation> {
  if (targetLocale === 'en') {
    return {
      locale: 'en',
      title: courseData.course_title,
      description: courseData.course_description,
      chapters: courseData.chapters,
    };
  }

  // Translate title and description
  const [translatedTitle, translatedDescription] = await Promise.all([
    translateText(courseData.course_title, targetLocale),
    translateText(courseData.course_description, targetLocale),
  ]);

  // Translate all chapters
  const translatedChapters = await Promise.all(
    courseData.chapters.map(async (chapter) => {
      const [translatedChapterTitle, translatedTopics] = await Promise.all([
        translateText(chapter.chapter_title, targetLocale),
        Promise.all(chapter.topics.map((topic) => translateText(topic, targetLocale))),
      ]);

      return {
        chapter_number: chapter.chapter_number,
        chapter_title: translatedChapterTitle,
        topics: translatedTopics,
      };
    })
  );

  return {
    locale: targetLocale,
    title: translatedTitle,
    description: translatedDescription,
    chapters: translatedChapters,
  };
}

/**
 * Translate course to all supported languages
 */
export async function translateCourseToAllLanguages(
  courseData: CourseData,
  onProgress?: (locale: Locale, progress: number) => void
): Promise<Record<Locale, CourseTranslation>> {
  const locales: Locale[] = ['en', 'es', 'fr', 'de', 'pt', 'zh', 'ja', 'ar', 'hi'];
  const translations: Record<string, CourseTranslation> = {};

  let completed = 0;
  const total = locales.length;

  // Translate to all languages in parallel (can be throttled if needed)
  const translationPromises = locales.map(async (locale) => {
    const translation = await translateCourse(courseData, locale);
    translations[locale] = translation;
    completed++;
    if (onProgress) {
      onProgress(locale, Math.round((completed / total) * 100));
    }
    return translation;
  });

  await Promise.all(translationPromises);

  return translations as Record<Locale, CourseTranslation>;
}

/**
 * Get translated course data for a specific locale
 */
export function getTranslatedCourse(
  translations: Record<Locale, CourseTranslation> | null,
  locale: Locale,
  fallbackData: CourseData
): CourseData {
  if (!translations || !translations[locale]) {
    return fallbackData;
  }

  const translation = translations[locale];
  return {
    course_title: translation.title,
    course_description: translation.description,
    chapters: translation.chapters,
  };
}

// Export translateText for use in other translation services
export { translateText };
