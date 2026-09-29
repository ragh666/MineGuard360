import React, { useMemo } from "react";
import { RawRadarData, RawEnvironmentData, SafetyState } from "../data/types";
import { updateOccupancyGrid } from "../safety/occupancyGrid";
import { generateSafeCorridorPath } from "../safety/safeCorridorGenerator";

interface TopDownRealisticHUDProps {
  radar: RawRadarData;
  environment: RawEnvironmentData;
  speedMps: number | null;
  stoppingDistanceM: number | null;
  requiredStoppingDistanceM: number | null;
  safetyState: SafetyState;
  blindCurve?: boolean;
  blockId?: string;
  sensorVisualMode?: "Standard" | "Thermal" | "LiDAR";
  fogDensityPercent?: number;
  visibilityMeters?: number;
}

export const TopDownRealisticHUD: React.FC<TopDownRealisticHUDProps> = ({
  radar,
  environment,
  speedMps,
  stoppingDistanceM,
  requiredStoppingDistanceM,
  safetyState,
  blindCurve = false,
  blockId = "B1",
  sensorVisualMode = "Standard",
  fogDensityPercent = 87,
  visibilityMeters = 9.1,
}) => {
  const isCurve = blockId === "B1" || blindCurve;
  const isNarrow = blockId === "B2";
  const currentVisM = environment.visibilityMeters ?? visibilityMeters ?? 9.1;

  const { grid, safePath } = useMemo(() => {
    const gridObj = updateOccupancyGrid(radar);
    const pathObj = generateSafeCorridorPath(
      gridObj,
      isNarrow ? 1.8 : 2.5,
      requiredStoppingDistanceM ?? 20,
      isCurve ? -0.8 : 0,
      currentVisM
    );
    return { grid: gridObj, safePath: pathObj };
  }, [radar, requiredStoppingDistanceM, isCurve, isNarrow, currentVisM]);

  // Viewport Mapping
  const canvasW = 800;
  const canvasH = 600;
  const pixelsPerMeter = 9; // zoom level
  const maxVisibleDist = 55;
  const roadWidthM = isNarrow ? 4.5 : 7.5;

  const mapX = (xM: number) => canvasW / 2 + (xM * pixelsPerMeter);
  const mapY = (yM: number) => canvasH - 60 - (yM * pixelsPerMeter);

  // Generate Road Geometry
  const roadPts = [];
  for (let yM = 0; yM <= maxVisibleDist; yM += 2) {
    let xOff = 0;
    if (isCurve && yM > 10) xOff = -((yM - 10) * (yM - 10) * 0.007);
    roadPts.push({ yM, xOff });
  }

  // Layer 2 & 3: Road & Boundaries
  const leftEdge = roadPts.map(p => ({ x: mapX(p.xOff - roadWidthM), y: mapY(p.yM) }));
  const rightEdge = roadPts.map(p => ({ x: mapX(p.xOff + roadWidthM), y: mapY(p.yM) }));
  
  const roadPolygonD = `
    ${leftEdge.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x},${p.y}`).join(" ")}
    ${rightEdge.slice().reverse().map(p => `L ${p.x},${p.y}`).join(" ")}
    Z
  `;

  // Layer 5 & 6: Safe Corridor and Blocked Path
  const safeLeft = safePath.leftBoundary.map(p => ({ x: mapX(p.x), y: mapY(p.y) }));
  const safeRight = safePath.rightBoundary.map(p => ({ x: mapX(p.x), y: mapY(p.y) }));
  
  const safeCorridorPolygonD = safeLeft.length > 0 ? `
    ${safeLeft.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x},${p.y}`).join(" ")}
    ${safeRight.slice().reverse().map(p => `L ${p.x},${p.y}`).join(" ")}
    Z
  ` : "";

  const centerLinePts = safePath.leftBoundary.map(p => ({ x: mapX((p.x + safePath.rightBoundary.find(r => r.y === p.y)!.x) / 2), y: mapY(p.y) }));
  const centerLineD = centerLinePts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x},${p.y}`).join(" ");

  // Colors based on state
  const getSafeCorridorColor = () => {
    if (safetyState === "CRITICAL" || safetyState === "EMERGENCY") return "rgba(239, 68, 68, 0.7)"; // RED
    if (safetyState === "WARNING") return "rgba(249, 115, 22, 0.6)"; // ORANGE
    if (safetyState === "CAUTION") return "rgba(234, 179, 8, 0.5)"; // YELLOW
    return "rgba(16, 185, 129, 0.5)"; // GREEN
  };

  return (
    <div className="w-full h-full bg-[#0f172a] rounded-2xl relative overflow-hidden border-2 border-[#1e293b] shadow-[inset_0_0_50px_rgba(0,0,0,0.8)]">
      <svg viewBox={`0 0 ${canvasW} ${canvasH}`} className="w-full h-full">
        
        <defs>
          <pattern id="dirt" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <rect width="40" height="40" fill="#292524" />
            <circle cx="10" cy="10" r="1" fill="#44403c" />
            <circle cx="30" cy="25" r="1.5" fill="#44403c" />
            <circle cx="15" cy="35" r="0.5" fill="#57534e" />
          </pattern>
          <pattern id="highwall" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <rect width="20" height="20" fill="#1c1917" />
            <path d="M0 10 L20 10 M10 0 L10 20" stroke="#292524" strokeWidth="2" />
          </pattern>
          <pattern id="blockedHatch" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="10" stroke="#7f1d1d" strokeWidth="3" opacity="0.4" />
          </pattern>
        </defs>

        {/* Base Layer: Highwall / Unknown */}
        <rect width={canvasW} height={canvasH} fill="url(#highwall)" />

        {/* Layer 2: Actual Road Surface */}
        <path d={roadPolygonD} fill="url(#dirt)" stroke="#44403c" strokeWidth="4" />
        {/* Layer 3: Road Boundaries (Inner glowing edges) */}
        <path d={leftEdge.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x},${p.y}`).join(" ")} stroke="#eab308" strokeWidth="2" fill="none" opacity="0.6" strokeDasharray="10 5" />
        <path d={rightEdge.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x},${p.y}`).join(" ")} stroke="#eab308" strokeWidth="2" fill="none" opacity="0.6" strokeDasharray="10 5" />

        {/* Layer 6: Unsafe Regions (Whole road is marked as unsafe blocked hatch, then overridden by safe corridor) */}
        <path d={roadPolygonD} fill="url(#blockedHatch)" />

        {/* Layer 5: Safe Corridor */}
        {safeCorridorPolygonD && (
          <path 
            d={safeCorridorPolygonD} 
            fill={getSafeCorridorColor()} 
            stroke={getSafeCorridorColor().replace("0.5", "1").replace("0.6", "1").replace("0.7", "1")} 
            strokeWidth="3" 
            style={{ filter: "drop-shadow(0 0 10px rgba(16, 185, 129, 0.4))" }}
          />
        )}

        {/* Layer 7: Direction of Travel Centerline */}
        {centerLineD && (
          <path 
            d={centerLineD} 
            stroke="rgba(255,255,255,0.7)" 
            strokeWidth="2" 
            fill="none" 
            strokeDasharray="8 8" 
          />
        )}

        {/* Layer 4 & 8: Detected Obstacles and Telemetry */}
        {grid.targets.map((tgt, idx) => {
          const tx = mapX(tgt.xM);
          const ty = mapY(tgt.yM);
          
          let icon = null;
          const boxW = 30;
          const boxH = tgt.obstacleClass === "HEMM" ? 50 : 30;
          
          if (tgt.obstacleClass === "HEMM" || tgt.obstacleClass === "VEHICLE") {
            icon = (
              <g transform={`translate(${tx}, ${ty})`}>
                <rect x={-boxW/2} y={-boxH/2} width={boxW} height={boxH} fill="#dc2626" rx="4" />
                <rect x={-boxW/2+4} y={-boxH/2+4} width={boxW-8} height={boxH-20} fill="#7f1d1d" />
                {/* Radar Ring */}
                <circle cx="0" cy="0" r="40" fill="none" stroke="#dc2626" strokeWidth="1" strokeDasharray="4 4" opacity="0.5">
                  <animate attributeName="r" values="20;50" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.8;0" dur="2s" repeatCount="indefinite" />
                </circle>
              </g>
            );
          } else if (tgt.obstacleClass === "PERSON") {
            icon = (
              <g transform={`translate(${tx}, ${ty})`}>
                <circle cx="0" cy="0" r="8" fill="#f97316" />
                <circle cx="0" cy="0" r="25" fill="none" stroke="#f97316" strokeWidth="1" opacity="0.5" />
              </g>
            );
          } else {
            // ROCK / OTHER
            icon = (
              <g transform={`translate(${tx}, ${ty})`}>
                <path d="M-10,10 L-15,0 L-5,-10 L10,-8 L15,5 Z" fill="#64748b" stroke="#94a3b8" strokeWidth="2" />
              </g>
            );
          }

          const ttc = (tgt.relativeVelocityMps ?? 0) < -0.1 ? (tgt.distanceM / Math.abs(tgt.relativeVelocityMps!)).toFixed(1) + " s" : "---";
          const tagColor = tgt.distanceM < 25 ? "#ef4444" : "#eab308";

          return (
            <g key={tgt.id || idx}>
              {icon}
              {/* Telemetry Tag */}
              <g transform={`translate(${tx + 20}, ${ty - 20})`}>
                <line x1="-20" y1="20" x2="0" y2="0" stroke={tagColor} strokeWidth="1.5" />
                <rect x="0" y="-20" width="85" height="35" fill="rgba(15, 23, 42, 0.9)" stroke={tagColor} strokeWidth="1" rx="2" />
                <text x="5" y="-6" fill="#f8fafc" fontSize="10" fontWeight="bold">{tgt.obstacleClass}</text>
                <text x="5" y="8" fill={tagColor} fontSize="10" fontWeight="bold">D: {tgt.distanceM.toFixed(1)}m | TTC: {ttc}</text>
              </g>
            </g>
          );
        })}

        {/* Layer 1: HEMM Ego Vehicle */}
        <g transform={`translate(${mapX(0)}, ${mapY(0)})`}>
          {/* Main Body */}
          <rect x="-20" y="-35" width="40" height="70" fill="#ca8a04" rx="4" />
          {/* Bed */}
          <rect x="-18" y="-10" width="36" height="40" fill="#3f3f46" rx="2" />
          <rect x="-14" y="-5" width="28" height="30" fill="#27272a" />
          {/* Cabin */}
          <rect x="-10" y="-25" width="20" height="12" fill="#0284c7" rx="2" />
          {/* Tires */}
          <rect x="-24" y="-20" width="8" height="16" fill="#171717" rx="2" />
          <rect x="16" y="-20" width="8" height="16" fill="#171717" rx="2" />
          <rect x="-24" y="10" width="8" height="16" fill="#171717" rx="2" />
          <rect x="16" y="10" width="8" height="16" fill="#171717" rx="2" />
          
          {/* Forward projection arc */}
          <path d="M-40,-50 A 60 60 0 0 1 40,-50" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="5 5" />
        </g>
      </svg>
      
      {/* HUD Info Overlay */}
      <div className="absolute top-4 left-4 bg-slate-900/80 border border-slate-700 p-2 rounded shadow-lg backdrop-blur-sm pointer-events-none">
        <div className="text-slate-400 text-[10px] font-mono font-bold tracking-widest mb-1">VISUALIZATION MODE</div>
        <div className="text-cyan-400 text-sm font-mono font-bold">TOP-DOWN INDUSTRIAL (2D)</div>
        <div className="flex items-center gap-2 mt-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500"></div><span className="text-xs text-slate-300">SAFE</span>
          <div className="w-3 h-3 rounded-full bg-orange-500 ml-2"></div><span className="text-xs text-slate-300">WARN</span>
          <div className="w-3 h-3 rounded-full bg-red-500 ml-2"></div><span className="text-xs text-slate-300">BLOCK</span>
        </div>
      </div>
    </div>
  );
};
