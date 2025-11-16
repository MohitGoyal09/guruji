import { translateText } from '../i18n/translationService';

type Locale = 'en' | 'es' | 'fr' | 'de' | 'pt' | 'zh' | 'ja' | 'ar' | 'hi';

export interface FlashcardTranslation {
  locale: Locale;
  front: string;
  back: string;
}

export interface Flashcard {
  front: string;
  back: string;
}

/**
 * Translate a single flashcard to a target language
 */
export async function translateFlashcard(
  flashcard: Flashcard,
  targetLocale: Locale
): Promise<FlashcardTranslation> {
  if (targetLocale === 'en') {
    return {
      locale: 'en',
      front: flashcard.front,
      back: flashcard.back,
    };
  }

  // Translate front and back in parallel
  const [translatedFront, translatedBack] = await Promise.all([
    translateText(flashcard.front, targetLocale),
    translateText(flashcard.back, targetLocale),
  ]);

  return {
    locale: targetLocale,
    front: translatedFront,
    back: translatedBack,
  };
}

/**
 * Translate multiple flashcards to a target language
 */
export async function translateFlashcards(
  flashcards: Flashcard[],
  targetLocale: Locale
): Promise<FlashcardTranslation[]> {
  return Promise.all(
    flashcards.map((flashcard) => translateFlashcard(flashcard, targetLocale))
  );
}

/**
 * Translate flashcards to all supported languages
 */
export async function translateFlashcardsToAllLanguages(
  flashcards: Flashcard[],
  onProgress?: (locale: Locale, progress: number) => void
): Promise<Record<Locale, FlashcardTranslation[]>> {
  const locales: Locale[] = ['en', 'es', 'fr', 'de', 'pt', 'zh', 'ja', 'ar', 'hi'];
  const translations: Record<string, FlashcardTranslation[]> = {};

  let completed = 0;
  const total = locales.length;

  // Translate to all languages in parallel
  const translationPromises = locales.map(async (locale) => {
    const translation = await translateFlashcards(flashcards, locale);
    translations[locale] = translation;
    completed++;
    if (onProgress) {
      onProgress(locale, Math.round((completed / total) * 100));
    }
    return translation;
  });

  await Promise.all(translationPromises);

  return translations as Record<Locale, FlashcardTranslation[]>;
}

/**
 * Get translated flashcards for a specific locale
 */
export function getTranslatedFlashcards(
  translations: Record<Locale, FlashcardTranslation[]> | null,
  locale: Locale,
  fallbackFlashcards: Flashcard[]
): Flashcard[] {
  if (!translations || !translations[locale]) {
    return fallbackFlashcards;
  }

  return translations[locale].map((translation) => ({
    front: translation.front,
    back: translation.back,
  }));
}
