import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import {
  SupportedLanguage,
  LanguageOption,
  SUPPORTED_LANGUAGES,
  getNestedTranslation,
  translateReason,
} from "../locales";
import { SafetyState } from "../data/types";

interface SafetyDecisionPresentation {
  state: SafetyState;
  title: string;
  subtitle: string;
  action: string;
}

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  currentLanguageOption: LanguageOption;
  supportedLanguages: LanguageOption[];
  t: (key: string, fallback?: string) => string;
  getReasonText: (reasonCode?: string) => string;
  getSafetyDecisionText: (
    safetyState: SafetyState,
    role?: "driver" | "dashboard"
  ) => SafetyDecisionPresentation;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: React.ReactNode;
  storageKey?: string;
  defaultLanguage?: SupportedLanguage;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({
  children,
  storageKey = "fog_hemm_lang",
  defaultLanguage = "en",
}) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (
        stored &&
        SUPPORTED_LANGUAGES.some((opt) => opt.code === stored)
      ) {
        return stored as SupportedLanguage;
      }
    } catch {
      // localStorage may fail in restricted sandbox
    }
    return defaultLanguage;
  });

  const setLanguage = (newLang: SupportedLanguage) => {
    setLanguageState(newLang);
    try {
      localStorage.setItem(storageKey, newLang);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const currentLanguageOption = useMemo(() => {
    return (
      SUPPORTED_LANGUAGES.find((opt) => opt.code === language) ||
      SUPPORTED_LANGUAGES[0]
    );
  }, [language]);

  const t = useMemo(() => {
    return (key: string, fallback?: string): string => {
      return getNestedTranslation(language, key, fallback);
    };
  }, [language]);

  const getReasonText = useMemo(() => {
    return (reasonCode?: string): string => {
      return translateReason(language, reasonCode);
    };
  }, [language]);

  const getSafetyDecisionText = useMemo(() => {
    return (
      safetyState: SafetyState,
      role: "driver" | "dashboard" = "driver"
    ): SafetyDecisionPresentation => {
      switch (safetyState) {
        case "CRITICAL":
        case "EMERGENCY":
          return {
            state: safetyState,
            title: t("safety.criticalTitle", "CRITICAL — BRAKE NOW"),
            subtitle: t("safety.danger", "DANGER"),
            action:
              role === "driver"
                ? t("safety.brakeImmediately", "BRAKE IMMEDIATELY")
                : t("safety.brakingActive", "EMERGENCY BRAKING ACTIVE"),
          };
        case "WARNING":
          return {
            state: safetyState,
            title: t("safety.warningTitle", "WARNING — PREPARE TO STOP"),
            subtitle: t("safety.warning", "WARNING"),
            action: t("safety.reduceSpeed", "REDUCE SPEED"),
          };
        case "CAUTION":
          return {
            state: safetyState,
            title: t("safety.cautionTitle", "CAUTION — REDUCE SPEED"),
            subtitle: t("safety.caution", "CAUTION"),
            action: t("safety.reduceSpeed", "REDUCE SPEED"),
          };
        case "FAULT":
          return {
            state: safetyState,
            title: t("safety.faultTitle", "SYSTEM FAULT"),
            subtitle: t("safety.fault", "FAULT"),
            action: t("safety.restricted", "RESTRICTED"),
          };
        case "SAFE":
        default:
          return {
            state: safetyState,
            title: t("safety.safeTitle", "SAFE — PROCEED"),
            subtitle: t("safety.safe", "SAFE"),
            action: t("safety.proceed", "PROCEED"),
          };
      }
    };
  }, [language, t]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      currentLanguageOption,
      supportedLanguages: SUPPORTED_LANGUAGES,
      t,
      getReasonText,
      getSafetyDecisionText,
    }),
    [
      language,
      currentLanguageOption,
      t,
      getReasonText,
      getSafetyDecisionText,
    ]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useTranslation must be used within a LanguageProvider");
  }
  return context;
};
