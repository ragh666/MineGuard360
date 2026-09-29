import { RawSensorData } from "./types";

/**
 * Dataset Adapter for FOG-HEMM Phase 1
 *
 * Converts external dataset CSV / JSON rows into standardized RAW sensor input objects.
 */

export interface RawDatasetRow {
  timestamp?: number | string;
  speed_kmh?: number | string;
  speed_mps?: number | string;
  radar_dist_m?: number | string;
  relative_vel_mps?: number | string;
  radar_angle_deg?: number | string;
  foglock_auth?: string;
  block_id?: string;
  separation_m?: number | string;
  weather?: string;
  road_condition?: string;
  visibility?: string;
}

export function datasetRowToRawData(row: RawDatasetRow): RawSensorData {
  const now = typeof row.timestamp === "number" ? row.timestamp : Date.now();

  let speedMps: number | null = null;
  if (row.speed_mps !== undefined && row.speed_mps !== null && row.speed_mps !== "") {
    speedMps = Number(row.speed_mps);
  } else if (row.speed_kmh !== undefined && row.speed_kmh !== null && row.speed_kmh !== "") {
    speedMps = Number(row.speed_kmh) / 3.6;
  }

  const distanceM =
    row.radar_dist_m !== undefined && row.radar_dist_m !== null && row.radar_dist_m !== ""
      ? Number(row.radar_dist_m)
      : null;

  const relativeVelocityMps =
    row.relative_vel_mps !== undefined && row.relative_vel_mps !== null && row.relative_vel_mps !== ""
      ? Number(row.relative_vel_mps)
      : null;

  const angleDeg =
    row.radar_angle_deg !== undefined && row.radar_angle_deg !== null && row.radar_angle_deg !== ""
      ? Number(row.radar_angle_deg)
      : 0;

  const authRaw = (row.foglock_auth ?? "GRANT").toUpperCase();
  let authorization: "GRANT" | "DENY" | "COMM_LOST" | "UNKNOWN" = "GRANT";
  if (authRaw === "DENY" || authRaw === "COMM_LOST" || authRaw === "UNKNOWN") {
    authorization = authRaw;
  }

  return {
    radar: {
      distanceM,
      relativeVelocityMps,
      angleDeg,
      targetCount: distanceM !== null ? 1 : 0,
      signalStrength: 88,
      trackPersistence: 0.95,
      timestampMs: now,
    },
    vehicle: {
      speedMps,
      direction: "FORWARD",
      brakeApplied: false,
      throttlePercent: 20,
      gear: "D",
      encoderPulses: speedMps !== null ? Math.round(speedMps * 100) : null,
      timestampMs: now,
    },
    fogLock: {
      blockId: row.block_id ?? "BLK_DATASET",
      blockType: "HAUL_ROAD_BLOCK",
      authorization,
      token: {
        tokenId: "TOK_DS_01",
        vehicleId: "V01",
        blockId: row.block_id ?? "BLK_DATASET",
        direction: "A_TO_B",
        issuedAt: now - 2000,
        expiresAt: now + 30000,
        sequence: 1,
        status: "VALID",
      },
      tokenId: "TOK_DS_01",
      direction: "A_TO_B",
      separationM: row.separation_m ? Number(row.separation_m) : 40,
      speedAdvisoryKmh: 30,
      timestampMs: now,
    },
    environment: {
      weather: (row.weather as any) ?? "NORMAL",
      roadCondition: (row.road_condition as any) ?? "DRY",
      visibility: (row.visibility as any) ?? "GOOD",
      simulated: false,
      timestampMs: now,
    },
    sensorHealth: {
      radarValid: distanceM !== null,
      encoderValid: speedMps !== null,
      canValid: true,
      loraValid: true,
      brakeValid: true,
    },
    timestampMs: now,
  };
}
