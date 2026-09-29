import React, { useMemo } from "react";
import { RawRadarData, RawEnvironmentData, SafetyState } from "../data/types";
import { updateOccupancyGrid } from "../safety/occupancyGrid";
import { generateSafeCorridorPath } from "../safety/safeCorridorGenerator";
import {
  HemmDumperIcon,
  RockIcon,
  PersonIcon,
  VehicleIcon,
  UnknownObstacleIcon,
  HighwallEdgeIcon,
} from "./icons/MiningIcons";

interface TopDownSafetyCorridorHUDProps {
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

export const TopDownSafetyCorridorHUD: React.FC<TopDownSafetyCorridorHUDProps> = ({
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
  const isJunction = blockId === "B3";
  const isHighwall = blockId === "B4";

  const currentVisM = environment.visibilityMeters ?? visibilityMeters ?? 9.1;

  // Step 1: Update Local Occupancy Grid & Generate Safe Path
  const { grid, safePath } = useMemo(() => {
    const gridObj = updateOccupancyGrid(radar);
    const pathObj = generateSafeCorridorPath(
      gridObj,
      isNarrow ? 1.8 : 2.5,
      requiredStoppingDistanceM ?? 20,
      isCurve ? -0.8 : isHighwall ? -0.5 : 0,
      currentVisM
    );
    return { grid: gridObj, safePath: pathObj };
  }, [radar, requiredStoppingDistanceM, isCurve, isNarrow, isHighwall, currentVisM]);

  // Canvas Top-Down Dimensions
  const viewW = 400;
  const viewH = 600;
  
  // Coordinate Mapping (Meters to Pixels)
  // X range: -15m to +15m -> 400px (13.33 px/m)
  // Y range: -5m (behind) to 55m (ahead) -> 600px (10 px/m)
  const mapX = (xM: number) => (viewW / 2) + (xM * 13.33);
  const mapY = (yM: number) => viewH - ((yM + 5) * 10);

  // Build Road Boundaries
  const roadWidthM = isNarrow ? 4.5 : 7.5;
  const maxViewDist = 55;

  const getRoadPoints = (side: "left" | "right") => {
    const pts = [];
    const sign = side === "left" ? -1 : 1;
    for (let y = -5; y <= maxViewDist; y += 5) {
      let x = roadWidthM * sign;
      if (isCurve && y > 10) {
        x += sign * 0.5 - ((y - 10) * 0.15); // curve left
      }
      if (isJunction && y > 20 && y < 35) {
        x += sign * 4; // widen for junction
      }
      pts.push(`${mapX(x)},${mapY(y)}`);
    }
    return pts.join(" ");
  };

  const roadLeftPoly = getRoadPoints("left");
  const roadRightPoly = getRoadPoints("right");
  const roadPolygon = `M ${roadLeftPoly} L ${roadRightPoly.split(" ").reverse().join(" ")} Z`;

  // Build Safe Path SVG Polygon
  const leftBoundaryPts = safePath.leftBoundary.map((p) => `${mapX(p.x)},${mapY(p.y)}`);
  const rightBoundaryPts = safePath.rightBoundary.map((p) => `${mapX(p.x)},${mapY(p.y)}`);

  let pathPolygonD = "";
  if (leftBoundaryPts.length > 0 && rightBoundaryPts.length > 0) {
    const forwardLeft = leftBoundaryPts.map((p, i) => `${i === 0 ? "M" : "L"} ${p}`).join(" ");
    const reverseRight = rightBoundaryPts.slice().reverse().map((p) => `L ${p}`).join(" ");
    pathPolygonD = `${forwardLeft} ${reverseRight} Z`;
  }

  // Path Color & Styling Based on Corridor Status & Safety State
  const getPathStyle = () => {
    if (safetyState === "FAULT" || safePath.status === "UNKNOWN") {
      return { fill: "url(#hatchedPattern)", stroke: "#6B7280" };
    }
    if (safetyState === "EMERGENCY" || safetyState === "CRITICAL" || safePath.status === "BLOCKED") {
      return { fill: "rgba(239, 68, 68, 0.4)", stroke: "#ef4444" };
    }
    if (safePath.status === "CAUTION" || safetyState === "WARNING" || safetyState === "CAUTION") {
      return { fill: "rgba(245, 158, 11, 0.35)", stroke: "#f59e0b" };
    }
    return { fill: "rgba(16, 185, 129, 0.35)", stroke: "#10b981" };
  };

  const pathStyle = getPathStyle();

  const getObstacleIcon = (cls: string, size = 24) => {
    switch (cls) {
      case "HEMM": return (
        <image 
          href="/hemm_real.png" 
          width={size * 1.8} 
          height={size * 1.8} 
          x={-(size * 1.8)/2} 
          y={-(size * 1.8)/2} 
          preserveAspectRatio="xMidYMid slice" 
        />
      );
      case "ROCK": return <RockIcon size={size} />;
      case "PERSON": return <PersonIcon size={size} />;
      case "VEHICLE": return <VehicleIcon size={size} />;
      case "EDGE": return <HighwallEdgeIcon size={size} />;
      default: return <UnknownObstacleIcon size={size} />;
    }
  };

  const fogYPx = mapY(Math.max(2, currentVisM));

  return (
    <div className="bg-[#050B14] border border-[#1e3448] rounded-2xl p-2 shadow-2xl relative overflow-hidden flex flex-col justify-center items-center h-full min-h-[420px] w-full">
      
      <svg viewBox={`0 0 ${viewW} ${viewH}`} className="w-full h-full max-w-[400px]" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="fogGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#050B14" stopOpacity="1" />
            <stop offset="80%" stopColor="#050B14" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#050B14" stopOpacity="0.0" />
          </linearGradient>

          <pattern id="hatchedPattern" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="10" stroke="#6B7280" strokeWidth="3" opacity="0.6" />
          </pattern>
        </defs>

        {/* Background Grid */}
        {[0, 10, 20, 30, 40, 50].map(y => (
          <line key={`gy-${y}`} x1="0" y1={mapY(y)} x2={viewW} y2={mapY(y)} stroke="#1e293b" strokeWidth="1" strokeDasharray="4 4" />
        ))}
        {[-10, -5, 0, 5, 10].map(x => (
          <line key={`gx-${x}`} x1={mapX(x)} y1="0" x2={mapX(x)} y2={viewH} stroke="#1e293b" strokeWidth="1" strokeDasharray="4 4" />
        ))}

        {/* Road Surface */}
        <path d={roadPolygon} fill="#0F172A" stroke="#334155" strokeWidth="2" />
        
        {/* Road Centerline */}
        <path d={`M ${mapX(0)} ${mapY(-5)} L ${mapX(isCurve ? -5 : 0)} ${mapY(55)}`} stroke="#cbd5e1" strokeWidth="2" strokeDasharray="10 10" opacity="0.3" fill="none" />

        {/* Safe Corridor */}
        {pathPolygonD && (
          <path d={pathPolygonD} fill={pathStyle.fill} stroke={pathStyle.stroke} strokeWidth="3" />
        )}

        {/* Required Stopping Distance Marker */}
        {requiredStoppingDistanceM !== null && (
          <line 
            x1={mapX(-roadWidthM)} y1={mapY(requiredStoppingDistanceM)} 
            x2={mapX(roadWidthM)} y2={mapY(requiredStoppingDistanceM)} 
            stroke="#ef4444" strokeWidth="2" strokeDasharray="6 4" 
          />
        )}

        {/* Fog Mask (Top-Down) */}
        {(fogDensityPercent ?? 87) > 10 && (
          <rect
            x="0"
            y="0"
            width={viewW}
            height={fogYPx}
            fill="url(#fogGradient)"
            style={{ pointerEvents: "none" }}
          />
        )}

        {/* Targets / Obstacles */}
        {grid.targets.map((tgt, idx) => (
          <g key={tgt.id || idx} transform={`translate(${mapX(tgt.xM)}, ${mapY(tgt.yM)})`}>
            <circle cx="0" cy="0" r="16" fill="rgba(239,68,68,0.2)" stroke="#ef4444" strokeWidth="1.5" />
            <g className="text-red-400" transform="translate(-12, -12)">
              {getObstacleIcon(tgt.obstacleClass || "UNKNOWN", 24)}
            </g>
            <text x="20" y="4" fill="#fca5a5" fontSize="12" fontFamily="monospace" fontWeight="bold">
              {tgt.obstacleClass || "TARGET"}
            </text>
          </g>
        ))}

        {/* Ego Vehicle (Bottom Center) */}
        <g transform={`translate(${mapX(0)}, ${mapY(0)})`}>
          <image 
            href="/hemm_real.png" 
            width="70" 
            height="70" 
            x="-35" 
            y="-35" 
            preserveAspectRatio="xMidYMid slice"
            style={{ filter: "drop-shadow(0px 10px 10px rgba(0,0,0,0.5))" }}
          />
        </g>
      </svg>
      
      {/* Corner Labels */}
      <div className="absolute top-3 left-3 text-[10px] font-mono text-slate-400">
        SCALE: 10m grid
      </div>
      <div className="absolute top-3 right-3 text-[10px] font-mono text-slate-400 text-right">
        RADAR: {radar.distanceM !== null ? "TRACKING" : "CLEAR"}
      </div>
    </div>
  );
};
