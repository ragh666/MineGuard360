import React, { useEffect, useState } from "react";
import { useVehicleStore } from "../store/vehicleStore";
import { CircularRadarHUD } from "./CircularRadarHUD";
import { PerspectiveSafetyCorridorHUD } from "./PerspectiveSafetyCorridorHUD";
import { useTranslation } from "../context/LanguageContext";
import { LanguageSelector } from "./common/LanguageSelector";
import { MineGuard360Brand } from "./common/MineGuard360Logo";
import { SoundAlarmIndicator } from "./common/SoundAlarmIndicator";
import {
  Maximize2,
  Minimize2,
  Activity,
  Gauge,
  Navigation,
  Wind,
  ShieldAlert,
  Radio,
  Clock,
  AlertOctagon,
  CheckCircle2,
  AlertTriangle,
  Ban,
  CloudRain,
  Disc,
  Layers,
  CheckCheck,
  Play,
  Pause,
  FastForward,
  Sliders,
} from "lucide-react";
import { SafetyState } from "../data/types";

export const PassiveDriverDisplay: React.FC = () => {
  const {
    raw,
    calculated,
    decision,
    globalEnvironment,
    backendConnected,
    blocks,
    brakeVerificationFault,
    currentScenario,
    isDemoRunning,
    toggleDemoMode,
    tickDemo,
  } = useVehicleStore();

  const { t, getReasonText, getSafetyDecisionText } = useTranslation();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [radarViewMode, setRadarViewMode] = useState<"DRIVER_POV" | "CIRCULAR_2D">("DRIVER_POV");

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const currentFogDensity = globalEnvironment.fogDensityPercent ?? 87;
  const currentVisM = globalEnvironment.visibilityMeters ?? 9.1;
  const currentMode = globalEnvironment.sensorVisualMode ?? "Standard";
  const currentSpeedKmh =
    globalEnvironment.vehicleSpeedKmh ??
    (raw.vehicle.speedMps !== null ? Math.round(raw.vehicle.speedMps * 3.6) : 42);
  const currentLeadDistM =
    globalEnvironment.leadObstacleDistanceM ??
    (raw.radar.distanceM !== null ? raw.radar.distanceM : 24.5);

  // -------------------------------------------------------------------------
  // FOG-LOCK DECISION STATE RESOLUTION (Requirement 2)
  // -------------------------------------------------------------------------
  const getFogLockState = () => {
    // Check LoRa communication & Sensor Health
    if (!raw.sensorHealth.loraValid || raw.fogLock.authorization === "COMM_LOST") {
      return {
        label: "FOG-LOCK: UNKNOWN / FAULT",
        stateOnly: "UNKNOWN / FAULT",
        badgeClass: "bg-slate-800 text-amber-400 border-amber-500/50",
      };
    }
    if (raw.fogLock.authorization === "UNKNOWN" || !raw.fogLock.blockId) {
      return {
        label: "FOG-LOCK: UNKNOWN / FAULT",
        stateOnly: "UNKNOWN / FAULT",
        badgeClass: "bg-slate-800 text-slate-400 border-slate-600",
      };
    }
    if (raw.fogLock.authorization === "DENY") {
      return {
        label: "FOG-LOCK: HOLD",
        stateOnly: "HOLD",
        badgeClass: "bg-red-950/90 text-red-400 border-red-500/60 animate-pulse",
      };
    }
    const currentBlock = blocks.find((b) => b.blockId === raw.fogLock.blockId);
    if (currentBlock?.restricted) {
      return {
        label: "FOG-LOCK: RESTRICT",
        stateOnly: "RESTRICT",
        badgeClass: "bg-amber-950/90 text-amber-300 border-amber-500/60",
      };
    }
    if (raw.fogLock.speedAdvisoryKmh !== null && raw.fogLock.speedAdvisoryKmh <= 15) {
      return {
        label: "FOG-LOCK: CONTROLLED ENTRY",
        stateOnly: "CONTROLLED ENTRY",
        badgeClass: "bg-emerald-950/90 text-emerald-300 border-emerald-500/50",
      };
    }
    if (raw.fogLock.authorization === "GRANT") {
      return {
        label: "FOG-LOCK: GRANTED",
        stateOnly: "GRANTED",
        badgeClass: "bg-emerald-950/90 text-emerald-400 border-emerald-500/50",
      };
    }
    return {
      label: "FOG-LOCK: UNKNOWN / FAULT",
      stateOnly: "UNKNOWN / FAULT",
      badgeClass: "bg-slate-800 text-slate-400 border-slate-600",
    };
  };

  const fogLockState = getFogLockState();

  // -------------------------------------------------------------------------
  // TOKEN STATUS RESOLUTION (Requirement 5)
  // -------------------------------------------------------------------------
  const getTokenDisplay = () => {
    const token = raw.fogLock.token;
    if (!token) {
      return {
        text: "TOKEN: NONE",
        badgeClass: "bg-slate-800/80 text-slate-400 border-slate-700",
      };
    }
    const now = Date.now();
    const remainingSec = Math.max(0, Math.round((token.expiresAt - now) / 1000));
    if (token.status === "EXPIRED" || (token.expiresAt && token.expiresAt < now)) {
      return {
        text: "TOKEN: EXPIRED",
        badgeClass: "bg-red-950/80 text-red-400 border-red-500/40",
      };
    }
    if (token.status === "INVALID" || token.status === "REVOKED") {
      return {
        text: "TOKEN: INVALID",
        badgeClass: "bg-amber-950/80 text-amber-400 border-amber-500/40",
      };
    }
    if (token.status === "VALID") {
      return {
        text: remainingSec > 0 ? `TOKEN: VALID (${remainingSec}s)` : "TOKEN: VALID",
        badgeClass: "bg-emerald-950/80 text-emerald-400 border-emerald-500/40",
      };
    }
    return {
      text: "TOKEN: UNKNOWN",
      badgeClass: "bg-slate-800/80 text-slate-400 border-slate-700",
    };
  };

  const tokenDisplay = getTokenDisplay();

  // -------------------------------------------------------------------------
  // BRAKE VERIFICATION STATUS RESOLUTION (Requirement 6)
  // -------------------------------------------------------------------------
  const isBrakingActive =
    decision.brakeCommand ||
    raw.vehicle.brakeApplied ||
    decision.finalAction === "BRAKE" ||
    decision.finalAction === "EMERGENCY_BRAKING" ||
    decision.finalAction === "STOP";

  const getBrakeVerificationStatus = () => {
    if (!isBrakingActive) {
      return {
        active: false,
        text: "BRAKE: READY",
        detail: "STANDBY",
        badgeClass: "bg-black/30 text-slate-400 border-slate-700",
      };
    }

    // Actuator or sensor fault detected
    if (
      brakeVerificationFault ||
      !raw.sensorHealth.brakeValid ||
      decision.reasonCode === "BRAKE_VERIFICATION_FAULT"
    ) {
      return {
        active: true,
        text: "⚠ STOP NOT VERIFIED",
        detail: "ACTUATOR FAULT",
        badgeClass: "bg-red-950 text-red-300 border-red-500 animate-pulse",
      };
    }

    // Motion confirmed arrested
    if (raw.vehicle.speedMps === 0 || (raw.vehicle.speedMps !== null && raw.vehicle.speedMps < 0.1)) {
      return {
        active: true,
        text: "✓ STOP VERIFIED",
        detail: "MOTION ARRESTED",
        badgeClass: "bg-emerald-950 text-emerald-300 border-emerald-500",
      };
    }

    // Deceleration in progress
    return {
      active: true,
      text: "VERIFYING STOP...",
      detail: "DECELERATION ACTIVE",
      badgeClass: "bg-amber-950 text-amber-300 border-amber-500 animate-pulse",
    };
  };

  const brakeStatus = getBrakeVerificationStatus();

  // -------------------------------------------------------------------------
  // LOCAL SAFETY DECISION STYLING
  // -------------------------------------------------------------------------
  const getDecisionStyle = (state: SafetyState) => {
    const localized = getSafetyDecisionText(state, "driver");

    switch (state) {
      case "CRITICAL":
      case "EMERGENCY":
        return {
          bg: "bg-red-600 animate-pulse",
          text: "text-white",
          icon: <AlertOctagon className="w-14 h-14 md:w-16 md:h-16 text-white flex-shrink-0" />,
          title: localized.title,
        };
      case "WARNING":
        return {
          bg: "bg-orange-500",
          text: "text-orange-950",
          icon: <ShieldAlert className="w-14 h-14 md:w-16 md:h-16 text-orange-950 flex-shrink-0" />,
          title: localized.title,
        };
      case "CAUTION":
        return {
          bg: "bg-amber-400",
          text: "text-amber-950",
          icon: <AlertTriangle className="w-14 h-14 md:w-16 md:h-16 text-amber-950 flex-shrink-0" />,
          title: localized.title,
        };
      case "FAULT":
        return {
          bg: "bg-slate-700",
          text: "text-slate-200",
          icon: <Ban className="w-14 h-14 md:w-16 md:h-16 text-slate-200 flex-shrink-0" />,
          title: localized.title,
        };
      case "SAFE":
      default:
        // Hold logic only if block movement authority is explicitly denied or communication is lost
        if (raw.fogLock.authorization === "DENY" || raw.fogLock.authorization === "COMM_LOST") {
          return {
            bg: "bg-red-900",
            text: "text-red-200",
            icon: <Ban className="w-14 h-14 md:w-16 md:h-16 text-red-200 flex-shrink-0" />,
            title: t("safety.holdTitle", "HOLD — NOT AUTHORIZED"),
          };
        }
        return {
          bg: "bg-emerald-500",
          text: "text-emerald-950",
          icon: <CheckCircle2 className="w-14 h-14 md:w-16 md:h-16 text-emerald-950 flex-shrink-0" />,
          title: localized.title,
        };
    }
  };

  const dStyle = getDecisionStyle(decision.safetyState);

  // Local Safety State Pill Color (for distinct 2-layer safety presentation)
  const getLocalSafetyPillClass = (state: SafetyState) => {
    switch (state) {
      case "CRITICAL":
      case "EMERGENCY":
        return "bg-red-950 text-red-400 border-red-500/80 animate-pulse";
      case "WARNING":
        return "bg-orange-950 text-orange-400 border-orange-500/60";
      case "CAUTION":
        return "bg-amber-950 text-amber-300 border-amber-500/60";
      case "FAULT":
        return "bg-slate-800 text-slate-300 border-slate-600";
      case "SAFE":
      default:
        return "bg-emerald-950 text-emerald-400 border-emerald-500/60";
    }
  };

  return (
    <div
      className={`w-full h-full min-h-screen bg-[#060c13] flex flex-col p-2 md:p-3 select-none font-sans overflow-hidden ${
        decision.safetyState === "CRITICAL"
          ? "border-4 border-red-500 shadow-[inset_0_0_100px_rgba(239,68,68,0.5)]"
          : ""
      }`}
    >
      {/* ------------------------------------------------------------------- */}
      {/* TOP HEADER CONTROL BAR */}
      {/* ------------------------------------------------------------------- */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 text-xs font-mono text-slate-300 bg-[#0a1520]/80 rounded-xl mb-2 flex-shrink-0 gap-2">
        <div className="flex items-center gap-2.5 flex-wrap">
          <MineGuard360Brand size="sm" />
          <span className="text-gray-600 hidden sm:inline">|</span>

          {/* Vehicle ID */}
          <span className="text-[11px] sm:text-xs">
            {t("driver.vehicleLabel", "Vehicle")}: <strong className="text-cyan-400 font-bold">HT-01 (EGO)</strong>
          </span>
          <span className="text-gray-600 hidden sm:inline">|</span>

          {/* Block ID & Persistent FOG-LOCK Decision State (Requirements 2 & 5) */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] sm:text-xs">
              {t("driver.blockLabel", "Block")}: <strong className="text-amber-400 font-bold">{raw.fogLock.blockId ?? "B1"}</strong>
            </span>
            {/* Persistent FOG-LOCK Movement Authority Status Chip */}
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border transition-all ${fogLockState.badgeClass}`}
            >
              {fogLockState.label}
            </span>
            {/* Compact Token Status Field */}
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border transition-all ${tokenDisplay.badgeClass}`}
            >
              {tokenDisplay.text}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-shrink-0 flex-wrap">
          {/* Active Scenario Indicator Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-950/80 border border-blue-500/50 text-blue-300 font-mono text-[11px] font-bold shadow-sm">
            <Sliders className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline text-slate-400 text-[10px]">SCENARIO:</span>
            <span className="text-cyan-300 uppercase">{currentScenario.replace(/_/g, " ")}</span>
          </div>

          {/* Automated Mock Ticker Button */}
          <button
            onClick={toggleDemoMode}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold border transition-all cursor-pointer shadow-sm ${
              isDemoRunning
                ? "bg-amber-950/90 text-amber-300 border-amber-500 animate-pulse"
                : "bg-emerald-950/90 text-emerald-300 border-emerald-500/60 hover:bg-emerald-900"
            }`}
            title="Auto-cycle through all scenarios sequentially"
          >
            {isDemoRunning ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
            <span>{isDemoRunning ? "TICKER ACTIVE" : "START MOCK TICKER"}</span>
          </button>

          {isDemoRunning && (
            <button
              onClick={tickDemo}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 font-mono text-[11px] font-bold cursor-pointer transition-all shadow-sm"
              title="Skip to next scenario"
            >
              <FastForward className="w-3 h-3 text-cyan-400" /> NEXT
            </button>
          )}

          {/* Subtle POC / SIMULATION Label (Requirement 8) */}
          <span className="px-2 py-0.5 rounded bg-slate-800/90 text-slate-400 border border-slate-700/60 text-[10px] font-mono uppercase tracking-wider font-semibold hidden md:inline">
            POC / SIMULATION
          </span>

          {/* Connection Status Pill */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-bold border transition-all ${
              backendConnected
                ? "bg-emerald-950/80 text-emerald-400 border-emerald-500/40 shadow-sm"
                : "bg-red-950/90 text-red-300 border-red-500/60 animate-pulse"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                backendConnected ? "bg-emerald-400" : "bg-red-500"
              }`}
            />
            <span>
              {backendConnected
                ? t("common.connected", "CONNECTED")
                : t("common.connectionLost", "CONNECTION LOST")}
            </span>
          </div>

          {/* Audio Warning Alarm System */}
          <SoundAlarmIndicator safetyState={decision.safetyState} aiRiskLevel={decision.aiRiskLevel} />

          {/* Language Selector */}
          <LanguageSelector variant="driver" />

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 transition-all font-mono text-[11px] shadow-sm cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span>{isFullscreen ? t("driver.exitFullscreen", "EXIT FULLSCREEN") : t("driver.fullscreen", "FULLSCREEN")}</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* COOPERATING SAFETY LAYERS STATUS BAR (Requirement 2) */}
      {/* Makes it 100% obvious that FOG-HEMM has TWO cooperating safety layers: */}
      {/* 1. Vehicle-local safety  |  2. Block-level movement authority */}
      {/* ------------------------------------------------------------------- */}
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#08121d]/90 border border-slate-800/80 rounded-xl text-xs font-mono mb-2 flex-shrink-0 flex-wrap gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Layer 1: Local Vehicle Safety */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              {t("driver.layer1LocalSafety", "Layer 1: Local Safety:")}
            </span>
            <span
              className={`px-2.5 py-0.5 rounded font-black text-xs border tracking-wider ${getLocalSafetyPillClass(
                decision.safetyState
              )}`}
            >
              {getSafetyDecisionText(decision.safetyState, "driver").title.split(" — ")[0]}
            </span>
          </div>

          <span className="text-slate-700 hidden sm:inline">|</span>

          {/* Layer 2: FOG-LOCK Movement Authority */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              {t("driver.layer2FogLock", "Layer 2: FOG-LOCK Authority:")}
            </span>
            <span
              className={`px-2.5 py-0.5 rounded font-black text-xs border tracking-wider ${fogLockState.badgeClass}`}
            >
              {fogLockState.stateOnly}
            </span>
          </div>

          <span className="text-slate-700 hidden sm:inline">|</span>

          {/* Digital Token Status */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              {t("blocks.token", "Token")}:
            </span>
            <span
              className={`px-2 py-0.5 rounded font-bold text-[11px] border tracking-wider ${tokenDisplay.badgeClass}`}
            >
              {tokenDisplay.text.replace("TOKEN: ", "")}
            </span>
          </div>
        </div>

        {/* Brake Verification Result (Requirement 6) */}
        {brakeStatus.active && (
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              {t("driver.brakeAction", "Brake Action:")}
            </span>
            <span
              className={`px-2.5 py-0.5 rounded font-black text-xs border tracking-wider ${brakeStatus.badgeClass}`}
            >
              {brakeStatus.text}
            </span>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* MASSIVE DETERMINISTIC DECISION BANNER (Requirements 3 & 7) */}
      {/* ------------------------------------------------------------------- */}
      <div
        className={`w-full rounded-2xl flex items-center justify-between p-4 sm:p-5 md:p-6 mb-3 shadow-2xl transition-colors duration-300 ${dStyle.bg} ${dStyle.text} flex-shrink-0 gap-4 flex-wrap sm:flex-nowrap`}
      >
        <div className="flex items-center gap-4 md:gap-6 min-w-0">
          {dStyle.icon}
          <div className="min-w-0">
            {/* Primary Safety Title (CRITICAL / BRAKE NOW) */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tight break-words leading-tight">
              {dStyle.title}
            </h1>

            {/* Human-Readable Explanation (Prominent as required) */}
            <h2 className="text-sm sm:text-lg md:text-xl font-bold mt-1 opacity-95 uppercase tracking-wide break-words">
              {getReasonText(decision.reason)}
            </h2>

            {/* Standardized Internal Reason Code (Requirement 3: from actual data) */}
            <div className="mt-2 flex items-center gap-2 font-mono text-xs">
              <span className="opacity-75 uppercase tracking-wider text-[10px] md:text-[11px] font-bold">
                Reason Code:
              </span>
              <span className="px-2 py-0.5 rounded bg-black/60 border border-white/20 font-black text-white tracking-wider">
                {decision.reasonCode}
              </span>
            </div>
          </div>
        </div>

        {/* Right side: Braking Active & Brake Verification (Requirements 6 & 7) */}
        <div className="text-right flex flex-col items-end gap-2 flex-shrink-0 ml-auto">
          {isBrakingActive && (
            <div className="flex flex-col items-end gap-1.5">
              <div className="px-4 py-2 bg-black/90 text-red-500 border border-red-500 font-black text-xl md:text-2xl uppercase tracking-widest rounded-lg animate-pulse whitespace-nowrap">
                {t("safety.brakingActive", "BRAKING ACTIVE")}
              </div>
              {/* Brake Verification Result */}
              <div
                className={`px-3 py-1 rounded text-xs font-mono font-black border tracking-wider shadow-sm ${brakeStatus.badgeClass}`}
              >
                {brakeStatus.text}
              </div>
            </div>
          )}
          <div className="text-sm md:text-base font-bold opacity-85 uppercase tracking-wide whitespace-nowrap">
            {t("safety.recommendedSpeed", "Rec. Speed")}: {decision.recommendedSpeedKmh}{" "}
            {t("common.unitKmh", "km/h")}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* MAIN TWO-COLUMN LAYOUT */}
      {/* ------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-0">
        {/* LEFT COLUMN (4 Cols): TELEMETRY & SYSTEM HEALTH */}
        <div className="lg:col-span-4 space-y-3 flex flex-col justify-start overflow-y-auto">
          {/* SPEED & DISTANCE HUD */}
          <div className="bg-gradient-to-br from-[#0b1622]/90 to-[#060c13]/90 border border-cyan-500/30 rounded-2xl p-4 sm:p-5 shadow-[0_0_20px_rgba(6,182,212,0.15)] backdrop-blur-md relative overflow-hidden">
            <div className="absolute -top-4 -right-4 p-3 opacity-10 pointer-events-none">
              <Gauge className="w-32 h-32 text-cyan-400" />
            </div>

            <h3 className="text-cyan-400 text-[11px] font-bold tracking-widest uppercase mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4" /> {t("driver.dynamicsTelemetry", "Dynamics Telemetry")}
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-gray-400 text-[10px] uppercase font-mono tracking-wider">
                  {t("safety.currentSpeed", "Current Speed")}
                </span>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-black text-white">{currentSpeedKmh}</span>
                  <span className="text-cyan-400 text-sm font-bold mb-1">{t("common.unitKmh", "km/h")}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-gray-400 text-[10px] uppercase font-mono tracking-wider">
                  {t("safety.targetSpeed", "Target Speed")}
                </span>
                <div className="flex items-end gap-1">
                  <span className="text-3xl font-bold text-amber-400">{decision.recommendedSpeedKmh}</span>
                  <span className="text-amber-500/70 text-sm font-bold mb-1">{t("common.unitKmh", "km/h")}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-cyan-500/10 space-y-2.5">
              <div className="flex justify-between items-center bg-black/20 p-2.5 rounded-lg border border-white/5">
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-emerald-400" />
                  <span className="text-gray-300 text-xs font-mono">
                    {t("safety.separationDistance", "Separation Dist")}:
                  </span>
                </div>
                <span className="text-emerald-400 font-black text-lg">
                  {currentLeadDistM.toFixed(1)} {t("common.unitMeters", "m")}
                </span>
              </div>

              <div className="flex justify-between items-center bg-black/20 p-2.5 rounded-lg border border-white/5">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span className="text-gray-300 text-xs font-mono">
                    {t("safety.requiredStoppingDistance", "Req. Stop Dist")}:
                  </span>
                </div>
                <span className="text-rose-400 font-bold text-base">
                  {calculated.requiredStoppingDistanceM?.toFixed(1) || "--"} {t("common.unitMeters", "m")}
                </span>
              </div>
            </div>
          </div>

          {/* ENVIRONMENT & SENSORS */}
          <div className="bg-[#0a111a]/80 border border-slate-700/50 rounded-2xl p-4 sm:p-5 shadow-lg backdrop-blur-sm relative overflow-hidden">
            <div className="absolute -bottom-6 -right-6 opacity-5 pointer-events-none">
              <CloudRain className="w-32 h-32 text-blue-400" />
            </div>
            <h3 className="text-slate-300 text-[11px] font-bold tracking-widest uppercase mb-3 flex items-center gap-2 relative z-10">
              <Wind className="w-4 h-4 text-slate-400" /> {t("driver.environmentalContext", "Environmental Context")}
            </h3>

            <div className="grid grid-cols-2 gap-3 relative z-10">
              <div className="bg-black/40 rounded-xl p-3 border border-white/5 flex flex-col justify-center items-center text-center shadow-inner">
                <span className="text-[10px] text-gray-400 uppercase font-mono tracking-wider">
                  {t("environment.visibility", "Visibility")}
                </span>
                <span className="text-blue-300 font-black text-xl mt-0.5">
                  {currentVisM}
                  <span className="text-xs text-blue-500/70 ml-0.5">{t("common.unitMeters", "m")}</span>
                </span>
              </div>
              <div className="bg-black/40 rounded-xl p-3 border border-white/5 flex flex-col justify-center items-center text-center shadow-inner">
                <span className="text-[10px] text-gray-400 uppercase font-mono tracking-wider">
                  {t("environment.fogDensity", "Fog Density")}
                </span>
                <span className="text-orange-300 font-black text-xl mt-0.5">
                  {currentFogDensity}
                  <span className="text-xs text-orange-500/70 ml-0.5">%</span>
                </span>
              </div>
              <div className="col-span-2 bg-black/40 rounded-xl p-2 border border-white/5 text-center text-xs font-mono text-slate-400">
                {t("environment.roadCondition", "Road Condition")}:{" "}
                <strong className="text-white">
                  {t(`environment.${globalEnvironment.roadCondition.toLowerCase()}`, globalEnvironment.roadCondition)}
                </strong>
              </div>
            </div>
          </div>

          {/* LOCAL SYSTEMS INTEGRITY (DGPS LOCK COMPLETELY REMOVED - Requirement 1) */}
          <div className="bg-[#0a111a]/80 border border-slate-700/50 rounded-2xl p-4 shadow-lg backdrop-blur-sm flex-1 flex flex-col">
            <h3 className="text-slate-300 text-[11px] font-bold tracking-widest uppercase mb-3 flex items-center gap-2">
              <Radio className="w-4 h-4 text-slate-400" /> {t("driver.systemsIntegrity", "Systems Integrity")}
            </h3>

            <div className="space-y-2 mt-1 flex-1 font-mono text-xs">
              {/* Local Radar Sensing Health (No GPS!) */}
              <div className="flex justify-between items-center bg-black/20 p-2 rounded border border-white/5">
                <span className="text-gray-400 flex items-center gap-2">
                  <Radio className="w-3.5 h-3.5 text-cyan-400" /> {t("driver.radarStream", "Radar Sensing Stream")}
                </span>
                <span
                  className={
                    raw.sensorHealth.radarValid ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"
                  }
                >
                  {raw.sensorHealth.radarValid ? t("driver.active77Ghz", "ACTIVE (77 GHz)") : t("sensors.degraded", "UNKNOWN / FAULT")}
                </span>
              </div>

              {/* Time-To-Collision */}
              <div className="flex justify-between items-center bg-black/20 p-2 rounded border border-white/5">
                <span className="text-gray-400 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-amber-500" /> {t("safety.ttc", "Est. TTC")}
                </span>
                <span
                  className={
                    calculated.ttcSeconds && calculated.ttcSeconds < 3
                      ? "text-rose-400 font-black text-sm"
                      : "text-amber-400 font-bold text-sm"
                  }
                >
                  {calculated.ttcSeconds ? `${calculated.ttcSeconds.toFixed(1)}s` : "> 10.0s"}
                </span>
              </div>

              {/* Brake Actuator Verification State (Requirement 6) */}
              <div className="flex justify-between items-center bg-black/20 p-2 rounded border border-white/5">
                <span className="text-gray-400 flex items-center gap-2">
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> {t("driver.brakeVerification", "Brake Verification")}
                </span>
                <span
                  className={`font-bold px-1.5 py-0.5 rounded text-[11px] ${
                    brakeStatus.active
                      ? brakeStatus.badgeClass
                      : "text-slate-400 bg-slate-900/60"
                  }`}
                >
                  {brakeStatus.text}
                </span>
              </div>

              {/* LoRa Communication / FOG-LOCK Channel */}
              <div className="flex justify-between items-center bg-black/20 p-2 rounded border border-white/5">
                <span className="text-gray-400 flex items-center gap-2">
                  <Disc className="w-3.5 h-3.5 text-blue-400" /> {t("driver.loraLink", "LoRa Block Link")}
                </span>
                <span
                  className={
                    raw.sensorHealth.loraValid && raw.fogLock.authorization !== "COMM_LOST"
                      ? "text-emerald-400 font-bold"
                      : "text-amber-400 font-bold"
                  }
                >
                  {raw.sensorHealth.loraValid && raw.fogLock.authorization !== "COMM_LOST"
                    ? t("driver.synced", "SYNCED")
                    : t("driver.commLostDegraded", "COMM LOST / DEGRADED")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (8 Cols): MAIN DRIVER POINT OF VIEW HUD */}
        <div className="lg:col-span-8 flex flex-col h-full min-h-0 p-1 relative">
          {/* Subtle View Switcher in corner to alternate between Driver Point of View and Expanded 2D Radar Scope */}
          <div className="absolute top-4 right-4 z-20 flex items-center bg-slate-900/90 border border-slate-700/80 rounded-lg p-0.5 font-mono text-[10px]">
            <button
              onClick={() => setRadarViewMode("DRIVER_POV")}
              className={`px-2.5 py-1 rounded font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                radarViewMode === "DRIVER_POV"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Layers className="w-3 h-3" /> {t("driver.driverPOV", "Driver Point of View")}
            </button>
            <button
              onClick={() => setRadarViewMode("CIRCULAR_2D")}
              className={`px-2.5 py-1 rounded font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                radarViewMode === "CIRCULAR_2D"
                  ? "bg-cyan-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Disc className="w-3 h-3" /> {t("driver.radarScope", "2D Radar Scope")}
            </button>
          </div>

          {/* PRIMARY VISUALIZATION: Driver Point of View (Perspective Windshield View with Circular Radar Targets) */}
          {radarViewMode === "DRIVER_POV" ? (
            <PerspectiveSafetyCorridorHUD
              radar={raw.radar}
              environment={raw.environment}
              speedMps={raw.vehicle.speedMps}
              stoppingDistanceM={calculated.stoppingDistanceM}
              requiredStoppingDistanceM={calculated.requiredStoppingDistanceM}
              safetyState={decision.safetyState}
              blindCurve={raw.fogLock.blockId === "B1"}
              blockId={raw.fogLock.blockId ?? "B1"}
              sensorVisualMode={currentMode}
              fogDensityPercent={currentFogDensity}
              visibilityMeters={currentVisM}
            />
          ) : (
            <CircularRadarHUD
              radar={raw.radar}
              speedMps={raw.vehicle.speedMps}
              stoppingDistanceM={calculated.stoppingDistanceM}
              requiredStoppingDistanceM={calculated.requiredStoppingDistanceM}
              safetyState={decision.safetyState}
              blindCurve={raw.fogLock.blockId === "B1"}
              blockId={raw.fogLock.blockId ?? "B1"}
              corridorStatus={calculated.corridorStatus}
              fogDensityPercent={currentFogDensity}
              visibilityMeters={currentVisM}
            />
          )}
        </div>
      </div>

      {/* Audio Element for Critical Beep */}
      {decision.safetyState === "CRITICAL" && (
        <audio autoPlay loop src="data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=" />
      )}
    </div>
  );
};
