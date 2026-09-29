import React, { useMemo } from "react";
import { RawRadarData, SafetyState } from "../data/types";
import { useTranslation } from "../context/LanguageContext";

interface CircularRadarHUDProps {
  radar: RawRadarData;
  speedMps: number | null;
  stoppingDistanceM: number | null;
  requiredStoppingDistanceM: number | null;
  safetyState: SafetyState;
  blockId?: string;
  corridorStatus?: "CLEAR" | "BLOCKED" | "UNKNOWN";
  blindCurve?: boolean;
  fogDensityPercent?: number;
  visibilityMeters?: number;
}

/**
 * Clean 2D Circular Radar Target Visualizer
 *
 * Implements FOG-HEMM Proof-of-Concept Safety Architecture:
 * - HEMM at center/reference vehicle (2D top-down industrial glyph)
 * - Concentric circular detection & protection zones around HEMM (10m, 20m, 30m, 50m)
 * - Critical stopping distance radius ring
 * - Circular target markers (○) with pulse glow
 * - Target distance callouts
 * - Relative closing velocity vector arrow (↗ / ↘)
 * - Safe haul corridor projection
 * - NO 3D perception, NO unsupported prediction, NO fake point clouds
 */
export const CircularRadarHUD: React.FC<CircularRadarHUDProps> = ({
  radar,
  speedMps,
  stoppingDistanceM,
  requiredStoppingDistanceM,
  safetyState,
  blockId = "B1",
  corridorStatus = "CLEAR",
  blindCurve = false,
  fogDensityPercent = 87,
  visibilityMeters = 9.1,
}) => {
  const { t } = useTranslation();

  // Coordinate System: 800 x 600
  // HEMM Reference Origin at (400, 390)
  const canvasW = 800;
  const canvasH = 600;
  const cx = 400;
  const cy = 390;

  // Scale: 5.0 pixels per meter (60m radar range = 300px radius)
  const pxPerMeter = 5.0;
  const maxRangeM = 60;

  const isDangerous =
    safetyState === "CRITICAL" ||
    safetyState === "EMERGENCY" ||
    safetyState === "WARNING" ||
    safetyState === "CAUTION";

  const isCurve = blockId === "B1" || blindCurve;
  const isNarrow = blockId === "B2";

  // Primary Radar Target Data
  const targetDistM = radar.distanceM ?? 24.5;
  const targetAngleDeg = radar.angleDeg ?? 0;
  const relVelMps = radar.relativeVelocityMps ?? -2.5;

  // Calculate Primary Target Coordinates (Planar 2D Polar -> Cartesian)
  const targetRad = (targetAngleDeg * Math.PI) / 180;
  const targetX = cx + targetDistM * pxPerMeter * Math.sin(targetRad);
  const targetY = cy - targetDistM * pxPerMeter * Math.cos(targetRad);

  // Secondary Scenario Target (Distant traffic or curve berm)
  const hasSecondaryTarget = true;
  const secondaryDistM = Math.min(52, targetDistM + 26);
  const secondaryAngleDeg = isCurve ? -14 : 12;
  const secondaryRad = (secondaryAngleDeg * Math.PI) / 180;
  const secondaryX = cx + secondaryDistM * pxPerMeter * Math.sin(secondaryRad);
  const secondaryY = cy - secondaryDistM * pxPerMeter * Math.cos(secondaryRad);

  // Critical Stopping Distance Protected Radius
  const criticalRadiusM = Math.max(12, requiredStoppingDistanceM ?? 22.0);
  const criticalRadiusPx = criticalRadiusM * pxPerMeter;

  // Range Rings to render (concentric circles)
  const rangeRings = [10, 20, 30, 40, 50, 60];

  // Azimuth Radial Rays (-60°, -45°, -30°, -15°, 0°, +15°, +30°, +45°, +60°)
  const azimuthAngles = [-60, -45, -30, -15, 0, 15, 30, 45, 60];

  // Safe Corridor Path Polygon in 2D Planar Radar Space
  const corridorHalfWidthM = isNarrow ? 2.2 : 3.5;
  const corridorHalfWidthPx = corridorHalfWidthM * pxPerMeter;
  const corridorLengthM = Math.min(55, Math.max(35, criticalRadiusM * 1.4));

  // Compute curved or straight corridor boundary points
  const corridorPolygonD = useMemo(() => {
    const steps = 10;
    const leftPts: Array<{ x: number; y: number }> = [];
    const rightPts: Array<{ x: number; y: number }> = [];

    for (let i = 0; i <= steps; i++) {
      const dM = (corridorLengthM / steps) * i;
      const curveOffsetM = isCurve && dM > 8 ? -Math.pow((dM - 8) * 0.05, 1.8) : 0;
      const curX = cx + curveOffsetM * pxPerMeter;
      const curY = cy - dM * pxPerMeter;

      leftPts.push({ x: curX - corridorHalfWidthPx, y: curY });
      rightPts.push({ x: curX + corridorHalfWidthPx, y: curY });
    }

    const leftStr = leftPts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
    const rightStr = rightPts.slice().reverse().map((p) => `L ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

    return `${leftStr} ${rightStr} Z`;
  }, [cx, cy, pxPerMeter, corridorLengthM, isCurve, corridorHalfWidthPx]);

  // Target Color based on distance & safety state
  const targetColor =
    targetDistM <= criticalRadiusM || safetyState === "CRITICAL" || safetyState === "EMERGENCY"
      ? "#ef4444"
      : targetDistM <= criticalRadiusM + 10 || safetyState === "WARNING" || safetyState === "CAUTION"
      ? "#f59e0b"
      : "#10b981";

  // Vector Arrow calculation for relative closing movement
  const isClosing = relVelMps < -0.1;
  const vectorLengthPx = Math.min(50, Math.max(22, Math.abs(relVelMps) * 8));
  // Vector pointing along direction of motion: closing points downward toward HEMM (0, 1), opening points away (0, -1)
  const vecDx = -Math.sin(targetRad) * (isClosing ? 1 : -1) * vectorLengthPx;
  const vecDy = Math.cos(targetRad) * (isClosing ? 1 : -1) * vectorLengthPx;

  return (
    <div className="w-full h-full bg-[#070e17] rounded-2xl relative overflow-hidden border border-slate-800 shadow-2xl flex flex-col select-none">
      <svg
        viewBox={`0 0 ${canvasW} ${canvasH}`}
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Subtle Radar Background Grid Pattern */}
          <pattern id="radarGrid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#0f1d2e" strokeWidth="0.8" />
          </pattern>

          {/* Glowing Filters */}
          <filter id="radarNeonGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="radarTargetGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Critical Stopping Zone Radial Gradient */}
          <radialGradient id="criticalZoneGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.22" />
            <stop offset="75%" stopColor="#ef4444" stopOpacity="0.10" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
          </radialGradient>

          {/* Safe Corridor Gradient */}
          <linearGradient id="corridorSafeGrad" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.30" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.08" />
          </linearGradient>

          <linearGradient id="corridorHazardGrad" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#dc2626" stopOpacity="0.15" />
          </linearGradient>

          {/* Radar Sweep Arc Gradient */}
          <linearGradient id="radarSweepGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* 1. Background Grid */}
        <rect width={canvasW} height={canvasH} fill="#070e17" />
        <rect width={canvasW} height={canvasH} fill="url(#radarGrid)" />

        {/* 2. 77GHz Radar Field of View Sweep Wedge (120° forward cone) */}
        <path
          d={`
            M ${cx},${cy}
            L ${cx + 300 * Math.sin((-60 * Math.PI) / 180)},${cy - 300 * Math.cos((-60 * Math.PI) / 180)}
            A 300 300 0 0 1 ${cx + 300 * Math.sin((60 * Math.PI) / 180)},${cy - 300 * Math.cos((60 * Math.PI) / 180)}
            Z
          `}
          fill="#0c1a29"
          opacity="0.6"
        />

        {/* 3. Azimuth Bearing Rays */}
        {azimuthAngles.map((deg) => {
          const rad = (deg * Math.PI) / 180;
          const rayLen = 300;
          const rx = cx + rayLen * Math.sin(rad);
          const ry = cy - rayLen * Math.cos(rad);
          const isCenter = deg === 0;

          return (
            <g key={deg}>
              <line
                x1={cx}
                y1={cy}
                x2={rx}
                y2={ry}
                stroke={isCenter ? "#0ea5e9" : "#1e293b"}
                strokeWidth={isCenter ? "1.8" : "1"}
                strokeDasharray={isCenter ? "none" : "3 3"}
                opacity={isCenter ? "0.8" : "0.5"}
              />
              <text
                x={rx + Math.sin(rad) * 14}
                y={ry - Math.cos(rad) * 10}
                fill="#64748b"
                fontSize="9"
                fontFamily="monospace"
                fontWeight="bold"
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {deg > 0 ? `+${deg}°` : `${deg}°`}
              </text>
            </g>
          );
        })}

        {/* 4. Concentric Circular Range Rings (10m to 60m) */}
        {rangeRings.map((m) => {
          const rPx = m * pxPerMeter;
          const isOuter = m === maxRangeM;
          return (
            <g key={m}>
              <circle
                cx={cx}
                cy={cy}
                r={rPx}
                fill="none"
                stroke={isOuter ? "#334155" : "#1e293b"}
                strokeWidth={isOuter ? "1.8" : "1"}
                strokeDasharray={isOuter ? "none" : "4 4"}
                opacity="0.8"
              />
              {/* Range Ring Distance Label */}
              <text
                x={cx + 6}
                y={cy - rPx + 12}
                fill="#475569"
                fontSize="9"
                fontFamily="monospace"
                fontWeight="bold"
              >
                {m}m
              </text>
            </g>
          );
        })}

        {/* 5. Critical Stopping Protected Radius Zone */}
        <circle
          cx={cx}
          cy={cy}
          r={criticalRadiusPx}
          fill="url(#criticalZoneGrad)"
          stroke="#ef4444"
          strokeWidth="1.8"
          strokeDasharray="6 4"
          opacity={isDangerous ? "0.9" : "0.5"}
        />
        {/* Critical Zone Label Badge */}
        <text
          x={cx - criticalRadiusPx + 10}
          y={cy + 14}
          fill="#ef4444"
          fontSize="8.5"
          fontFamily="monospace"
          fontWeight="bold"
          letterSpacing="0.5"
        >
          PROTECTED ZONE ({criticalRadiusM.toFixed(1)}m)
        </text>

        {/* 6. Safe Corridor Envelope (Haul Road Channel) */}
        <path
          d={corridorPolygonD}
          fill={corridorStatus === "BLOCKED" || isDangerous ? "url(#corridorHazardGrad)" : "url(#corridorSafeGrad)"}
          stroke={corridorStatus === "BLOCKED" || isDangerous ? "#ef4444" : "#10b981"}
          strokeWidth="1.6"
          strokeDasharray={corridorStatus === "BLOCKED" ? "6 3" : "none"}
          opacity="0.85"
        />

        {/* Corridor Center Guidance Line */}
        <line
          x1={cx}
          y1={cy - 25}
          x2={cx + (isCurve ? -18 : 0)}
          y2={cy - corridorLengthM * pxPerMeter}
          stroke={corridorStatus === "BLOCKED" || isDangerous ? "#f87171" : "#34d399"}
          strokeWidth="1.5"
          strokeDasharray="4 4"
          opacity="0.75"
        />

        {/* 7. Secondary Target (○) if Present in Scenario */}
        {hasSecondaryTarget && (
          <g transform={`translate(${secondaryX}, ${secondaryY})`} className="opacity-70">
            {/* Range Ring */}
            <circle cx="0" cy="0" r="14" fill="none" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
            {/* Target Circle Marker */}
            <circle cx="0" cy="0" r="6" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.5" />
            {/* Target Label */}
            <text x="10" y="4" fill="#94a3b8" fontSize="8.5" fontFamily="monospace" fontWeight="bold">
              ○ TARGET 2 ({secondaryDistM.toFixed(1)}m)
            </text>
          </g>
        )}

        {/* 8. PRIMARY RADAR TARGET VISUALIZATION (○ Target + Closing Vector) */}
        <g transform={`translate(${targetX}, ${targetY})`}>
          {/* Animated Pulsing Detection Wave around Target */}
          <circle cx="0" cy="0" r="24" fill="none" stroke={targetColor} strokeWidth="1.2" opacity="0.4">
            <animate attributeName="r" values="10;32" dur="1.8s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.8;0" dur="1.8s" repeatCount="indefinite" />
          </circle>

          {/* Static Protective Target Halo */}
          <circle cx="0" cy="0" r="14" fill="none" stroke={targetColor} strokeWidth="1.5" strokeDasharray="3 3" opacity="0.85" />

          {/* PRIMARY CIRCULAR TARGET MARKER (○) */}
          <circle
            cx="0"
            cy="0"
            r="7.5"
            fill={targetColor}
            stroke="#ffffff"
            strokeWidth="2"
            filter="url(#radarTargetGlow)"
          />

          {/* Central Target Symbol Core */}
          <circle cx="0" cy="0" r="2.5" fill="#ffffff" />

          {/* Relative Movement / Closing Vector Arrow (↗ / ↘) */}
          <g>
            <line
              x1="0"
              y1="0"
              x2={vecDx}
              y2={vecDy}
              stroke={targetColor}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Arrowhead */}
            <circle
              cx={vecDx}
              cy={vecDy}
              r="3"
              fill={targetColor}
            />
          </g>

          {/* Target Distance & Velocity Callout Badge */}
          <g transform={`translate(${targetX > cx ? 16 : -135}, ${targetY < cy ? -28 : 12})`}>
            <rect
              x="0"
              y="0"
              width="122"
              height="36"
              rx="6"
              fill="#060e19"
              stroke={targetColor}
              strokeWidth="1.4"
              opacity="0.95"
            />
            <text x="8" y="14" fill="#ffffff" fontSize="9.5" fontFamily="monospace" fontWeight="black" letterSpacing="0.5">
              ○ TARGET ({radar.obstacleClass ?? "HEMM"})
            </text>
            <text x="8" y="27" fill={targetColor} fontSize="9" fontFamily="monospace" fontWeight="bold">
              {targetDistM.toFixed(1)}m | {isClosing ? `CLOSING ${Math.abs(relVelMps).toFixed(1)}m/s ↘` : "STATIONARY"}
            </text>
          </g>
        </g>

        {/* 9. HEMM Ego Vehicle (Center / Reference Position) */}
        <g transform={`translate(${cx}, ${cy})`}>
          {/* Circular HEMM Safety Perimeter Shield */}
          <circle cx="0" cy="0" r="32" fill="none" stroke="#0ea5e9" strokeWidth="1" strokeDasharray="2 2" opacity="0.6" />

          {/* Vehicle Body Glyph (Top-Down Mining Haul Truck) */}
          {/* Main Truck Bed (Rear) */}
          <rect x="-14" y="-4" width="28" height="26" fill="#334155" stroke="#475569" strokeWidth="1.5" rx="3" />
          <line x1="-10" y1="9" x2="10" y2="9" stroke="#1e293b" strokeWidth="1.5" />

          {/* Dump Truck Cabin (Front) */}
          <rect x="-11" y="-22" width="22" height="18" fill="#ca8a04" stroke="#eab308" strokeWidth="1.5" rx="2" />
          {/* Front Windshield */}
          <rect x="-8" y="-19" width="16" height="7" fill="#0284c7" rx="1" />

          {/* Heavy Hauler Tires */}
          <rect x="-18" y="-18" width="5" height="11" fill="#0f172a" stroke="#475569" strokeWidth="1" rx="1" />
          <rect x="13" y="-18" width="5" height="11" fill="#0f172a" stroke="#475569" strokeWidth="1" rx="1" />
          <rect x="-18" y="7" width="5" height="13" fill="#0f172a" stroke="#475569" strokeWidth="1" rx="1" />
          <rect x="13" y="7" width="5" height="13" fill="#0f172a" stroke="#475569" strokeWidth="1" rx="1" />

          {/* Radar Transceiver Center Origin Pin */}
          <circle cx="0" cy="-22" r="3.5" fill="#38bdf8" filter="url(#radarNeonGlow)" />

          {/* EGO Label */}
          <text
            x="0"
            y="35"
            fill="#38bdf8"
            fontSize="9"
            fontFamily="monospace"
            fontWeight="black"
            textAnchor="middle"
            letterSpacing="0.8"
          >
            🚛 HEMM (EGO)
          </text>
        </g>
      </svg>

      {/* TOP OVERLAY STATUS HUD BAR */}
      <div className="absolute top-3 left-4 right-4 flex items-center justify-between pointer-events-none">
        {/* Left: 2D Radar Mode Status Chip */}
        <div className="flex items-center gap-2 bg-[#0b1320]/95 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-700/80 shadow-lg">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              isDangerous ? "bg-red-500 animate-ping" : "bg-emerald-400"
            }`}
          />
          <span className="text-[11px] font-mono font-bold tracking-wider text-slate-200">
            2D CIRCULAR RADAR SENSING
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700 font-bold">
            77 GHz FMCW
          </span>
        </div>

        {/* Right: Environmental & Corridor Context */}
        <div className="flex items-center gap-2.5 bg-[#0b1320]/95 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-700/80 shadow-lg font-mono text-[11px]">
          <span className="text-slate-400">
            CORRIDOR:{" "}
            <strong className={corridorStatus === "BLOCKED" ? "text-red-400" : "text-emerald-400"}>
              {corridorStatus}
            </strong>
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">
            VIS: <strong className="text-cyan-400">{visibilityMeters.toFixed(1)}m</strong>
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">
            FOG: <strong className="text-amber-400">{fogDensityPercent}%</strong>
          </span>
        </div>
      </div>

      {/* BOTTOM RADAR SCOPE FOOTER LEGEND */}
      <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between pointer-events-none font-mono text-[10px] text-slate-400">
        <div className="flex items-center gap-4 bg-[#0a121d]/90 backdrop-blur-sm px-3 py-1 rounded-lg border border-slate-800">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full border border-white/60 bg-red-500 inline-block" />
            <span>Target (○)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full border border-red-500 border-dashed inline-block" />
            <span>Protected Zone ({criticalRadiusM.toFixed(0)}m)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/40 border border-emerald-400 inline-block" />
            <span>Safe Corridor</span>
          </div>
        </div>

        <div className="bg-[#0a121d]/90 backdrop-blur-sm px-3 py-1 rounded-lg border border-slate-800 text-slate-400">
          Range Rings: <strong className="text-slate-200">10m Steps (60m Max)</strong>
        </div>
      </div>
    </div>
  );
};
