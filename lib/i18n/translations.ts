import en from '../../locales/en.json';

type TranslationKeys = typeof en;
type Locale = 'en' | 'es' | 'fr' | 'de' | 'hi' | 'zh' | 'pt' | 'ja' | 'ar';

// Lazy load translations
const translations: Record<Locale, TranslationKeys> = {
  en,
  es: en, // Will be populated dynamically or by Lingo.dev CLI
  fr: en, // Will be populated dynamically or by Lingo.dev CLI
  de: en, // Will be populated dynamically or by Lingo.dev CLI
  hi: en, // Will be populated dynamically or by Lingo.dev CLI
  zh: en, // Will be populated dynamically or by Lingo.dev CLI
  pt: en, // Portuguese
  ja: en, // Japanese
  ar: en, // Arabic
};

// Function to get nested translation value
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

// Export function for useTranslation hook
export function getNestedTranslation(
  translations: any,
  key: string,
  params?: Record<string, string | number>
): string {
  const translation = getNestedValue(translations, key);
  
  // Replace parameters like {count} with actual values
  if (params) {
    return translation.replace(/\{(\w+)\}/g, (match, paramKey) => {
      return params[paramKey]?.toString() || match;
    });
  }
  
  return translation;
}

export function t(key: string, locale: Locale = 'en', params?: Record<string, string | number>): string {
  const translation = getNestedValue(translations[locale] || translations.en, key);
  
  // Replace parameters like {count} with actual values
  if (params) {
    return translation.replace(/\{(\w+)\}/g, (match, paramKey) => {
      return params[paramKey]?.toString() || match;
    });
  }
  
  return translation;
}

// Load locale files dynamically (for client-side)
export async function loadLocale(locale: Locale): Promise<void> {
  console.log("📖 [Translations] loadLocale called for:", locale);

  if (locale === 'en') {
    console.log("⏭️ [Translations] English already loaded");
    return; // Already loaded
  }

  try {
    console.log(`📥 [Translations] Attempting to load: locales/${locale}.json`);
    const module = await import(`../../locales/${locale}.json`);
    translations[locale] = module.default;
    console.log(`✅ [Translations] Successfully loaded locale: ${locale}`);
  } catch (error: any) {
    console.warn(`⚠️ [Translations] Failed to load locale ${locale}, falling back to English:`, error?.message);
    translations[locale] = translations.en;
  }
}

