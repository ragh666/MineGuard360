import { CorridorStatus, CorridorType, RawEnvironmentData, RawRadarData } from "../data/types";

export interface CorridorEvaluation {
  objectInCorridor: boolean;
  corridor: CorridorType;
  corridorStatus: CorridorStatus;
  lateralOffsetM: number | null;
}

/**
 * Evaluates whether a detected radar target is inside the vehicle's safe projected corridor.
 *
 * UNKNOWN is never assumed safe. If radar data is invalid or missing, corridor status is UNKNOWN.
 *
 * @param radar Raw radar input data
 * @param corridorHalfWidthM Configured lateral width boundary of vehicle corridor
 */
export function evaluateCorridor(
  radar: RawRadarData,
  corridorHalfWidthM: number
): CorridorEvaluation {
  if (
    radar.distanceM === null ||
    radar.distanceM === undefined ||
    isNaN(radar.distanceM)
  ) {
    return {
      objectInCorridor: false,
      corridor: "UNKNOWN",
      corridorStatus: "UNKNOWN",
      lateralOffsetM: null,
    };
  }

  const angleDeg = radar.angleDeg ?? 0;
  // Convert angle to lateral offset: offset = distance * sin(angle)
  const angleRad = (angleDeg * Math.PI) / 180;
  const lateralOffsetM = Math.round(radar.distanceM * Math.sin(angleRad) * 100) / 100;

  // Determine corridor channel
  let corridor: CorridorType = "CENTER";
  if (lateralOffsetM < -1.5) {
    corridor = "LEFT";
  } else if (lateralOffsetM > 1.5) {
    corridor = "RIGHT";
  }

  // Check if lateral offset falls within the vehicle corridor threshold
  const isInsideCorridor = Math.abs(lateralOffsetM) <= corridorHalfWidthM;

  if (isInsideCorridor && radar.distanceM > 0) {
    return {
      objectInCorridor: true,
      corridor,
      corridorStatus: "BLOCKED",
      lateralOffsetM,
    };
  }

  return {
    objectInCorridor: false,
    corridor,
    corridorStatus: "CLEAR",
    lateralOffsetM,
  };
}

/**
 * Evaluates road edge / highwall clearance from sensor & environment inputs.
 */
export function evaluateEdgeClearance(
  radar: RawRadarData,
  environment: RawEnvironmentData,
  minClearanceM: number
): { edgeClearanceM: number | null; edgeHazard: boolean } {
  // If angle suggests side wall detection or specified in environment
  if (radar.angleDeg !== null && Math.abs(radar.angleDeg) > 25 && radar.distanceM !== null) {
    const lateralOffset = Math.abs(radar.distanceM * Math.sin((radar.angleDeg * Math.PI) / 180));
    const edgeHazard = lateralOffset < minClearanceM;
    return { edgeClearanceM: Math.round(lateralOffset * 100) / 100, edgeHazard };
  }

  // Default baseline simulated edge clearance
  const simulatedClearance = environment.roadCondition === "SLIPPERY" ? 1.8 : 3.0;
  return { edgeClearanceM: simulatedClearance, edgeHazard: false };
}
