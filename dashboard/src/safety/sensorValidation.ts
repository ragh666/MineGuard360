import { RawSensorData, SensorHealth } from "../data/types";
import { SafetyParameters } from "./safetyConfig.ts";

export interface SensorValidationResult {
  sensorHealth: SensorHealth;
  staleSensors: {
    radar: boolean;
    can: boolean;
    lora: boolean;
    encoder: boolean;
    brake: boolean;
  };
  isCriticalSensorFault: boolean;
  faultReason: string | null;
}

/**
 * Validates sensor data freshness and signal integrity against configured timeouts.
 *
 * UNKNOWN IS NOT FREE: Stale or missing data will mark sensors invalid rather than assuming safety.
 */
export function validateSensorHealth(
  rawInput: RawSensorData,
  params: SafetyParameters,
  nowMs: number = Date.now()
): SensorValidationResult {
  const { radar, vehicle, fogLock, sensorHealth } = rawInput;

  // Calculate staleness
  const radarStale = nowMs - radar.timestampMs > params.staleDataMs.radar;
  const canStale = nowMs - vehicle.timestampMs > params.staleDataMs.can;
  const loraStale = nowMs - fogLock.timestampMs > params.staleDataMs.lora;
  const encoderStale = nowMs - vehicle.timestampMs > params.staleDataMs.encoder;
  const brakeStale = nowMs - vehicle.timestampMs > params.staleDataMs.brake;

  const validatedHealth: SensorHealth = {
    radarValid: sensorHealth.radarValid && !radarStale && radar.distanceM !== null,
    encoderValid: sensorHealth.encoderValid && !encoderStale && vehicle.speedMps !== null,
    canValid: sensorHealth.canValid && !canStale,
    loraValid: sensorHealth.loraValid && !loraStale,
    brakeValid: sensorHealth.brakeValid && !brakeStale,
  };

  const staleSensors = {
    radar: radarStale,
    can: canStale,
    lora: loraStale,
    encoder: encoderStale,
    brake: brakeStale,
  };

  // Critical sensors: Radar and Encoder are required for safe collision calculation
  let isCriticalSensorFault = false;
  let faultReason: string | null = null;

  if (!validatedHealth.radarValid) {
    isCriticalSensorFault = true;
    faultReason = radarStale
      ? "Radar sensor data feed stale/timeout."
      : "Radar sensor hardware fault or missing distance.";
  } else if (!validatedHealth.encoderValid) {
    isCriticalSensorFault = true;
    faultReason = encoderStale
      ? "Vehicle speed encoder feed stale/timeout."
      : "Encoder speed sensor fault.";
  } else if (!validatedHealth.canValid) {
    isCriticalSensorFault = true;
    faultReason = "CAN bus communication failure.";
  } else if (!validatedHealth.brakeValid) {
    isCriticalSensorFault = true;
    faultReason = "Brake system feedback fault.";
  }

  return {
    sensorHealth: validatedHealth,
    staleSensors,
    isCriticalSensorFault,
    faultReason,
  };
}
