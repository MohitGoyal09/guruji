export const i18nConfig = {
  locales: ['en', 'es', 'fr', 'de', 'pt', 'zh', 'ja', 'ar', 'hi'],
  defaultLocale: 'en',
  localeNames: {
    en: 'English',
    es: 'Español',
    fr: 'Français',
    de: 'Deutsch',
    pt: 'Português',
    zh: '中文',
    ja: '日本語',
    ar: 'العربية',
    hi: 'हिन्दी',
  },
} as const;

export type Locale = (typeof i18nConfig.locales)[number];
