import React, { createContext, useContext, useState, useEffect } from "react";
import { secureStorage } from "../utils/secureStorage";
import { TranslationService } from "../services/translationService";

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
  translate: (text: string) => Promise<string>;
  isDownloading: boolean;
}

const TranslationContext = createContext<TranslationContextProps>({} as TranslationContextProps);

export const TranslationProvider = ({ children }: { children: React.ReactNode }) => {
  const [targetLanguage, setTargetLanguage] = useState("en");
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const loadLanguage = async () => {
      const savedLang = await secureStorage.getItem("preferred_language");
      if (savedLang) {
        setTargetLanguage(savedLang);
        // Pre-download model
        TranslationService.downloadModel(savedLang);
      }
    };
    loadLanguage();
  }, []);

  const setLanguage = async (lang: string) => {
    setIsDownloading(true);
    setTargetLanguage(lang);
    await secureStorage.setItem("preferred_language", lang);
    
    // Trigger model download
    await TranslationService.downloadModel(lang);
    setIsDownloading(false);
  };

  const translate = async (text: string): Promise<string> => {
    if (!text || text.trim().length === 0) return "";
    
    try {
      // 1. Identify source language
      const sourceLang = await TranslationService.identifyLanguage(text);
      
      // 2. Translate to target
      return await TranslationService.translateText(text, sourceLang, targetLanguage);
    } catch (error) {
      console.error("Translation logic error", error);
      return text;
    }
  };

  return (
    <TranslationContext.Provider value={{ targetLanguage, setLanguage, translate, isDownloading }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => useContext(TranslationContext);
