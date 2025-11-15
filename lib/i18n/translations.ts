import en from '../../locales/en.json';

type TranslationKeys = typeof en;
type Locale = 'en' | 'es' | 'fr' | 'de' | 'hi' | 'zh';

// Lazy load translations
const translations: Record<Locale, TranslationKeys> = {
  en,
  es: en, // Will be populated by Lingo.dev CLI
  fr: en, // Will be populated by Lingo.dev CLI
  de: en, // Will be populated by Lingo.dev CLI
  hi: en, // Will be populated by Lingo.dev CLI
  zh: en, // Will be populated by Lingo.dev CLI
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
  if (locale === 'en') return; // Already loaded
  
  try {
    const module = await import(`../../locales/${locale}.json`);
    translations[locale] = module.default;
  } catch (error) {
    console.warn(`Failed to load locale ${locale}, falling back to English`);
    translations[locale] = translations.en;
  }
}

