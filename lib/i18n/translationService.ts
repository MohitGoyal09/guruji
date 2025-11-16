import OpenAI from 'openai';

type Locale = 'en' | 'es' | 'fr' | 'de' | 'pt' | 'zh' | 'ja' | 'ar' | 'hi';

const LANGUAGE_NAMES: Record<Locale, string> = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  pt: 'Portuguese',
  zh: 'Chinese',
  ja: 'Japanese',
  ar: 'Arabic',
  hi: 'Hindi',
};

// In-memory cache for translations
const translationCache = new Map<string, any>();

let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openai) {
    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not found. Please set OPENAI_API_KEY or NEXT_PUBLIC_OPENAI_API_KEY environment variable.');
    }
    openai = new OpenAI({ apiKey: apiKey, dangerouslyAllowBrowser: true });
  }
  return openai;
}

/**
 * Translate a single text string using OpenAI
 */
export async function translateText(text: string, targetLocale: Locale): Promise<string> {
  if (targetLocale === 'en') return text;

  const cacheKey = `${targetLocale}:${text}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey);
  }

  try {
    const client = getOpenAIClient();
    const targetLanguage = LANGUAGE_NAMES[targetLocale];

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a professional translator. Translate the provided text from English to ${targetLanguage}. Maintain the same tone and context. For educational content, use appropriate terminology for the target language. Return ONLY the translated text without any additional explanation or formatting.`,
        },
        {
          role: 'user',
          content: text,
        },
      ],
      temperature: 0.3,
    });

    const translated = completion.choices[0]?.message?.content?.trim() || text;
    translationCache.set(cacheKey, translated);
    return translated;
  } catch (error) {
    console.error(`Translation error for locale ${targetLocale}:`, error);
    return text; // Fallback to original text
  }
}

/**
 * Translate an entire object structure recursively
 */
export async function translateObject(obj: any, targetLocale: Locale): Promise<any> {
  if (targetLocale === 'en') return obj;

  const cacheKey = `obj:${targetLocale}:${JSON.stringify(obj)}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey);
  }

  const result: any = Array.isArray(obj) ? [] : {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = await translateText(value, targetLocale);
    } else if (typeof value === 'object' && value !== null) {
      result[key] = await translateObject(value, targetLocale);
    } else {
      result[key] = value;
    }
  }

  translationCache.set(cacheKey, result);
  return result;
}

/**
 * Get translation for a specific key path (e.g., "common.welcome")
 */
function getNestedValue(obj: any, path: string): string {
  const keys = path.split('.');
  let value = obj;
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return path; // Return key if not found
    }
  }
  return typeof value === 'string' ? value : path;
}

/**
 * Main translation function with parameter replacement
 */
export async function translate(
  sourceData: any,
  key: string,
  targetLocale: Locale,
  params?: Record<string, string | number>
): Promise<string> {
  if (targetLocale === 'en') {
    let translation = getNestedValue(sourceData, key);

    // Replace parameters like {count} with actual values
    if (params) {
      translation = translation.replace(/\{(\w+)\}/g, (match, paramKey) => {
        return params[paramKey]?.toString() || match;
      });
    }

    return translation;
  }

  const sourceText = getNestedValue(sourceData, key);

  // Replace parameters in source text first
  let textToTranslate = sourceText;
  const paramPlaceholders: Record<string, string> = {};

  if (params) {
    // Replace actual values with placeholders before translation
    Object.entries(params).forEach(([paramKey, paramValue], index) => {
      const placeholder = `__PARAM${index}__`;
      paramPlaceholders[placeholder] = paramValue.toString();
      textToTranslate = textToTranslate.replace(`{${paramKey}}`, placeholder);
    });
  }

  const translated = await translateText(textToTranslate, targetLocale);

  // Restore parameter values after translation
  let finalTranslation = translated;
  Object.entries(paramPlaceholders).forEach(([placeholder, value]) => {
    finalTranslation = finalTranslation.replace(placeholder, value);
  });

  return finalTranslation;
}

/**
 * Preload translations for an entire locale
 */
export async function preloadLocale(sourceData: any, targetLocale: Locale): Promise<any> {
  if (targetLocale === 'en') return sourceData;
  return translateObject(sourceData, targetLocale);
}

/**
 * Clear translation cache (useful for development)
 */
export function clearTranslationCache(): void {
  translationCache.clear();
}
