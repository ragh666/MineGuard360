import { RawFogLockData } from "../data/types";

export interface FogLockEvaluation {
  effectiveAuthorization: "GRANT" | "DENY" | "COMM_LOST" | "UNKNOWN";
  reason: string;
  speedAdvisoryKmh: number | null;
}

/**
 * Validates FOG-LOCK digital authorization token & state.
 *
 * Driver Display receives and evaluates FOG-LOCK states.
 * Invalid or expired tokens, block mismatch, or communication loss result in movement restrictions.
 */
export function validateFogLockToken(
  fogLock: RawFogLockData,
  currentVehicleId: string = "V01",
  currentTimestampMs: number = Date.now()
): FogLockEvaluation {
  if (fogLock.authorization === "COMM_LOST") {
    return {
      effectiveAuthorization: "COMM_LOST",
      reason: "LoRa digital block communication lost.",
      speedAdvisoryKmh: fogLock.speedAdvisoryKmh ?? 10,
    };
  }

  if (fogLock.authorization === "UNKNOWN" || !fogLock.blockId) {
    return {
      effectiveAuthorization: "UNKNOWN",
      reason: "FOG-LOCK block authorization state unknown.",
      speedAdvisoryKmh: null,
    };
  }

  if (fogLock.authorization === "DENY") {
    return {
      effectiveAuthorization: "DENY",
      reason: "FOG-LOCK block access DENIED by digital coordinator.",
      speedAdvisoryKmh: 0,
    };
  }

  // Validate Token details if authorization claimed GRANT
  if (fogLock.authorization === "GRANT") {
    const token = fogLock.token;

    if (!token) {
      return {
        effectiveAuthorization: "DENY",
        reason: "FOG-LOCK authorization GRANT missing token payload.",
        speedAdvisoryKmh: 0,
      };
    }

    if (token.status !== "VALID") {
      return {
        effectiveAuthorization: "DENY",
        reason: `FOG-LOCK token status invalid (${token.status}).`,
        speedAdvisoryKmh: 0,
      };
    }

    if (token.expiresAt < currentTimestampMs) {
      return {
        effectiveAuthorization: "DENY",
        reason: "FOG-LOCK token expired.",
        speedAdvisoryKmh: 0,
      };
    }

    const isVehicleMatch =
      token.vehicleId === currentVehicleId ||
      (token.vehicleId === "HEMM-001" && currentVehicleId === "V01") ||
      (token.vehicleId === "V01" && currentVehicleId === "HEMM-001");

    if (!isVehicleMatch) {
      return {
        effectiveAuthorization: "DENY",
        reason: `FOG-LOCK token vehicle mismatch (${token.vehicleId} vs ${currentVehicleId}).`,
        speedAdvisoryKmh: 0,
      };
    }
  }

  return {
    effectiveAuthorization: "GRANT",
    reason: "FOG-LOCK movement authorized for active digital block.",
    speedAdvisoryKmh: fogLock.speedAdvisoryKmh,
  };
}
