import { SupportedLanguage, LanguageOption, TranslationSchema } from "./types";
import { en } from "./en";
import { ta } from "./ta";
import { hi } from "./hi";
import { te } from "./te";
import { ml } from "./ml";
import { kn } from "./kn";
import { bn } from "./bn";
import { mr } from "./mr";

export * from "./types";

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "en", name: "English", nativeName: "English", script: "Latin" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", script: "Tamil" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", script: "Devanagari" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", script: "Telugu" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം", script: "Malayalam" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", script: "Kannada" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", script: "Bengali" },
  { code: "mr", name: "Marathi", nativeName: "मराठी", script: "Devanagari" },
];

export const translations: Record<SupportedLanguage, TranslationSchema> = {
  en,
  ta,
  hi,
  te,
  ml,
  kn,
  bn,
  mr,
};

/**
 * Resolves a dot-notation key (e.g. 'safety.safeTitle') in the given language.
 * Falls back to English if the key is missing in the chosen language.
 * Returns the provided fallback or the key itself if not found in English.
 */
export function getNestedTranslation(
  lang: SupportedLanguage,
  key: string,
  fallback?: string
): string {
  const getFromObj = (obj: any, path: string): string | undefined => {
    const parts = path.split(".");
    let curr = obj;
    for (const part of parts) {
      if (curr === undefined || curr === null) return undefined;
      curr = curr[part];
    }
    return typeof curr === "string" ? curr : undefined;
  };

  // 1. Try selected language
  const targetObj = translations[lang] || translations.en;
  const val = getFromObj(targetObj, key);
  if (val !== undefined) return val;

  // 2. Fall back to English
  if (lang !== "en") {
    const enVal = getFromObj(translations.en, key);
    if (enVal !== undefined) return enVal;
  }

  // 3. Fallback or key
  return fallback !== undefined ? fallback : key;
}

const REASON_ALIASES: Record<string, string> = {
  IMMINENT_COLLISION: "COLLISION_IMMINENT",
  TTC_CRITICAL: "CRITICAL_TTC",
  CORRIDOR_BLOCKED: "BLOCKED_CORRIDOR",
  FOG_LOCK_DENIED: "FOG_LOCK_CONFLICT",
  RADAR_FAULT: "SENSOR_DEGRADATION",
  COMMUNICATION_LOST: "COMMUNICATION_DEGRADATION",
};

/**
 * Translates reason codes dynamically across all 8 languages.
 */
export function translateReason(lang: SupportedLanguage, reasonCode?: string): string {
  if (!reasonCode) return "";
  const normalized = REASON_ALIASES[reasonCode] || reasonCode;
  const key = `reasons.${normalized}`;
  return getNestedTranslation(lang, key, reasonCode);
}
