import { TtcStatus } from "../data/types";

/**
 * Normalizes relative velocity into closing velocity.
 * Convention: positive closing velocity = target is getting closer.
 *
 * @param relativeVelocityMps Sensor reported relative velocity (m/s). Negative implies approaching target.
 */
export function calculateClosingVelocity(relativeVelocityMps: number | null): number | null {
  if (relativeVelocityMps === null || isNaN(relativeVelocityMps)) {
    return null;
  }
  // Standard radar convention: target approaching has negative relative velocity.
  // Closing velocity = -relativeVelocity
  return Math.max(0, -relativeVelocityMps);
}

/**
 * Pure function to calculate Time-To-Collision (TTC) in seconds.
 *
 * Formula: TTC = Distance / Closing Velocity
 *
 * If distance <= 0: TTC = 0s (Collision imminent / contact)
 * If closing velocity <= 0: Target is stationary or moving away, returns NO_CLOSING (ttcSeconds: null)
 *
 * @param distanceM Distance to target in meters
 * @param closingVelocityMps Closing velocity in meters/second
 */
export function calculateTTC(
  distanceM: number | null,
  closingVelocityMps: number | null
): { ttcSeconds: number | null; ttcStatus: TtcStatus } {
  if (
    distanceM === null ||
    closingVelocityMps === null ||
    isNaN(distanceM) ||
    isNaN(closingVelocityMps)
  ) {
    return { ttcSeconds: null, ttcStatus: "UNKNOWN" };
  }

  if (distanceM <= 0) {
    return { ttcSeconds: 0, ttcStatus: "VALID" };
  }

  if (closingVelocityMps <= 0) {
    return { ttcSeconds: null, ttcStatus: "NO_CLOSING" };
  }

  const ttc = distanceM / closingVelocityMps;
  return {
    ttcSeconds: Math.round(ttc * 100) / 100, // rounded to 2 decimal places for clean display
    ttcStatus: "VALID",
  };
}
