"use client";
import { createContext, useContext, useState, useEffect } from "react";

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
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
  const [language, setLanguage] = useState("en");
  
  useEffect(() => {
    const saved = localStorage.getItem("preferred_language");
    if (saved) setLanguage(saved);
  }, []);
  
  const handleSetLanguage = (lang: string) => {
    setLanguage(lang);
    localStorage.setItem("preferred_language", lang);
  };
  
  return (
    <LanguageContext.Provider value={{ 
      language, 
      setLanguage: handleSetLanguage,
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

