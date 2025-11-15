"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { t, loadLocale } from "@/lib/i18n/translations";

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  availableLanguages: Array<{code: string, name: string}>;
}

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "es", name: "Español" },
  { code: "fr", name: "Français" },
  { code: "de", name: "Deutsch" },
  { code: "hi", name: "हिन्दी" },
  { code: "zh", name: "中文" },
];

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<"en" | "es" | "fr" | "de" | "hi" | "zh">("en");
  const [localeLoaded, setLocaleLoaded] = useState(false);
  
  useEffect(() => {
    const saved = localStorage.getItem("preferred_language");
    if (saved && LANGUAGES.some(l => l.code === saved)) {
      setLanguage(saved as any);
      loadLocale(saved as any).then(() => setLocaleLoaded(true));
    } else {
      setLocaleLoaded(true);
    }
  }, []);
  
  const handleSetLanguage = async (lang: string) => {
    if (!LANGUAGES.some(l => l.code === lang)) return;
    
    setLanguage(lang as any);
    localStorage.setItem("preferred_language", lang);
    
    // Load locale file if not English
    if (lang !== 'en') {
      await loadLocale(lang as any);
    }
    setLocaleLoaded(true);
  };
  
  const translate = (key: string, params?: Record<string, string | number>) => {
    if (!localeLoaded) return key; // Return key while loading
    return t(key, language, params);
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

