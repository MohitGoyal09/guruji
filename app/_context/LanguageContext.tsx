"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { t, loadLocale } from "@/lib/i18n/translations";
import { Locale } from "@/lib/i18n/config";

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  availableLanguages: Array<{code: string, name: string, flag: string}>;
}

const LANGUAGES = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "pt", name: "Português", flag: "🇵🇹" },
  { code: "zh", name: "中文", flag: "🇨🇳" },
  { code: "ja", name: "日本語", flag: "🇯🇵" },
  { code: "ar", name: "العربية", flag: "🇸🇦" },
  { code: "hi", name: "हिन्दी", flag: "🇮🇳" },
];

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<string>("en");
  const [localeLoaded, setLocaleLoaded] = useState(false);
  
  useEffect(() => {
    const saved = localStorage.getItem("preferred_language");
    if (saved && LANGUAGES.some(l => l.code === saved)) {
      console.log("📂 [LanguageContext] Restoring saved language:", saved);
      setLanguage(saved);
    }
    setLocaleLoaded(true); // We don't need locale files for real-time translation
  }, []);
  
  const handleSetLanguage = async (lang: string) => {
    console.log("🌍 [LanguageContext] Language change requested:", {
      from: language,
      to: lang,
      langName: LANGUAGES.find(l => l.code === lang)?.name,
      isValid: LANGUAGES.some(l => l.code === lang),
    });

    if (!LANGUAGES.some(l => l.code === lang)) {
      console.error("❌ [LanguageContext] Invalid language code:", lang);
      return;
    }

    console.log("✅ [LanguageContext] Setting language:", lang);
    setLanguage(lang);
    localStorage.setItem("preferred_language", lang);

    // Note: We don't load static locale files because we use real-time translation via API
    setLocaleLoaded(true);
    console.log("🎉 [LanguageContext] Language change complete");
  };
  
  const translate = (key: string, params?: Record<string, string | number>) => {
    if (!localeLoaded) return key; // Return key while loading
    return t(key, language as Locale, params);
  };

  return (
    <LanguageContext.Provider value={{ 
      language, 
      setLanguage: handleSetLanguage,
      t: translate,
      availableLanguages: LANGUAGES 
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
};

