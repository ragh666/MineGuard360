import { RawSensorData, ScenarioType } from "./types";

/**
 * Synthetic Sensor Generator for FOG-HEMM Phase 1
 *
 * Generates physically correlated RAW sensor data for controlled scenarios.
 * Synthetic values are strictly RAW inputs (speed, distance, relative velocity, etc.)
 * and NEVER generate final safety decisions directly.
 */

export function generateRawSensorDataForScenario(
  scenario: ScenarioType,
  stepIndex: number = 0,
  currentVehicleSpeedMps: number | null = null
): RawSensorData {
  const now = Date.now();

  let distanceM: number | null = 50;
  let relativeVelocityMps: number | null = 0;
  let angleDeg: number | null = 0;
  let speedMps: number | null = currentVehicleSpeedMps ?? 5.55; // default 20 km/h (5.55 m/s)
  let brakeApplied: boolean | null = false;
  let throttlePercent: number | null = 30;

  // FOG-LOCK defaults
  let authorization: "GRANT" | "DENY" | "COMM_LOST" | "UNKNOWN" = "GRANT";
  let blockId: string | null = "BLK_A12";
  let tokenStatus: "VALID" | "EXPIRED" | "INVALID" | "REVOKED" = "VALID";
  let separationM: number | null = 45;
  let speedAdvisoryKmh: number | null = 30;

  // Environment defaults
  let weather: "NORMAL" | "FOG" | "DENSE_FOG" | "RAIN" | "HEAVY_RAIN" | "DUST" | "MONSOON" | "HIGH_HUMIDITY" = "NORMAL";
  let roadCondition: "DRY" | "WET" | "SLIPPERY" = "DRY";
  let visibility: "GOOD" | "MODERATE" | "POOR" | "ZERO" = "GOOD";

  // Sensor health defaults
  let radarValid = true;
  let encoderValid = true;
  let canValid = true;
  let loraValid = true;
  let brakeValid = true;

  // Scenario specific RAW input adjustments
  switch (scenario) {
    case "NORMAL_ROAD":
      distanceM = 60;
      relativeVelocityMps = 0;
      speedMps = 5.55; // 20 km/h
      break;

    case "OBJECT_AHEAD":
      distanceM = 35;
      relativeVelocityMps = -1.0;
      speedMps = 6.94; // 25 km/h
      break;

    case "APPROACHING_OBJECT": {
      // Dynamic time step progression: distance decreases over time
      const decay = stepIndex * 2.5;
      distanceM = Math.max(8, 30 - decay);
      relativeVelocityMps = -3.5; // -3.5 m/s approaching
      speedMps = 6.94;
      break;
    }

    case "BLIND_CURVE":
      distanceM = 22;
      angleDeg = 12; // curve offset
      relativeVelocityMps = -2.0;
      weather = "DENSE_FOG";
      visibility = "POOR";
      break;

    case "JUNCTION_CONFLICT":
      distanceM = 16;
      relativeVelocityMps = -4.0;
      speedMps = 8.33; // 30 km/h
      break;

    case "FOLLOWING_TOO_CLOSE":
      distanceM = 12;
      separationM = 8; // below safe separation
      relativeVelocityMps = -0.5;
      speedMps = 6.94;
      break;

    case "CRITICAL_TTC": {
      // Calculated TTC naturally falls into 1.0s - 2.0s
      const decay = stepIndex * 1.5;
      distanceM = Math.max(4, 14 - decay);
      relativeVelocityMps = -6.0; // closing velocity 6.0 m/s => TTC ~ 1.5s
      speedMps = 8.33;
      break;
    }

    case "EMERGENCY_COLLISION": {
      // Distance extremely short with high closing speed => TTC < 1s
      const decay = stepIndex * 1.2;
      distanceM = Math.max(1.5, 6 - decay);
      relativeVelocityMps = -8.0; // closing velocity 8 m/s => TTC = 0.5s
      speedMps = 8.33;
      break;
    }

    case "RADAR_FAILURE":
      radarValid = false;
      distanceM = null;
      relativeVelocityMps = null;
      break;

    case "ENCODER_FAILURE":
      encoderValid = false;
      speedMps = null;
      break;

    case "CAN_FAILURE":
      canValid = false;
      break;

    case "LORA_FAILURE":
      loraValid = false;
      authorization = "COMM_LOST";
      break;

    case "BRAKE_FAILURE":
      brakeValid = false;
      break;

    case "SENSOR_DISAGREEMENT":
      // Radar reports moving fast toward target, encoder reports stationary speed
      distanceM = 12;
      relativeVelocityMps = -6.0;
      speedMps = 0; // Disagreement!
      break;

    default:
      distanceM = 50;
      relativeVelocityMps = 0;
      speedMps = 5.55;
      break;
  }

  return {
    radar: {
      distanceM,
      relativeVelocityMps,
      angleDeg,
      targetCount: distanceM !== null ? 1 : 0,
      signalStrength: radarValid ? 92 : null,
      trackPersistence: radarValid ? 0.98 : null,
      timestampMs: now,
    },
    vehicle: {
      speedMps,
      direction: "FORWARD",
      brakeApplied,
      throttlePercent,
      gear: "D",
      encoderPulses: speedMps !== null ? Math.round(speedMps * 100) : null,
      timestampMs: now,
    },
    fogLock: {
      blockId,
      blockType: "HAUL_ROAD_BLOCK",
      authorization,
      token: {
        tokenId: "TOK_99231",
        vehicleId: "V01",
        blockId: blockId ?? "BLK_A12",
        direction: "A_TO_B",
        issuedAt: now - 5000,
        expiresAt: (tokenStatus as string) === "EXPIRED" ? now - 1000 : now + 60000,
        sequence: 42,
        status: tokenStatus,
      },
      tokenId: "TOK_99231",
      direction: "A_TO_B",
      separationM,
      speedAdvisoryKmh,
      timestampMs: now,
    },
    environment: {
      weather,
      roadCondition,
      visibility,
      simulated: true,
      timestampMs: now,
    },
    sensorHealth: {
      radarValid,
      encoderValid,
      canValid,
      loraValid,
      brakeValid,
    },
    timestampMs: now,
  };
}
