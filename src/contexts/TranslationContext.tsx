import React, { createContext, useContext, useState, useEffect } from "react";
import { secureStorage } from "../utils/secureStorage";

export const SUPPORTED_LANGUAGES = [
  { label: "English", value: "en" },
  { label: "Spanish", value: "es" },
  { label: "French", value: "fr" },
  { label: "German", value: "de" },
  { label: "Italian", value: "it" },
  { label: "Portuguese", value: "pt" },
  { label: "Russian", value: "ru" },
  { label: "Chinese", value: "zh" },
  { label: "Japanese", value: "ja" },
  { label: "Korean", value: "ko" },
  { label: "Latvian", value: "lv" },
  { label: "Ukrainian", value: "uk" },
  { label: "Arabic", value: "ar" },
  { label: "Hindi", value: "hi" },
  { label: "Turkish", value: "tr" },
  { label: "Dutch", value: "nl" },
  { label: "Polish", value: "pl" },
  { label: "Swedish", value: "sv" },
  { label: "Danish", value: "da" },
  { label: "Finnish", value: "fi" },
  { label: "Norwegian", value: "no" },
  { label: "Greek", value: "el" },
  { label: "Czech", value: "cs" },
  { label: "Hungarian", value: "hu" },
  { label: "Romanian", value: "ro" },
  { label: "Thai", value: "th" },
  { label: "Vietnamese", value: "vi" },
  { label: "Indonesian", value: "id" },
];

interface TranslationContextProps {
  targetLanguage: string;
  setLanguage: (lang: string) => Promise<void>;
}

const TranslationContext = createContext<TranslationContextProps>({} as TranslationContextProps);

export const TranslationProvider = ({ children }: { children: React.ReactNode }) => {
  const [targetLanguage, setTargetLanguage] = useState("en");

  useEffect(() => {
    const loadLanguage = async () => {
      const savedLang = await secureStorage.getItem("preferred_language");
      if (savedLang) {
        setTargetLanguage(savedLang);
      }
    };
    loadLanguage();
  }, []);

  const setLanguage = async (lang: string) => {
    setTargetLanguage(lang);
    await secureStorage.setItem("preferred_language", lang);
    // Note: In the future, we could also sync this with the server's User profile
  };

  return (
    <TranslationContext.Provider value={{ targetLanguage, setLanguage }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => useContext(TranslationContext);
