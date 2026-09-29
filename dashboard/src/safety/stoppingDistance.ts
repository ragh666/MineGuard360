/**
 * Stopping distance pure functions.
 * All internal units: meters (m), meters/second (m/s), meters/second^2 (m/s^2), seconds (s).
 */

/**
 * Calculates reaction distance: D_reaction = v * T_reaction
 */
export function calculateReactionDistance(
  speedMps: number | null,
  reactionTimeS: number
): number | null {
  if (speedMps === null || isNaN(speedMps) || speedMps < 0) {
    return null;
  }
  return Math.round(speedMps * reactionTimeS * 100) / 100;
}

/**
 * Calculates braking distance: D_brake = v^2 / (2 * a)
 *
 * If deceleration is zero or invalid, returns null to avoid dividing by zero / misleading values.
 */
export function calculateBrakingDistance(
  speedMps: number | null,
  decelerationMps2: number
): number | null {
  if (
    speedMps === null ||
    isNaN(speedMps) ||
    speedMps < 0 ||
    decelerationMps2 <= 0 ||
    isNaN(decelerationMps2)
  ) {
    return null;
  }

  if (speedMps === 0) {
    return 0;
  }

  const dBrake = Math.pow(speedMps, 2) / (2 * decelerationMps2);
  return Math.round(dBrake * 100) / 100;
}

/**
 * Calculates required stopping distance:
 * D_required = D_reaction + D_brake + D_margin
 */
export function calculateRequiredStoppingDistance(
  reactionDistanceM: number | null,
  brakingDistanceM: number | null,
  safetyMarginM: number
): number | null {
  if (
    reactionDistanceM === null ||
    brakingDistanceM === null ||
    isNaN(reactionDistanceM) ||
    isNaN(brakingDistanceM)
  ) {
    return null;
  }
  return Math.round((reactionDistanceM + brakingDistanceM + safetyMarginM) * 100) / 100;
}

/**
 * Calculates stopping distance margin:
 * Stopping margin = Available distance - Required stopping distance
 *
 * Negative margin means insufficient stopping distance!
 */
export function calculateStoppingMargin(
  availableDistanceM: number | null,
  requiredStoppingDistanceM: number | null
): number | null {
  if (
    availableDistanceM === null ||
    requiredStoppingDistanceM === null ||
    isNaN(availableDistanceM) ||
    isNaN(requiredStoppingDistanceM)
  ) {
    return null;
  }
  return Math.round((availableDistanceM - requiredStoppingDistanceM) * 100) / 100;
}
