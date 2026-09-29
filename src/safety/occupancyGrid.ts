import { RawRadarData } from "../data/types";

/**
 * FOG-HEMM Local Occupancy Grid Subsystem
 *
 * Transforms radar polar coordinates (distance, azimuth angle) into a local Cartesian coordinate frame (x, y)
 * centered on vehicle origin (0, 0), and updates a 7x10 local occupancy probability grid.
 */

export type OccupancyState = "FREE" | "OCCUPIED" | "UNKNOWN";

export interface OccupancyCell {
  row: number; // 0 (far field y ~ 45-50m) to 9 (near field y ~ 0-5m)
  col: number; // 0 (far left x ~ -7.5m) to 6 (far right x ~ +7.5m)
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  probability: number; // 0.0 (FREE) to 1.0 (OCCUPIED)
  state: OccupancyState;
  confidence: number;
  lastUpdated: number;
}

export interface TrackedRadarTarget {
  id: string;
  xM: number;
  yM: number;
  distanceM: number;
  angleDeg: number;
  relativeVelocityMps: number;
  confidence: number;
  obstacleClass?: "HEMM" | "ROCK" | "PERSON" | "VEHICLE" | "EDGE" | "UNKNOWN";
  lastSeenMs: number;
}

export interface LocalOccupancyGrid {
  cols: number;
  rows: number;
  cells: OccupancyCell[];
  targets: TrackedRadarTarget[];
  timestampMs: number;
}

const GRID_COLS = 7;
const GRID_ROWS = 10;
const X_RANGE_M = 15.0; // x from -7.5m to +7.5m
const Y_RANGE_M = 50.0; // y from 0m to 50m

/**
 * Converts polar radar coordinates (distance in meters, azimuth angle in degrees) to local Cartesian (x, y)
 * x = distance * sin(angle)
 * y = distance * cos(angle)
 */
export function polarToCartesian(distanceM: number, angleDeg: number): { xM: number; yM: number } {
  const angleRad = (angleDeg * Math.PI) / 180;
  const xM = Math.round(distanceM * Math.sin(angleRad) * 100) / 100;
  const yM = Math.round(distanceM * Math.cos(angleRad) * 100) / 100;
  return { xM, yM };
}

/**
 * Classifies occupancy probability p into OccupancyState
 * p < 0.25 -> FREE
 * 0.25 <= p <= 0.65 -> UNKNOWN
 * p > 0.65 -> OCCUPIED
 */
export function classifyOccupancyState(p: number): OccupancyState {
  if (p < 0.25) return "FREE";
  if (p > 0.65) return "OCCUPIED";
  return "UNKNOWN";
}

/**
 * Builds or updates the 7x10 local occupancy grid from radar input and target tracking.
 */
export function updateOccupancyGrid(
  radar: RawRadarData,
  previousGrid?: LocalOccupancyGrid,
  nowMs: number = Date.now()
): LocalOccupancyGrid {
  // Step 1: Create initial empty 7x10 grid cells
  const colWidthM = X_RANGE_M / GRID_COLS; // ~2.14m per cell
  const rowHeightM = Y_RANGE_M / GRID_ROWS; // 5.0m per cell

  const cells: OccupancyCell[] = [];

  for (let r = 0; r < GRID_ROWS; r++) {
    // Row 0 is farthest (y: 45m - 50m), Row 9 is nearest (y: 0m - 5m)
    const yMax = Y_RANGE_M - r * rowHeightM;
    const yMin = yMax - rowHeightM;

    for (let c = 0; c < GRID_COLS; c++) {
      const xMin = -X_RANGE_M / 2 + c * colWidthM;
      const xMax = xMin + colWidthM;

      // Retain probability from previous grid if available (temporal persistence decay)
      let initialProb = 0.1; // Baseline FREE
      if (previousGrid) {
        const prevCell = previousGrid.cells.find((cell) => cell.row === r && cell.col === c);
        if (prevCell) {
          // Decays toward 0.5 (UNKNOWN) over time if unobserved
          const dt = (nowMs - prevCell.lastUpdated) / 1000;
          if (dt > 1.5) {
            initialProb = 0.5; // UNKNOWN
          } else {
            initialProb = prevCell.probability * Math.exp(-dt * 0.5);
          }
        }
      }

      cells.push({
        row: r,
        col: c,
        xMin: Math.round(xMin * 100) / 100,
        xMax: Math.round(xMax * 100) / 100,
        yMin: Math.round(yMin * 100) / 100,
        yMax: Math.round(yMax * 100) / 100,
        probability: initialProb,
        state: classifyOccupancyState(initialProb),
        confidence: 0.9,
        lastUpdated: nowMs,
      });
    }
  }

  // Step 2: Track & Convert Radar Targets to Cartesian
  const targets: TrackedRadarTarget[] = [];

  if (radar.distanceM !== null && radar.distanceM > 0) {
    const angleDeg = radar.angleDeg ?? 0;
    const { xM, yM } = polarToCartesian(radar.distanceM, angleDeg);

    targets.push({
      id: "TGT_PRIMARY",
      xM,
      yM,
      distanceM: radar.distanceM,
      angleDeg,
      relativeVelocityMps: radar.relativeVelocityMps ?? 0,
      confidence: radar.trackPersistence ?? 0.95,
      obstacleClass: radar.obstacleClass ?? "HEMM",
      lastSeenMs: nowMs,
    });

    // Step 3: Populate corresponding grid cells for detected targets
    cells.forEach((cell) => {
      if (
        xM >= cell.xMin - 0.5 &&
        xM <= cell.xMax + 0.5 &&
        yM >= cell.yMin - 1.0 &&
        yM <= cell.yMax + 1.0
      ) {
        cell.probability = 0.95; // OCCUPIED
        cell.state = "OCCUPIED";
        cell.confidence = 0.98;
        cell.lastUpdated = nowMs;
      }
    });
  }

  // Step 4: Handle Radar Fault / Missing Radar Data (UNKNOWN state)
  if (radar.distanceM === null || !radar.signalStrength) {
    cells.forEach((cell) => {
      if (cell.probability < 0.7) {
        cell.probability = 0.5; // UNKNOWN
        cell.state = "UNKNOWN";
      }
    });
  }

  return {
    cols: GRID_COLS,
    rows: GRID_ROWS,
    cells,
    targets,
    timestampMs: nowMs,
  };
}
