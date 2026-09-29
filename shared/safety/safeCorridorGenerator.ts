import { LocalOccupancyGrid } from "./occupancyGrid";

export type CorridorDirection = "LEFT" | "CENTER" | "RIGHT" | "NONE" | "UNKNOWN";
export type CorridorPathStatus = "CLEAR" | "CAUTION" | "BLOCKED" | "UNKNOWN";

export interface PathPoint {
  x: number; // local lateral offset (m)
  y: number; // local forward distance (m)
}

export interface CorridorCandidate {
  direction: CorridorDirection;
  score: number;
  obstaclePenalty: number;
  unknownPenalty: number;
  edgePenalty: number;
  safe: boolean;
}

export interface GeneratedSafePath {
  status: CorridorPathStatus;
  statusBadge: "ON SAFE PATH" | "PATH CAUTION" | "PATH BLOCKED" | "PATH UNKNOWN";
  selectedDirection: CorridorDirection;
  centerline: PathPoint[];
  leftBoundary: PathPoint[];
  rightBoundary: PathPoint[];
  candidates: CorridorCandidate[];
}

/**
 * Pure Safe Corridor Generator:
 * Generates dynamic 2D perspective path curves from local occupancy grid evaluation.
 *
 * DO NOT DRAW A FAKE SAFE PATH: Path curve bends dynamically to follow selected safe candidate corridor (LEFT, CENTER, RIGHT).
 */
export function generateSafeCorridorPath(
  grid: LocalOccupancyGrid,
  vehicleWidthM: number = 2.5,
  requiredStoppingDistanceM: number = 20.0,
  curvature: number = 0, // >0 for right curve, <0 for left curve (e.g. Blind Curve B1)
  maxPathDistanceM: number = 50
): GeneratedSafePath {
  // Step 1: Evaluate candidate corridors (LEFT x~-2.5m, CENTER x~0m, RIGHT x~+2.5m)
  const directions: CorridorDirection[] = ["LEFT", "CENTER", "RIGHT"];
  const candidates: CorridorCandidate[] = [];

  directions.forEach((dir) => {
    let centerXM = 0;
    if (dir === "LEFT") centerXM = -2.5;
    if (dir === "RIGHT") centerXM = 2.5;

    let obstaclePenalty = 0;
    let unknownPenalty = 0;
    let edgePenalty = Math.abs(centerXM) * 0.5; // slight edge penalty for lateral offset

    // Inspect cells along this candidate corridor path (y up to required stopping distance)
    grid.cells.forEach((cell) => {
      if (cell.yMin <= requiredStoppingDistanceM) {
        // Check cell overlap with candidate corridor width
        const overlaps = Math.abs(cell.xMin - centerXM) <= vehicleWidthM / 1.5;
        if (overlaps) {
          if (cell.state === "OCCUPIED") {
            obstaclePenalty += 50;
          } else if (cell.state === "UNKNOWN") {
            unknownPenalty += 10;
          }
        }
      }
    });

    const score = Math.max(0, 100 - obstaclePenalty - unknownPenalty - edgePenalty);
    const safe = obstaclePenalty === 0 && unknownPenalty < 40;

    candidates.push({
      direction: dir,
      score,
      obstaclePenalty,
      unknownPenalty,
      edgePenalty,
      safe,
    });
  });

  // Step 2: Select Best Candidate Corridor
  let selectedDirection: CorridorDirection = "CENTER";
  let status: CorridorPathStatus = "CLEAR";
  let statusBadge: GeneratedSafePath["statusBadge"] = "ON SAFE PATH";

  const centerCand = candidates.find((c) => c.direction === "CENTER")!;
  const leftCand = candidates.find((c) => c.direction === "LEFT")!;
  const rightCand = candidates.find((c) => c.direction === "RIGHT")!;

  // If grid is UNKNOWN (e.g. radar fault)
  const isGridUnknown = grid.cells.every((c) => c.state === "UNKNOWN");
  if (isGridUnknown) {
    selectedDirection = "UNKNOWN";
    status = "UNKNOWN";
    statusBadge = "PATH UNKNOWN";
  } else if (centerCand.safe) {
    selectedDirection = "CENTER";
    status = centerCand.unknownPenalty > 0 ? "CAUTION" : "CLEAR";
    statusBadge = centerCand.unknownPenalty > 0 ? "PATH CAUTION" : "ON SAFE PATH";
  } else if (leftCand.safe && leftCand.score >= rightCand.score) {
    selectedDirection = "LEFT";
    status = "CAUTION";
    statusBadge = "PATH CAUTION";
  } else if (rightCand.safe) {
    selectedDirection = "RIGHT";
    status = "CAUTION";
    statusBadge = "PATH CAUTION";
  } else {
    selectedDirection = "NONE";
    status = "BLOCKED";
    statusBadge = "PATH BLOCKED";
  }

  // Step 3: Generate Dynamic 2D Path Points (y from 0m to 50m)
  const centerline: PathPoint[] = [];
  const leftBoundary: PathPoint[] = [];
  const rightBoundary: PathPoint[] = [];

  const pathLengthM = Math.max(6, Math.min(50, maxPathDistanceM));
  const numSteps = 15;
  const halfWidth = vehicleWidthM / 2 + 0.5;

  let targetXM = 0;
  if (selectedDirection === "LEFT") targetXM = -2.8;
  else if (selectedDirection === "RIGHT") targetXM = 2.8;

  for (let i = 0; i <= numSteps; i++) {
    const y = (i / numSteps) * pathLengthM;

    // Smooth Sigmoid/S-curve lateral transition towards selected direction + road curvature
    const t = y / pathLengthM;
    const bendX = targetXM * Math.sin(t * Math.PI * 0.8) + curvature * Math.pow(t, 1.8) * 10;

    centerline.push({ x: bendX, y });
    leftBoundary.push({ x: bendX - halfWidth, y });
    rightBoundary.push({ x: bendX + halfWidth, y });
  }

  return {
    status,
    statusBadge,
    selectedDirection,
    centerline,
    leftBoundary,
    rightBoundary,
    candidates,
  };
}
