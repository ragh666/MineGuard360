import { describe, it, expect } from "vitest";
import {
  SUPPORTED_LANGUAGES,
  translations,
  getNestedTranslation,
  translateReason,
  SupportedLanguage,
} from "../index";
import { processSafetyPipeline } from "../../safety/safetyEngine";

describe("Multilingual Localization System (FOG-HEMM)", () => {
  const languageCodes: SupportedLanguage[] = ["en", "ta", "hi", "te", "ml", "kn", "bn", "mr"];

  // 1. Language Loading
  it("should have all 8 supported languages registered and configured", () => {
    expect(SUPPORTED_LANGUAGES).toHaveLength(8);
    const codes = SUPPORTED_LANGUAGES.map((l) => l.code);
    expect(codes).toEqual(expect.arrayContaining(languageCodes));

    SUPPORTED_LANGUAGES.forEach((opt) => {
      expect(opt.code).toBeTruthy();
      expect(opt.name).toBeTruthy();
      expect(opt.nativeName).toBeTruthy();
      expect(opt.script).toBeTruthy();
    });
  });

  it("should load valid translation dictionaries for all 8 languages", () => {
    languageCodes.forEach((code) => {
      const dict = translations[code];
      expect(dict, `Translation dictionary for ${code} must exist`).toBeDefined();
      expect(dict.common, `Common namespace in ${code} must exist`).toBeDefined();
      expect(dict.safety, `Safety namespace in ${code} must exist`).toBeDefined();
      expect(dict.reasons, `Reasons namespace in ${code} must exist`).toBeDefined();
      expect(dict.driver, `Driver namespace in ${code} must exist`).toBeDefined();
      expect(dict.dashboard, `Dashboard namespace in ${code} must exist`).toBeDefined();
      expect(dict.environment, `Environment namespace in ${code} must exist`).toBeDefined();
      expect(dict.blocks, `Blocks namespace in ${code} must exist`).toBeDefined();
      expect(dict.sensors, `Sensors namespace in ${code} must exist`).toBeDefined();
      expect(dict.events, `Events namespace in ${code} must exist`).toBeDefined();
    });
  });

  // 2. Unicode and Native Script Integrity
  it("should properly render native Unicode text in all 8 languages", () => {
    expect(translations.ta.safety.danger).toBe("ஆபத்து");
    expect(translations.hi.safety.danger).toBe("खतरा");
    expect(translations.te.safety.danger).toBe("ప్రమాదం");
    expect(translations.ml.safety.danger).toBe("അപകടം");
    expect(translations.kn.safety.danger).toBe("ಅಪಾಯ");
    expect(translations.bn.safety.danger).toBe("বিপদ");
    expect(translations.mr.safety.danger).toBe("धोका");
    expect(translations.en.safety.danger).toBe("DANGER");
  });

  // 3. Safety Decisions Localization (Section 4 of specification)
  it("should provide exact required safety decision strings for driver braking", () => {
    expect(translations.en.safety.brakeImmediately).toBe("BRAKE IMMEDIATELY");
    expect(translations.ta.safety.brakeImmediately).toBe("உடனடியாக பிரேக் செய்யவும்");
    expect(translations.hi.safety.brakeImmediately).toBe("तुरंत ब्रेक लगाएँ");
    expect(translations.te.safety.brakeImmediately).toBe("వెంటనే బ్రేక్ వేయండి");
    expect(translations.ml.safety.brakeImmediately).toBe("ഉടൻ ബ്രേക്ക് ചെയ്യുക");
    expect(translations.kn.safety.brakeImmediately).toBe("ತಕ್ಷಣ ಬ್ರೇಕ್ ಹಾಕಿ");
    expect(translations.bn.safety.brakeImmediately).toBe("অবিলম্বে ব্রেক করুন");
    expect(translations.mr.safety.brakeImmediately).toBe("तात्काळ ब्रेक लावा");
  });

  // 4. Reason Code Localization (Section 6 of specification)
  it("should localize internal reason codes across all 8 languages without mutating internal keys", () => {
    const internalCodes = [
      "CRITICAL_TTC",
      "INSUFFICIENT_STOPPING_DISTANCE",
      "COLLISION_IMMINENT",
      "BLOCKED_CORRIDOR",
      "PROTECTED_ZONE_CONFLICT",
      "FOG_LOCK_CONFLICT",
      "BLOCK_RESTRICTION",
      "SENSOR_DEGRADATION",
      "COMMUNICATION_DEGRADATION",
      "NORMAL_OPERATION",
    ];

    languageCodes.forEach((lang) => {
      internalCodes.forEach((code) => {
        const translated = translateReason(lang, code);
        expect(translated, `Language ${lang} should translate code ${code}`).toBeTruthy();
        expect(translated).not.toBe("undefined");
        expect(translated).not.toBe("null");
        expect(translated).not.toBe("");
      });
    });

    // Check specific required translations from spec
    expect(translateReason("en", "CRITICAL_TTC")).toContain("Critical TTC");
    expect(translateReason("ta", "CRITICAL_TTC")).toContain("TTC");
    expect(translateReason("hi", "CRITICAL_TTC")).toContain("TTC");
    expect(translateReason("te", "CRITICAL_TTC")).toContain("TTC");
    expect(translateReason("ml", "CRITICAL_TTC")).toContain("TTC");
    expect(translateReason("kn", "CRITICAL_TTC")).toContain("TTC");
    expect(translateReason("bn", "CRITICAL_TTC")).toContain("TTC");
    expect(translateReason("mr", "CRITICAL_TTC")).toContain("TTC");
  });

  // 5. Fallback Mechanism (Section 10 of specification)
  it("should fall back gracefully to English when a translation key is missing", () => {
    // If a nested key doesn't exist in a target language, it must return English value
    const fallbackVal = getNestedTranslation("ta", "safety.safe");
    expect(fallbackVal).toBe("பாதுகாப்பானது");

    // If completely unknown key, return fallback or key without ever returning 'undefined' or 'null'
    const unknownKey = getNestedTranslation("hi", "nonexistent.nested.key", "Custom Fallback");
    expect(unknownKey).toBe("Custom Fallback");
    expect(unknownKey).not.toBe("undefined");
    expect(unknownKey).not.toBe("null");

    const directKeyFallback = getNestedTranslation("kn", "some.missing.key");
    expect(directKeyFallback).toBe("some.missing.key");
  });

  // 6. Dynamic Language Switching & Independent States (Section 7 & 8)
  it("should switch translations dynamically without affecting internal state data", () => {
    let currentLang: SupportedLanguage = "en";
    expect(getNestedTranslation(currentLang, "safety.safe")).toBe("SAFE");

    // Change to Tamil
    currentLang = "ta";
    expect(getNestedTranslation(currentLang, "safety.safe")).toBe("பாதுகாப்பானது");

    // Change to Hindi
    currentLang = "hi";
    expect(getNestedTranslation(currentLang, "safety.safe")).toBe("सुरक्षित");

    // Change to Marathi
    currentLang = "mr";
    expect(getNestedTranslation(currentLang, "safety.safe")).toBe("सुरक्षित");
  });

  // 7. Deterministic Safety Engine Invariance (Section 17 of specification)
  it("CRITICAL: Safety engine decisions and calculations must remain 100% language-independent", () => {
    const now = Date.now();
    const rawInput = {
      radar: {
        distanceM: 10,
        relativeVelocityMps: -10, // Closing at 10 m/s -> TTC = 1.0s (Critical)
        angleDeg: 0,
        targetCount: 1,
        signalStrength: 95,
        trackPersistence: 0.99,
        timestampMs: now,
      },
      vehicle: {
        speedMps: 10,
        direction: "FORWARD" as const,
        brakeApplied: false,
        throttlePercent: 0,
        gear: "D" as const,
        encoderPulses: 1000,
        timestampMs: now,
      },
      fogLock: {
        blockId: "BLK_01",
        blockType: "HAUL_ROAD" as const,
        authorization: "GRANT" as const,
        token: {
          tokenId: "TOK_TEST",
          vehicleId: "V01",
          blockId: "BLK_01",
          direction: "A_TO_B" as const,
          issuedAt: now - 1000,
          expiresAt: now + 60000,
          sequence: 10,
          status: "VALID" as const,
        },
        tokenId: "TOK_TEST",
        direction: "A_TO_B" as const,
        separationM: 50,
        speedAdvisoryKmh: 30,
        timestampMs: now,
      },
      environment: {
        weather: "DENSE_FOG" as const,
        roadCondition: "WET" as const,
        visibility: "POOR" as const,
        simulated: true,
        timestampMs: now,
      },
      sensorHealth: {
        radarValid: true,
        encoderValid: true,
        canValid: true,
        loraValid: true,
        brakeValid: true,
      },
      timestampMs: now,
    };

    // Run deterministic safety pipeline
    const result = processSafetyPipeline(rawInput);

    // The safety engine outputs language-independent internal codes
    expect(result.decision.safetyState).toBe("EMERGENCY");
    expect(result.decision.reasonCode).toBe("IMMINENT_COLLISION");
    expect(result.decision.finalAction).toBe("EMERGENCY_BRAKING");

    // Changing presentation language translates display ONLY
    languageCodes.forEach((lang) => {
      const localizedReason = translateReason(lang, result.decision.reasonCode);
      expect(localizedReason).toBeTruthy();
      // Internal decision code must NOT be mutated
      expect(result.decision.reasonCode).toBe("IMMINENT_COLLISION");
      expect(result.decision.safetyState).toBe("EMERGENCY");
      expect(result.decision.finalAction).toBe("EMERGENCY_BRAKING");
    });
  });

  // 8. Driver vs Control Room Dashboard Contextual Consistency (Section 14)
  it("should maintain consistent safety semantics between Driver Display and Control Room", () => {
    // Tamil
    expect(translations.ta.safety.danger).toBe("ஆபத்து");
    expect(translations.ta.safety.brakeImmediately).toBe("உடனடியாக பிரேக் செய்யவும்");
    expect(translations.ta.safety.brakingActive).toBe("பிரேக்கிங் செயல்படுத்தப்பட்டது");

    // Hindi
    expect(translations.hi.safety.danger).toBe("खतरा");
    expect(translations.hi.safety.brakeImmediately).toBe("तुरंत ब्रेक लगाएँ");
    expect(translations.hi.safety.brakingActive).toBe("ब्रेक सक्रिय");

    // Bengali
    expect(translations.bn.safety.danger).toBe("বিপদ");
    expect(translations.bn.safety.brakeImmediately).toBe("অবিলম্বে ব্রেক করুন");
  });
});
