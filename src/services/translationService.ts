import FastTranslator, { Languages } from "fast-mlkit-translate-text";

/**
 * Robust detection for ML Kit native module.
 */
const getTranslator = () => {
  if (!FastTranslator) {
    console.log("FastTranslator import is null or undefined.");
    return null;
  }

  // Log keys for debugging
  console.log("FastTranslator keys:", Object.keys(FastTranslator));

  // 1. Direct check (for class or object with static methods)
  if (typeof (FastTranslator as any).identify === "function") {
    return FastTranslator;
  }

  // 2. Default wrap check (common in Metro/CommonJS interop)
  if ((FastTranslator as any).default && typeof (FastTranslator as any).default.identify === "function") {
    return (FastTranslator as any).default;
  }

  // 3. Last resort: check if it's the class itself being exported as a named export
  // (unlikely given the import statement, but good for robustness)
  const { FastTranslator: NamedTranslator } = require("fast-mlkit-translate-text");
  if (NamedTranslator && typeof NamedTranslator.identify === "function") {
    return NamedTranslator;
  }

  console.warn("FastTranslator found but 'identify' method is missing. Structure:", JSON.stringify(FastTranslator));
  return null;
};

const Translator = getTranslator();
const isMLKitAvailable = !!Translator;

export const TranslationService = {
  /**
   * Identifies the language of the provided text.
   * @returns ISO 639-1 tag (e.g., 'lv', 'en')
   */
  identifyLanguage: async (text: string): Promise<string> => {
    // If Translator is null, we are in Mock mode.
    if (!isMLKitAvailable || !Translator) {
      return "en"; // Default for mocking
    }
    try {
      // If we are in Expo Go, the library might throw a "linking error" inside its methods.
      // We catch it and return "en" to trigger our mock translation logic.
      return await Translator.identify(text);
    } catch (e) {
      console.warn("Native Translation methods threw error (likely Expo Go). Falling back to mock.");
      return "en";
    }
  },

  /**
   * Translates text to the target language.
   * @param sourceTag ISO 639-1 tag (e.g., 'lv')
   * @param targetTag ISO 639-1 tag (e.g., 'en')
   */
  translateText: async (text: string, sourceTag: string, targetTag: string): Promise<string> => {
    if (sourceTag === targetTag || !text) return text;

    // Use isMLKitAvailable check or a try-catch to trigger mock mode
    if (!isMLKitAvailable || !Translator) {
      console.log(`Mocking translation: [${sourceTag} -> ${targetTag}]`);
      return `[${targetTag.toUpperCase()}] ${text}`;
    }

    try {
      // Map ISO tags to full language names expected by the library
      const sourceLang = Translator.languageFromTag(sourceTag);
      const targetLang = Translator.languageFromTag(targetTag);

      if (!sourceLang || !targetLang) {
        throw new Error(`Unsupported tags: source=${sourceTag}, target=${targetTag}`);
      }

      await Translator.prepare({
        source: sourceLang,
        target: targetLang,
        downloadIfNeeded: true,
      });

      return await Translator.translate(text);
    } catch (e) {
      console.log(`Native translation failed, using mock. Error: ${e}`);
      return `[${targetTag.toUpperCase()}] ${text}`;
    }
  },

  /**
   * Pre-downloads a language model.
   * @param langTag ISO 639-1 tag (e.g., 'lv')
   */
  downloadModel: async (langTag: string) => {
    if (!isMLKitAvailable || !Translator) return;
    try {
      const lang = Translator.languageFromTag(langTag);
      if (!lang) {
        console.warn(`Cannot download model for unsupported tag: ${langTag}`);
        return;
      }

      const isDownloaded = await Translator.isLanguageDownloaded(lang);
      if (!isDownloaded) {
        console.log(`Downloading ML Kit model for: ${lang}`);
        await Translator.downloadLanguageModel(lang);
      }
    } catch (e) {
      // Silent fail for models in development
      console.error(e);
    }
  },
  };

