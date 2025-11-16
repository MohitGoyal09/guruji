'use client';

import { useContext } from 'react';
import { LanguageContext } from '@/app/_context/LanguageContext';
import { getNestedTranslation } from './translations';

export function useTranslation() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }

  const { translations, language, setLanguage } = context;

  const t = (key: string, params?: Record<string, string | number>): string => {
    return getNestedTranslation(translations, key, params);
  };

  return {
    t,
    language,
    setLanguage,
    translations,
  };
}
