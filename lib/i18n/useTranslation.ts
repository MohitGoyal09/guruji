'use client';

import { useContext } from 'react';
import { LanguageContext } from '@/app/_context/LanguageContext';

export function useTranslation() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }

  const { t, language, setLanguage, availableLanguages } = context;

  return {
    t,
    language,
    setLanguage,
    availableLanguages,
  };
}
