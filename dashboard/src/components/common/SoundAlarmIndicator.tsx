import React from "react";
import { Volume2, VolumeX, BellRing, RotateCcw } from "lucide-react";
import { useSafetySoundAlarm } from "../../hooks/useSafetySoundAlarm";
import { SafetyState } from "../../data/types";

interface SoundAlarmIndicatorProps {
  safetyState: SafetyState;
  aiRiskLevel?: string | null;
  compact?: boolean;
}

export const SoundAlarmIndicator: React.FC<SoundAlarmIndicatorProps> = ({
  safetyState,
  aiRiskLevel,
  compact = false,
}) => {
  const {
    isMuted,
    isAlarmActive,
    isAutoSilenced,
    secondsRemaining,
    toggleMute,
    replay,
    currentSeverity,
  } = useSafetySoundAlarm(safetyState, aiRiskLevel);

  const handleClick = () => {
    if (isAutoSilenced) {
      // If alarm auto-stopped after 10s, clicking replays the sound alert
      replay();
    } else {
      // Toggle mute/unmute
      toggleMute();
    }
  };

  return (
    <button
      onClick={handleClick}
      title={
        isAlarmActive
          ? `ALARM SOUNDING (${secondsRemaining}s remaining before 10s auto-stop) — Click to Silence Now`
          : isAutoSilenced
          ? "Alarm sound auto-stopped after 10 seconds. Click to replay audio alert."
          : isMuted
          ? "Sound Alarm Muted — Click to Enable Audio"
          : "Sound Alarm Armed (Auto-stops 10s after warning) — Click to Mute"
      }
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono text-xs font-bold transition-all border select-none cursor-pointer ${
        isAlarmActive
          ? "bg-red-600 border-red-400 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.7)]"
          : isAutoSilenced
          ? "bg-amber-950/70 border-amber-500/50 text-amber-300 hover:border-amber-400"
          : isMuted
          ? "bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500"
          : "bg-slate-900/90 border-slate-700 text-emerald-400 hover:border-emerald-500"
      }`}
    >
      {isAlarmActive ? (
        <>
          <BellRing className="w-4 h-4 text-white animate-bounce" />
          {!compact && (
            <span className="tracking-wider uppercase text-[11px] flex items-center gap-1">
              <span>{currentSeverity === "CRITICAL" ? "CRITICAL ALARM" : "WARNING ALARM"}</span>
              <span className="px-1 py-0.2 bg-black/40 rounded text-[10px] text-amber-200 font-black">
                {secondsRemaining}s
              </span>
            </span>
          )}
        </>
      ) : isAutoSilenced ? (
        <>
          <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
          {!compact && (
            <span className="text-[11px] text-amber-300 tracking-wider">
              AUTO-STOPPED (10s)
            </span>
          )}
        </>
      ) : isMuted ? (
        <>
          <VolumeX className="w-4 h-4 text-slate-400" />
          {!compact && <span className="text-[11px] text-slate-400">MUTED</span>}
        </>
      ) : (
        <>
          <Volume2 className="w-4 h-4 text-emerald-400" />
          {!compact && <span className="text-[11px] text-slate-300">ARMED</span>}
        </>
      )}
    </button>
  );
};
