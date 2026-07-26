import React, { createContext, useContext, useState, ReactNode } from "react";
import { translations, Language } from "../translations";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("app_language");
    return saved === "kn" || saved === "en" ? saved : "en";
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("app_language", lang);
  };

  const t = (key: string, fallback?: string): string => {
    // Nested key lookup with dot notation: "login.headline" → translations["en"]["login"]["headline"]
    const keys = key.split(".");
    let current: any = translations[language];
    
    for (const k of keys) {
      if (current && typeof current === "object" && k in current) {
        current = current[k];
      } else {
        // Fallback to English if missing in Kannada
        let enCurrent: any = translations["en"];
        for (const ek of keys) {
          if (enCurrent && typeof enCurrent === "object" && ek in enCurrent) {
            enCurrent = enCurrent[ek];
          } else {
            return fallback || key;
          }
        }
        return typeof enCurrent === "string" ? enCurrent : (fallback || key);
      }
    }
    
    return typeof current === "string" ? current : (fallback || key);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
