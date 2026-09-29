import React, { useMemo } from "react";
import { RawRadarData, RawEnvironmentData, SafetyState } from "../data/types";
import { updateOccupancyGrid } from "../safety/occupancyGrid";
import { generateSafeCorridorPath } from "../safety/safeCorridorGenerator";
import { useTranslation } from "../context/LanguageContext";

interface PerspectiveSafetyCorridorHUDProps {
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

export const PerspectiveSafetyCorridorHUD: React.FC<PerspectiveSafetyCorridorHUDProps> = ({
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
  const { t } = useTranslation();
  const isCurve = (blockId === "B1" || blindCurve) && (radar.angleDeg ?? 0) !== 0;
  const isNarrow = blockId === "B2";
  const currentVisM = environment.visibilityMeters ?? visibilityMeters ?? 9.1;

  const { grid, safePath } = useMemo(() => {
    const gridObj = updateOccupancyGrid(radar);
    const pathObj = generateSafeCorridorPath(
      gridObj,
      isNarrow ? 1.8 : 2.6,
      requiredStoppingDistanceM ?? 22,
      isCurve ? -0.7 : 0,
      currentVisM
    );
    return { grid: gridObj, safePath: pathObj };
  }, [radar, requiredStoppingDistanceM, isCurve, isNarrow, currentVisM]);

  // Perspective 3D Camera Constants (Realistic Driver View looking far ahead)
  const canvasW = 800;
  const canvasH = 600;
  const horizonY = 165; // realistic driver eye-line horizon
  const cameraZ = 2.4;  // eye height above haul road in meters (HEMM cabin height)
  const scaleF = 820;   // focal scale
  const maxDist = 120;  // 120m long-view distance

  // Perspective 3D Projection with height zM
  const project3D = (xM: number, yM: number, zM: number = 0) => {
    const z = Math.max(0.6, yM);
    const scale = scaleF / z;
    const px = canvasW / 2 + xM * scale;
    const py = horizonY + (cameraZ - zM) * scale;
    return { x: px, y: py, scale };
  };

  // Road Curve Offset helper for realistic winding mine haul road
  const getCurveX = (yM: number) => {
    if (!isCurve) return 0;
    if (yM < 8) return 0;
    // Gradual curve to the left starting after 8m
    return -Math.pow((yM - 8) * 0.05, 1.85);
  };

  // Determine Safe Path colors based on safety state
  const getPathTheme = () => {
    switch (safetyState) {
      case "EMERGENCY":
      case "CRITICAL":
        return {
          glow: "#ef4444",
          fillGrad: ["rgba(239, 68, 68, 0.45)", "rgba(220, 38, 38, 0.15)"],
          border: "#f87171",
          centerLine: "#fca5a5",
          cubeStroke: "#ef4444",
          cubeFill: "rgba(239, 68, 68, 0.22)",
          statusText: "CRITICAL: OBSTACLE COLLISION IMMINENT",
        };
      case "WARNING":
      case "CAUTION":
        return {
          glow: "#f59e0b",
          fillGrad: ["rgba(245, 158, 11, 0.4)", "rgba(217, 119, 6, 0.12)"],
          border: "#fbbf24",
          centerLine: "#fde68a",
          cubeStroke: "#f59e0b",
          cubeFill: "rgba(245, 158, 11, 0.20)",
          statusText: "CAUTION: HAZARD ENVELOPE IN PATH",
        };
      case "FAULT":
        return {
          glow: "#94a3b8",
          fillGrad: ["rgba(100, 116, 139, 0.35)", "rgba(71, 85, 105, 0.1)"],
          border: "#94a3b8",
          centerLine: "#cbd5e1",
          cubeStroke: "#94a3b8",
          cubeFill: "rgba(100, 116, 139, 0.2)",
          statusText: "SYSTEM FAULT - NAVIGATION RESTRICTED",
        };
      default:
        return {
          glow: "#10b981",
          fillGrad: ["rgba(16, 185, 129, 0.38)", "rgba(5, 150, 105, 0.12)"],
          border: "#34d399",
          centerLine: "#6ee7b7",
          cubeStroke: "#06b6d4",
          cubeFill: "rgba(6, 182, 212, 0.18)",
          statusText: "PATH CLEAR: COLLISION CORRIDOR NORMAL",
        };
    }
  };

  const theme = getPathTheme();
  const isDangerous =
    safetyState === "CRITICAL" ||
    safetyState === "EMERGENCY" ||
    safetyState === "WARNING" ||
    safetyState === "CAUTION";

  // Build Haul Road Geometry (Wide mining road 14m wide)
  const roadHalfWidthM = isNarrow ? 4.8 : 7.2;
  const roadSteps = [1.2, 4, 8, 14, 22, 32, 45, 60, 80, 100, 120];

  const roadLeftEdge = roadSteps.map((y) => project3D(-roadHalfWidthM + getCurveX(y), y));
  const roadRightEdge = roadSteps.map((y) => project3D(roadHalfWidthM + getCurveX(y), y));

  const roadBedPolygonD = `
    M ${roadLeftEdge[0].x},${roadLeftEdge[0].y}
    ${roadLeftEdge.slice(1).map((p) => `L ${p.x},${p.y}`).join(" ")}
    L ${roadRightEdge[roadRightEdge.length - 1].x},${roadRightEdge[roadRightEdge.length - 1].y}
    ${roadRightEdge.slice().reverse().map((p) => `L ${p.x},${p.y}`).join(" ")}
    Z
  `;

  // Left & Right Mine Berms (rock walls bounding the haul road)
  const leftBermOuter = roadSteps.map((y) => project3D(-roadHalfWidthM - 4.5 + getCurveX(y), y, 1.2));
  const rightBermOuter = roadSteps.map((y) => project3D(roadHalfWidthM + 4.5 + getCurveX(y), y, 1.2));

  const leftBermPolygonD = `
    M ${roadLeftEdge[0].x},${roadLeftEdge[0].y}
    ${roadLeftEdge.map((p) => `L ${p.x},${p.y}`).join(" ")}
    L ${leftBermOuter[leftBermOuter.length - 1].x},${leftBermOuter[leftBermOuter.length - 1].y}
    ${leftBermOuter.slice().reverse().map((p) => `L ${p.x},${p.y}`).join(" ")}
    Z
  `;

  const rightBermPolygonD = `
    M ${roadRightEdge[0].x},${roadRightEdge[0].y}
    ${roadRightEdge.map((p) => `L ${p.x},${p.y}`).join(" ")}
    L ${rightBermOuter[rightBermOuter.length - 1].x},${rightBermOuter[rightBermOuter.length - 1].y}
    ${rightBermOuter.slice().reverse().map((p) => `L ${p.x},${p.y}`).join(" ")}
    Z
  `;

  // Safe Corridor Path Construction (Extended smooth ribbon over the road)
  let safePolygonD = "";
  let centerLineD = "";
  let chevrons: Array<{ x: number; y: number; scale: number }> = [];

  if (safePath.leftBoundary.length > 0 && safePath.rightBoundary.length > 0) {
    const leftPoints = safePath.leftBoundary.map((p) => {
      const cx = getCurveX(p.y);
      return project3D(p.x + cx, p.y);
    });

    const rightPoints = safePath.rightBoundary.map((p) => {
      const cx = getCurveX(p.y);
      return project3D(p.x + cx, p.y);
    });

    const leftStr = leftPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x},${p.y}`).join(" ");
    const rightStr = rightPoints
      .slice()
      .reverse()
      .map((p) => `L ${p.x},${p.y}`)
      .join(" ");

    safePolygonD = `${leftStr} ${rightStr} Z`;

    // Centerline points
    const centerPoints = safePath.leftBoundary.map((lp, i) => {
      const rp = safePath.rightBoundary[i] || lp;
      const midX = (lp.x + rp.x) / 2 + getCurveX(lp.y);
      return project3D(midX, lp.y);
    });

    centerLineD = centerPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x},${p.y}`).join(" ");

    // Perspective guidance chevrons placed every 6 meters along the corridor
    chevrons = [6, 12, 18, 26, 36, 48, 62, 78, 96]
      .filter((y) => y <= (requiredStoppingDistanceM ? requiredStoppingDistanceM * 1.5 : 80))
      .map((y) => {
        const cx = getCurveX(y);
        return project3D(cx, y);
      });
  }

  // Radar Hazard Detection Obstacles List:
  // When in SAFE state and radar distance is clear (>= 50m), no obstacles in path.
  // In hazard/warning conditions, 77 GHz radar detects an unclassified reflector centroid,
  // represented as a glowing 3D SPHERE hazard target.
  interface RadarSphereObstacle {
    id: string;
    xM: number;
    yM: number;
    radiusM: number;
    elevationM: number;
    isPrimary: boolean;
  }

  const primaryDist = radar.distanceM ?? 80;
  const primaryAngle = radar.angleDeg ?? 0;
  const primaryRad = (primaryAngle * Math.PI) / 180;
  const primaryX = primaryDist * Math.sin(primaryRad);
  const primaryY = Math.max(4, primaryDist * Math.cos(primaryRad));

  const isSafeState = safetyState === "SAFE";
  const hasObstacle = !isSafeState || (radar.distanceM !== null && radar.distanceM < 50);

  const obstacles: RadarSphereObstacle[] = hasObstacle
    ? [
        {
          id: "PRIMARY_SPHERE",
          xM: primaryX,
          yM: primaryY,
          radiusM: 1.3,
          elevationM: 1.4,
          isPrimary: true,
        },
        ...(isCurve
          ? [
              {
                id: "SECONDARY_SPHERE",
                xM: -2.2,
                yM: Math.max(primaryY + 28, 54),
                radiusM: 0.9,
                elevationM: 1.1,
                isPrimary: false,
              },
            ]
          : []),
      ]
    : [];

  // Helper to render glowing 3D Radar Detection SPHERE on haul road
  const renderSphereRadarTarget = (obs: RadarSphereObstacle) => {
    const cx = getCurveX(obs.yM);
    const ox = obs.xM + cx;
    const oy = obs.yM;

    // Ground position and sphere center position in 2D perspective space
    const groundPos = project3D(ox, oy, 0);
    const spherePos = project3D(ox, oy, obs.elevationM);
    const scale = groundPos.scale;

    // Sphere radius scaled with perspective (bounded for clean visibility)
    const sphereRadius = Math.max(14, Math.min(52, obs.radiusM * scale * 0.9));
    const groundRadiusX = Math.max(18, sphereRadius * 1.35);
    const groundRadiusY = Math.max(7, groundRadiusX * 0.35);

    // Risk category: Critical (red), Caution (amber), Nominal (cyan)
    const isCritical = safetyState === "CRITICAL" || safetyState === "EMERGENCY" || obs.yM < 25;
    const isCaution = safetyState === "CAUTION" || safetyState === "WARNING" || obs.yM < 45;

    const sphereGradient = isCritical
      ? "url(#sphereGradRed)"
      : isCaution
      ? "url(#sphereGradAmber)"
      : "url(#sphereGradCyan)";

    const strokeColor = isCritical ? "#ef4444" : isCaution ? "#f59e0b" : "#06b6d4";
    const glowColor = isCritical ? "rgba(239, 68, 68, 0.4)" : isCaution ? "rgba(245, 158, 11, 0.35)" : "rgba(6, 182, 212, 0.3)";

    return (
      <g key={obs.id} className="transition-all duration-300">
        {/* 1. Ground Circular Radar Projection & Ripple on Road Surface */}
        <ellipse
          cx={groundPos.x}
          cy={groundPos.y}
          rx={groundRadiusX}
          ry={groundRadiusY}
          fill={glowColor}
          stroke={strokeColor}
          strokeWidth="2.5"
          strokeDasharray="4 3"
        />
        {/* Pulsing Ripple Ring on Ground */}
        <ellipse
          cx={groundPos.x}
          cy={groundPos.y}
          rx={groundRadiusX * 1.35}
          ry={groundRadiusY * 1.35}
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.5"
          opacity="0.5"
        >
          <animate
            attributeName="rx"
            values={`${groundRadiusX};${groundRadiusX * 1.6}`}
            dur="1.6s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="ry"
            values={`${groundRadiusY};${groundRadiusY * 1.6}`}
            dur="1.6s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.7;0"
            dur="1.6s"
            repeatCount="indefinite"
          />
        </ellipse>

        {/* 2. Vertical Radar Anchor Line from Ground to Sphere */}
        <line
          x1={groundPos.x}
          y1={groundPos.y}
          x2={spherePos.x}
          y2={spherePos.y}
          stroke={strokeColor}
          strokeWidth="2"
          strokeDasharray="3 3"
          opacity="0.8"
        />

        {/* 3. The 3D Glowing Radar Hazard SPHERE */}
        {/* Outer Glow filter behind sphere */}
        <circle
          cx={spherePos.x}
          cy={spherePos.y}
          r={sphereRadius * 1.15}
          fill={strokeColor}
          opacity="0.25"
          filter="url(#neonGlow)"
        />

        {/* Main 3D Shaded Sphere */}
        <circle
          cx={spherePos.x}
          cy={spherePos.y}
          r={sphereRadius}
          fill={sphereGradient}
          stroke={strokeColor}
          strokeWidth="2"
          style={{ filter: "drop-shadow(0 6px 12px rgba(0, 0, 0, 0.7))" }}
        />

        {/* 3D Wireframe Equator / Latitude ring */}
        <ellipse
          cx={spherePos.x}
          cy={spherePos.y}
          rx={sphereRadius}
          ry={sphereRadius * 0.38}
          fill="none"
          stroke="rgba(255, 255, 255, 0.45)"
          strokeWidth="1.2"
        />

        {/* 3D Wireframe Longitude ring */}
        <ellipse
          cx={spherePos.x}
          cy={spherePos.y}
          rx={sphereRadius * 0.38}
          ry={sphereRadius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.35)"
          strokeWidth="1.2"
        />

        {/* Specular Highlight Sheen on Sphere */}
        <circle
          cx={spherePos.x - sphereRadius * 0.35}
          cy={spherePos.y - sphereRadius * 0.35}
          r={sphereRadius * 0.22}
          fill="#ffffff"
          opacity="0.75"
        />

        {/* 4. Safety Stopping / Avoidance Line on Road in front of the Sphere */}
        {obs.isPrimary && (
          <g>
            <line
              x1={groundPos.x - groundRadiusX * 1.4}
              y1={groundPos.y + 6}
              x2={groundPos.x + groundRadiusX * 1.4}
              y2={groundPos.y + 6}
              stroke={strokeColor}
              strokeWidth="4"
              strokeDasharray="6 3"
              style={{ filter: `drop-shadow(0 0 6px ${strokeColor})` }}
            />
          </g>
        )}

        {/* 5. Driver-Friendly Big Distance Callout Badge */}
        {/* High contrast, large bold number so operators immediately grasp distance & danger */}
        <g transform={`translate(${spherePos.x}, ${spherePos.y - sphereRadius - 16})`}>
          {/* Connector Line */}
          <line x1="0" y1="16" x2="0" y2="4" stroke={strokeColor} strokeWidth="2" />

          {/* Badge Background Pill */}
          <rect
            x="-44"
            y="-16"
            width="88"
            height="26"
            rx="13"
            fill="rgba(8, 14, 26, 0.95)"
            stroke={strokeColor}
            strokeWidth="2"
            style={{ filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.8))" }}
          />

          {/* Distance Text - Big, High-Legibility Monospace */}
          <text
            x="0"
            y="2"
            fill={isCritical ? "#f87171" : isCaution ? "#fde047" : "#67e8f9"}
            fontSize="14"
            fontWeight="900"
            fontFamily="monospace"
            textAnchor="middle"
            letterSpacing="0.5"
          >
            {obs.yM.toFixed(0)}m
          </text>
        </g>
      </g>
    );
  };

  // Roadside Distance Markers & Reflector Posts (receding into the distance)
  const distanceMarkers = [10, 20, 30, 40, 50, 70, 90, 110];

  return (
    <div className="w-full h-full bg-[#0a0f1d] rounded-2xl relative overflow-hidden border-2 border-[#1e293b] shadow-2xl flex items-center justify-center select-none">
      <svg viewBox={`0 0 ${canvasW} ${canvasH}`} className="w-full h-full" preserveAspectRatio="xMidYMid slice">
        <defs>
          {/* Safe Corridor Dynamic Gradient Fill */}
          <linearGradient id="corridorGrad" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor={theme.fillGrad[0]} />
            <stop offset="65%" stopColor={theme.fillGrad[1]} />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </linearGradient>

          {/* Smooth Haul Road / Highway Bed Gradient */}
          <linearGradient id="haulRoadGrad" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="35%" stopColor="#172033" />
            <stop offset="70%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#090d16" />
          </linearGradient>

          {/* Left/Right Rock Berm Gradients */}
          <linearGradient id="leftBermGrad" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#292019" />
            <stop offset="100%" stopColor="#0d0b09" />
          </linearGradient>
          <linearGradient id="rightBermGrad" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#221b15" />
            <stop offset="100%" stopColor="#0a0907" />
          </linearGradient>

          {/* Open Pit Mine Mountain Silhouette Gradient */}
          <linearGradient id="mountainSkyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#050811" />
            <stop offset="70%" stopColor="#0e172a" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>

          {/* Depth Fog Gradient */}
          <linearGradient id="depthFogGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(15, 23, 42, 0.96)" />
            <stop offset="50%" stopColor="rgba(15, 23, 42, 0.75)" />
            <stop offset="100%" stopColor="rgba(15, 23, 42, 0)" />
          </linearGradient>

          {/* Filter for glowing corridor lines */}
          <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* 3D Sphere Shading Gradients for Unclassified Radar Hazard Targets */}
          <radialGradient id="sphereGradRed" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="25%" stopColor="#f87171" />
            <stop offset="70%" stopColor="#dc2626" />
            <stop offset="100%" stopColor="#7f1d1d" />
          </radialGradient>
          <radialGradient id="sphereGradAmber" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="25%" stopColor="#fde047" />
            <stop offset="70%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#78350f" />
          </radialGradient>
          <radialGradient id="sphereGradCyan" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="25%" stopColor="#67e8f9" />
            <stop offset="70%" stopColor="#0891b2" />
            <stop offset="100%" stopColor="#164e63" />
          </radialGradient>
          <radialGradient id="sphereGradGreen" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="25%" stopColor="#86efac" />
            <stop offset="70%" stopColor="#16a34a" />
            <stop offset="100%" stopColor="#14532d" />
          </radialGradient>
        </defs>

        {/* 1. SKY & DISTANT OPEN-PIT MINE WALLS */}
        <rect x="0" y="0" width={canvasW} height={horizonY + 30} fill="url(#mountainSkyGrad)" />

        {/* Distant Mine Bench Pit Ridges */}
        <path
          d={`
            M 0,${horizonY - 20}
            L 120,${horizonY - 45}
            L 240,${horizonY - 25}
            L 380,${horizonY - 55}
            L 520,${horizonY - 30}
            L 660,${horizonY - 60}
            L 800,${horizonY - 25}
            L 800,${horizonY + 30}
            L 0,${horizonY + 30}
            Z
          `}
          fill="#0f172a"
          opacity="0.8"
        />

        {/* Secondary closer ridge */}
        <path
          d={`
            M 0,${horizonY - 5}
            L 180,${horizonY - 22}
            L 330,${horizonY - 12}
            L 480,${horizonY - 28}
            L 650,${horizonY - 10}
            L 800,${horizonY - 18}
            L 800,${horizonY + 20}
            L 0,${horizonY + 20}
            Z
          `}
          fill="#131e33"
          opacity="0.9"
        />

        {/* 2. MINE HAUL ROAD TERRAIN BED & BERMS */}
        {/* Left Rock Berm Ridge */}
        <path d={leftBermPolygonD} fill="url(#leftBermGrad)" />
        {/* Right Rock Berm Ridge */}
        <path d={rightBermPolygonD} fill="url(#rightBermGrad)" />

        {/* Main Haul Road Floor - Clean Smooth Asphalt Bed */}
        <path d={roadBedPolygonD} fill="url(#haulRoadGrad)" stroke="#1e293b" strokeWidth="1" />

        {/* Clean Road Edge Shoulder Markings (Left & Right Boundaries) */}
        <path
          d={roadLeftEdge.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x},${p.y}`).join(" ")}
          stroke="#94a3b8"
          strokeWidth="3.5"
          opacity="0.9"
          fill="none"
        />
        <path
          d={roadRightEdge.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x},${p.y}`).join(" ")}
          stroke="#94a3b8"
          strokeWidth="3.5"
          opacity="0.9"
          fill="none"
        />

        {/* Crisp Center Lane Dashed Divider Line (Driver POV perspective) */}
        {(() => {
          const centerD = roadSteps.map((y) => {
            const cx = getCurveX(y);
            return project3D(cx, y);
          });
          const dStr = centerD.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x},${p.y}`).join(" ");
          return (
            <path
              d={dStr}
              stroke="#f1f5f9"
              strokeWidth="3.5"
              strokeDasharray="20 16"
              opacity="0.8"
              fill="none"
            />
          );
        })()}

        {/* 3. ROADSIDE DISTANCE OCCUPANCY GRID (Clear Depth Perception) */}
        {distanceMarkers.map((dist) => {
          const cx = getCurveX(dist);
          const pLeftRoad = project3D(-roadHalfWidthM + cx, dist);
          const pRightRoad = project3D(roadHalfWidthM + cx, dist);
          const pLeftPylon = project3D(-roadHalfWidthM - 1.2 + cx, dist, 1.4);
          const pLeftBase = project3D(-roadHalfWidthM - 1.2 + cx, dist, 0);
          const pRightPylon = project3D(roadHalfWidthM + 1.2 + cx, dist, 1.4);
          const pRightBase = project3D(roadHalfWidthM + 1.2 + cx, dist, 0);

          return (
            <g key={`dist-${dist}`} opacity={Math.max(0.25, 1 - dist / maxDist)}>
              {/* Clean Road Surface Cross Gridline at distance dist */}
              <line
                x1={pLeftRoad.x}
                y1={pLeftRoad.y}
                x2={pRightRoad.x}
                y2={pRightRoad.y}
                stroke="#334155"
                strokeWidth="1.2"
                strokeDasharray="8 8"
                opacity="0.5"
              />

              {/* Left Pylon Guide Post */}
              <line x1={pLeftBase.x} y1={pLeftBase.y} x2={pLeftPylon.x} y2={pLeftPylon.y} stroke="#64748b" strokeWidth="2" />
              <circle cx={pLeftPylon.x} cy={pLeftPylon.y} r={Math.max(2, pLeftPylon.scale * 0.055)} fill="#38bdf8" />

              {/* Right Pylon Guide Post */}
              <line x1={pRightBase.x} y1={pRightBase.y} x2={pRightPylon.x} y2={pRightPylon.y} stroke="#64748b" strokeWidth="2" />
              <circle cx={pRightPylon.x} cy={pRightPylon.y} r={Math.max(2, pRightPylon.scale * 0.055)} fill="#38bdf8" />

              {/* High-Legibility Distance Badge on Left Shoulder */}
              {dist % 20 === 0 && (
                <text
                  x={pLeftBase.x - 14}
                  y={pLeftBase.y + 4}
                  fill="#94a3b8"
                  fontSize={Math.max(9, Math.min(13, pLeftBase.scale * 0.2))}
                  fontFamily="monospace"
                  fontWeight="bold"
                  textAnchor="end"
                >
                  {dist}m
                </text>
              )}
            </g>
          );
        })}

        {/* 4. REALISTIC AUGMENTED REALITY SAFETY CORRIDOR */}
        {safePolygonD && (
          <g>
            {/* Glowing Surface of the Safety Corridor */}
            <path
              d={safePolygonD}
              fill="url(#corridorGrad)"
              className="transition-all duration-300"
            />

            {/* Glowing Left & Right Corridor Laser Boundaries */}
            {safePath.leftBoundary.length > 0 && (
              <path
                d={safePath.leftBoundary
                  .map((p, i) => {
                    const cx = getCurveX(p.y);
                    const pt = project3D(p.x + cx, p.y);
                    return `${i === 0 ? "M" : "L"} ${pt.x},${pt.y}`;
                  })
                  .join(" ")}
                stroke={theme.border}
                strokeWidth="3.5"
                fill="none"
                filter="url(#neonGlow)"
              />
            )}

            {safePath.rightBoundary.length > 0 && (
              <path
                d={safePath.rightBoundary
                  .map((p, i) => {
                    const cx = getCurveX(p.y);
                    const pt = project3D(p.x + cx, p.y);
                    return `${i === 0 ? "M" : "L"} ${pt.x},${pt.y}`;
                  })
                  .join(" ")}
                stroke={theme.border}
                strokeWidth="3.5"
                fill="none"
                filter="url(#neonGlow)"
              />
            )}

            {/* Directional Trajectory Guidance Chevrons on the Corridor Bed */}
            {chevrons.map((ch, idx) => {
              const arrowW = Math.max(10, ch.scale * 0.35);
              const arrowH = Math.max(6, ch.scale * 0.16);
              return (
                <polygon
                  key={`chev-${idx}`}
                  points={`
                    ${ch.x},${ch.y - arrowH}
                    ${ch.x + arrowW},${ch.y + arrowH * 0.7}
                    ${ch.x + arrowW * 0.6},${ch.y + arrowH * 0.7}
                    ${ch.x},${ch.y - arrowH * 0.2}
                    ${ch.x - arrowW * 0.6},${ch.y + arrowH * 0.7}
                    ${ch.x - arrowW},${ch.y + arrowH * 0.7}
                  `}
                  fill={theme.border}
                  opacity="0.45"
                />
              );
            })}

            {/* Segmented Center Guidance Line */}
            {centerLineD && (
              <path
                d={centerLineD}
                stroke={theme.centerLine}
                strokeWidth="2.2"
                fill="none"
                strokeDasharray="8 8"
                opacity="0.85"
                filter="url(#neonGlow)"
              />
            )}
          </g>
        )}

        {/* 5. STOPPING DISTANCE PREDICTION THRESHOLD BAR */}
        {requiredStoppingDistanceM && requiredStoppingDistanceM > 0 && (
          (() => {
            const stopDist = Math.min(requiredStoppingDistanceM, 90);
            const cx = getCurveX(stopDist);
            const pL = project3D(-2.4 + cx, stopDist);
            const pR = project3D(2.4 + cx, stopDist);
            return (
              <g opacity="0.95">
                <line
                  x1={pL.x}
                  y1={pL.y}
                  x2={pR.x}
                  y2={pR.y}
                  stroke="#ef4444"
                  strokeWidth="3.5"
                  strokeDasharray="5 3"
                  filter="url(#neonGlow)"
                />
                <rect
                  x={(pL.x + pR.x) / 2 - 38}
                  y={pL.y - 14}
                  width="76"
                  height="13"
                  rx="3"
                  fill="rgba(239, 68, 68, 0.9)"
                />
                <text
                  x={(pL.x + pR.x) / 2}
                  y={pL.y - 4}
                  fill="#ffffff"
                  fontSize="8"
                  fontWeight="bold"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {t("driver.stopLine", "STOP LINE")} {stopDist.toFixed(0)}{t("common.unitMeters", "m")}
                </text>
              </g>
            );
          })()
        )}

        {/* 6. DETECTED OBSTACLES: 3D GLOWING RADAR DETECTION SPHERES */}
        {/* Render Far-to-Near so closer spheres properly overlay distant ones */}
        {obstacles
          .slice()
          .sort((a, b) => b.yM - a.yM)
          .map((obs) => renderSphereRadarTarget(obs))}

        {/* 7. REALISTIC VOLUMETRIC FOG / HAZE LAYER ACCORDING TO FOG DENSITY */}
        <rect
          x="0"
          y={horizonY - 40}
          width={canvasW}
          height={260}
          fill="url(#depthFogGrad)"
          opacity={Math.min(0.95, (fogDensityPercent / 100) * 1.1)}
          pointerEvents="none"
        />

        {/* 8. DRIVER CABIN HOOD / EGO VEHICLE AT BOTTOM */}
        <g transform={`translate(${canvasW / 2}, ${canvasH})`}>
          {/* Heavy HEMM Truck Front Cab Nose/Hood Silhouette */}
          <path
            d={`
              M -180,0
              L -140,-55
              L -75,-65
              L 75,-65
              L 140,-55
              L 180,0
              Z
            `}
            fill="#090d16"
            stroke="#1e293b"
            strokeWidth="2"
          />
          {/* Hood Ridge Lines */}
          <line x1="-75" y1="-65" x2="-60" y2="0" stroke="#334155" strokeWidth="2" />
          <line x1="75" y1="-65" x2="60" y2="0" stroke="#334155" strokeWidth="2" />
          <line x1="0" y1="-65" x2="0" y2="0" stroke="#475569" strokeWidth="2" strokeDasharray="4 4" />

          {/* Ego Guidance Origin Indicator */}
          <circle cx="0" cy="-65" r="4.5" fill="#3b82f6" filter="url(#neonGlow)" />
          <text x="0" y="-74" fill="#60a5fa" fontSize="9" fontWeight="black" fontFamily="monospace" textAnchor="middle" letterSpacing="1">
            {t("driver.egoVehicle", "EGO VEHICLE (HEMM-CAB)")}
          </text>
        </g>

        {/* 9. TACTICAL 2D CIRCULAR RADAR SCOPE INSET (Driver Instrument) */}
        <g transform={`translate(${canvasW - 105}, ${canvasH - 105})`}>
          {/* Radar Instrument Housing */}
          <circle cx="0" cy="0" r="85" fill="#060c14" stroke="#1e293b" strokeWidth="2.5" />
          <circle cx="0" cy="0" r="82" fill="#08101a" stroke="#0ea5e9" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />

          {/* Concentric Circular Range Rings (15m, 30m, 50m) */}
          {[25, 50, 75].map((r, idx) => (
            <circle key={idx} cx="0" cy="0" r={r} fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
          ))}

          {/* Azimuth Crosshairs */}
          <line x1="-80" y1="0" x2="80" y2="0" stroke="#1e293b" strokeWidth="1" />
          <line x1="0" y1="-80" x2="0" y2="80" stroke="#1e293b" strokeWidth="1" />

          {/* Protected Critical Stopping Radius */}
          <circle
            cx="0"
            cy="0"
            r={Math.min(75, (requiredStoppingDistanceM ?? 22) * 1.5)}
            fill="none"
            stroke="#ef4444"
            strokeWidth="1.2"
            strokeDasharray="4 2"
            opacity="0.8"
          />

          {/* HEMM Reference Vehicle at center */}
          <rect x="-4" y="-7" width="8" height="14" fill="#ca8a04" stroke="#eab308" strokeWidth="1" rx="1.5" />
          <circle cx="0" cy="0" r="1.5" fill="#38bdf8" />

          {/* Detected Primary Target Marker (○) - only when hazard exists */}
          {hasObstacle && (() => {
            const distScale = Math.min(75, (primaryDist / 60) * 75);
            const tX = distScale * Math.sin(primaryRad);
            const tY = -distScale * Math.cos(primaryRad);
            return (
              <g transform={`translate(${tX}, ${tY})`}>
                <circle cx="0" cy="0" r="4.5" fill={isDangerous ? "#ef4444" : "#34d399"} stroke="#ffffff" strokeWidth="1" />
                <circle cx="0" cy="0" r="1.5" fill="#ffffff" />
                {/* Closing Vector */}
                <line
                  x1="0"
                  y1="0"
                  x2={-Math.sin(primaryRad) * 8}
                  y2={Math.cos(primaryRad) * 8}
                  stroke={isDangerous ? "#ef4444" : "#34d399"}
                  strokeWidth="1.5"
                />
              </g>
            );
          })()}

          {/* Inset Scope Title */}
          <rect x="-50" y="62" width="100" height="16" rx="4" fill="#040810" stroke="#334155" strokeWidth="1" />
          <text x="0" y="73" fill="#38bdf8" fontSize="7.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
            2D RADAR (77 GHz)
          </text>
        </g>
      </svg>

      {/* TOP OVERLAY STATUS HUD BAR */}
      <div className="absolute top-3 left-4 right-4 flex items-center justify-between pointer-events-none">
        {/* Left: Corridor Mode & Status */}
        <div className="flex items-center gap-2 bg-[#0b1120]/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-[#334155]/60 shadow-lg">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              isDangerous ? "bg-red-500 animate-ping" : "bg-emerald-400"
            }`}
          />
          <span className="text-[11px] font-mono font-bold tracking-wider text-slate-200">
            {isCurve ? t("driver.blindCurveView", "BLOCK B1 — BLIND CURVE 120m") : t("driver.radarFovTrapezoid", "HAUL ROAD CORRIDOR — 120m DEEP VIEW")}
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">
            {t("driver.radarTrackingActive", "2D RADAR: ACTIVE")}
          </span>
        </div>

        {/* Center: Large High-Visibility Driver Status Badge (Intuitive Comprehension) */}
        <div className="flex items-center">
          {safetyState === "SAFE" ? (
            <div className="flex items-center gap-2 bg-emerald-950/95 border-2 border-emerald-500 px-4 py-1.5 rounded-full shadow-[0_0_18px_rgba(16,185,129,0.4)]">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-300 font-mono text-xs font-black tracking-widest uppercase">
                SAFE — PROCEED
              </span>
            </div>
          ) : safetyState === "CAUTION" || safetyState === "WARNING" ? (
            <div className="flex items-center gap-2 bg-amber-950/95 border-2 border-amber-500 px-4 py-1.5 rounded-full shadow-[0_0_18px_rgba(245,158,11,0.4)]">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
              <span className="text-amber-300 font-mono text-xs font-black tracking-widest uppercase">
                CAUTION — SLOW DOWN
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-red-950/95 border-2 border-red-500 px-4 py-1.5 rounded-full shadow-[0_0_22px_rgba(239,68,68,0.5)]">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              <span className="text-red-300 font-mono text-xs font-black tracking-widest uppercase">
                DANGER — STOP NOW
              </span>
            </div>
          )}
        </div>

        {/* Right: Perception & Fog Metric */}
        <div className="flex items-center gap-3 bg-[#0b1120]/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-[#334155]/60 shadow-lg font-mono text-[11px]">
          <span className="text-slate-400">
            {t("environment.fog", "FOG")}: <strong className="text-amber-400">{fogDensityPercent}%</strong>
          </span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400">
            {t("environment.visibility", "VIS")}: <strong className="text-cyan-400">{currentVisM.toFixed(1)}{t("common.unitMeters", "m")}</strong>
          </span>
        </div>
      </div>

      {/* BOTTOM IMMINENT BRAKE WARNING BANNER */}
      {isDangerous && (
        <div className="absolute bottom-16 left-0 w-full px-8 pointer-events-none">
          <div className="w-full border-t-2 border-b-2 border-red-500 bg-red-600/25 py-2 backdrop-blur-sm shadow-[0_0_25px_rgba(239,68,68,0.5)]">
            <p className="text-red-400 text-center font-mono text-xs md:text-sm font-black tracking-widest uppercase flex items-center justify-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              {t("driver.warningBanner", "WARNING: OBSTACLE TARGET DETECTED IN PATH — INITIATE BRAKING")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
