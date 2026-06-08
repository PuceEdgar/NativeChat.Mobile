import React, { createContext, useContext, useEffect, useState } from "react";
import { TranslationService } from "../services/translationService";
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
  inputLanguage: string;
  setInputLanguage: (lang: string) => void;
  translate: (text: string, sourceOverride?: string) => Promise<string>;
  translateToBridge: (text: string) => Promise<string>;
  isDownloading: boolean;
  isLanguageAlreadyDownloaded: boolean;
  downloadSelectedLanguage: (lang: string) => Promise<void>;
}

const TranslationContext = createContext<TranslationContextProps>({} as TranslationContextProps);

export const TranslationProvider = ({ children }: { children: React.ReactNode }) => {
  const [targetLanguage, setTargetLanguage] = useState("en");
  const [inputLanguage, setInputLanguage] = useState("en");
  const [isDownloading, setIsDownloading] = useState(false);
  const [isLanguageAlreadyDownloaded, setIsLanguageAlreadyDownloaded] = useState(false);

  useEffect(() => {
    const loadLanguage = async () => {
      const savedLang = await secureStorage.getItem("preferred_language");
      if (savedLang) {
        setTargetLanguage(savedLang);
        // Pre-download model
        TranslationService.downloadModel(savedLang, setIsLanguageAlreadyDownloaded);
      }

      const savedInputLang = await secureStorage.getItem("input_language");
      if (savedInputLang) {
        setInputLanguage(savedInputLang);
      }
    };
    loadLanguage();
  }, []);

  const setLanguage = async (lang: string) => {
    //setIsDownloading(true);
    setTargetLanguage(lang);
    await secureStorage.setItem("preferred_language", lang);
    console.log(`set language was called!`);
    // Trigger model download
    // await TranslationService.downloadModel(
    //   lang,
    //   setIsLanguageAlreadyDownloaded,
    // );
    //setIsDownloading(false);
    const isDownloaded = await TranslationService.isLanguageDownloaded(lang);
    setIsLanguageAlreadyDownloaded(isDownloaded);
  };

  const downloadSelectedLanguage = async (lang: string) => {
    setIsDownloading(true);
    // Trigger model download
    await TranslationService.downloadModel(lang, setIsLanguageAlreadyDownloaded);
    setIsDownloading(false);
  };

  const setInputLang = async (lang: string) => {
    setInputLanguage(lang);
    await secureStorage.setItem("input_language", lang);

    // Download the model for input language too so identifying is faster/better
    await TranslationService.downloadModel(lang, setIsLanguageAlreadyDownloaded);
  };

  /**
   * Translates native input to English (The Bridge).
   * Used by the sender.
   */
  const translateToBridge = async (text: string): Promise<string> => {
    if (!text || inputLanguage === "en") return text;
    try {
      return await TranslationService.translateText(text, inputLanguage, "en");
    } catch (error) {
      console.error("Failed to translate to bridge", error);
      return text;
    }
  };

  const translate = async (text: string, sourceOverride?: string): Promise<string> => {
    if (!text || text.trim().length === 0) return "";

    try {
      // 1. Determine source language
      // If we have an override (from the sender), use it! No need to guess.
      let sourceLang = sourceOverride;

      if (!sourceLang) {
        sourceLang = await TranslationService.identifyLanguage(text);
      }

      // If language is undetermined or matches target, don't translate
      if (sourceLang === "und" || sourceLang === targetLanguage) {
        return text;
      }

      // 2. Translate to target
      return await TranslationService.translateText(text, sourceLang!, targetLanguage);
    } catch (error) {
      console.error("Translation logic error", error);
      return text;
    }
  };

  return (
    <TranslationContext.Provider
      value={{
        targetLanguage,
        setLanguage,
        inputLanguage,
        setInputLanguage: setInputLang,
        translate,
        translateToBridge,
        isDownloading,
        isLanguageAlreadyDownloaded,
        downloadSelectedLanguage,
      }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => useContext(TranslationContext);
