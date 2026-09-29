/**
 * Vehicle separation evaluation module.
 * Evaluates separation between current vehicle and preceding vehicle against safety thresholds.
 */

export interface SeparationEvaluation {
  separationM: number | null;
  requiredProtectedSeparationM: number | null;
  separationSafe: boolean | null;
}

/**
 * Calculates protected vehicle separation distance:
 * D_protected = vehicleLength + D_brake + D_reaction + safetyMargin
 *
 * @param separationM Current physical distance between vehicles (m)
 * @param vehicleLengthM Physical length of vehicle (m)
 * @param reactionDistanceM Calculated reaction distance (m)
 * @param brakingDistanceM Calculated braking distance (m)
 * @param safetyMarginM Configured safety margin (m)
 * @param minSeparationM Hard minimum separation floor (m)
 */
export function evaluateSeparation(
  separationM: number | null,
  vehicleLengthM: number,
  reactionDistanceM: number | null,
  brakingDistanceM: number | null,
  safetyMarginM: number,
  minSeparationM: number
): SeparationEvaluation {
  if (separationM === null || isNaN(separationM)) {
    return {
      separationM: null,
      requiredProtectedSeparationM: null,
      separationSafe: null, // Unknown
    };
  }

  const dReaction = reactionDistanceM ?? 0;
  const dBrake = brakingDistanceM ?? 0;

  const dynamicProtectedM = vehicleLengthM + dReaction + dBrake + safetyMarginM;
  const requiredProtectedSeparationM = Math.max(minSeparationM, dynamicProtectedM);

  const separationSafe = separationM >= requiredProtectedSeparationM;

  return {
    separationM,
    requiredProtectedSeparationM: Math.round(requiredProtectedSeparationM * 100) / 100,
    separationSafe,
  };
}
