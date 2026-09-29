import { useEffect, useState, useCallback, useRef } from "react";
import { soundAlarm, AlarmEngineState } from "../utils/soundAlarm";
import { SafetyState } from "../data/types";

export function useSafetySoundAlarm(
  safetyState: SafetyState,
  aiRiskLevel?: string | null
) {
  const [engineState, setEngineState] = useState<AlarmEngineState>(() =>
    soundAlarm.getState()
  );
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const lastStateRef = useRef<SafetyState>(safetyState);

  // Subscribe to engine state updates (including 10s auto-stop)
  useEffect(() => {
    return soundAlarm.subscribe((state) => {
      setEngineState(state);
    });
  }, []);

  // Track safety state transitions and 10s countdown
  useEffect(() => {
    const isCritical =
      safetyState === "CRITICAL" ||
      safetyState === "EMERGENCY" ||
      aiRiskLevel === "CRITICAL";

    const isHighRiskWarning =
      safetyState === "WARNING" || aiRiskLevel === "HIGH";

    const stateChanged = lastStateRef.current !== safetyState;
    lastStateRef.current = safetyState;

    if (isCritical) {
      if (stateChanged || !engineState.isPlaying && !engineState.isAutoSilenced) {
        soundAlarm.triggerAlarm("CRITICAL", 10000);
        setSecondsRemaining(10);
      }
    } else if (isHighRiskWarning) {
      if (stateChanged || !engineState.isPlaying && !engineState.isAutoSilenced) {
        soundAlarm.triggerAlarm("WARNING", 10000);
        setSecondsRemaining(10);
      }
    } else {
      // Normal / Safe condition: Stop and reset completely
      soundAlarm.stopAlarm();
      setSecondsRemaining(0);
    }
  }, [safetyState, aiRiskLevel, engineState.isPlaying, engineState.isAutoSilenced]);

  // 1-second countdown ticker while alarm is actively sounding
  useEffect(() => {
    if (!engineState.isPlaying || secondsRemaining <= 0) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [engineState.isPlaying, secondsRemaining]);

  const toggleMute = useCallback(() => {
    soundAlarm.toggleMute();
  }, []);

  const replay = useCallback(() => {
    soundAlarm.replay();
    setSecondsRemaining(10);
  }, []);

  return {
    isMuted: engineState.isMuted,
    isAlarmActive: engineState.isPlaying,
    isAutoSilenced: engineState.isAutoSilenced,
    secondsRemaining,
    toggleMute,
    replay,
    currentSeverity: engineState.currentSeverity,
  };
}
