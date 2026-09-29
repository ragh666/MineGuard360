import {
  RawSensorData,
  CalculatedSafetyData,
  SafetyDecision,
  SafetyEvent,
} from "../src/data/types";
import { SAFETY_CONFIG, SafetyParameters } from "../src/safety/safetyConfig";
import { processSafetyPipeline, PipelineResult } from "../src/safety/safetyEngine";

export { SAFETY_CONFIG };
export type { SafetyParameters, PipelineResult };

export function runSafetyEvaluation(
  raw: RawSensorData,
  params: SafetyParameters = SAFETY_CONFIG,
  brakeVerificationFault: boolean = false
): PipelineResult {
  return processSafetyPipeline(raw, params, brakeVerificationFault);
}

export function createSafetyEvent(
  vehicleId: string,
  blockId: string,
  prevState: string,
  pipeline: PipelineResult,
  extra?: {
    fogLockState?: string;
    movementAuthority?: string;
    sensorStatus?: string;
    communicationStatus?: string;
  }
): SafetyEvent {
  const { decision, calculated, raw } = pipeline;
  return {
    id: `EVT_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    timestampMs: Date.now(),
    timestampStr: new Date().toLocaleTimeString(),
    vehicleId,
    blockId,
    previousState: prevState as any,
    newState: decision.safetyState,
    safetyState: decision.safetyState,
    reasonCode: decision.reasonCode,
    reason: decision.reason,
    ttcSeconds: calculated.ttcSeconds,
    distanceM: calculated.availableDistanceM,
    stoppingDistanceM: calculated.stoppingDistanceM,
    requiredStoppingDistanceM: calculated.requiredStoppingDistanceM,
    availableDistanceM: calculated.availableDistanceM,
    riskScore: decision.aiRiskScore ?? 15,
    riskLevel: decision.aiRiskLevel ?? "LOW",
    fogLockState: extra?.fogLockState ?? "OCCUPIED",
    movementAuthority: extra?.movementAuthority ?? "AUTHORIZED",
    finalDecision: decision.safetyState,
    finalAction: decision.finalAction,
    action: decision.finalAction,
    sensorStatus: extra?.sensorStatus ?? (raw.sensorHealth.radarValid ? "HEALTHY" : "DEGRADED"),
    communicationStatus: extra?.communicationStatus ?? (raw.sensorHealth.loraValid ? "ONLINE" : "OFFLINE"),
  };
}
