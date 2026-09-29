import {
  AiAdvisory,
  CalculatedSafetyData,
  DecisionTrace,
  FinalAction,
  RawSensorData,
  ReasonCode,
  SafetyDecision,
  SafetyState,
} from "../data/types";
import { FogLockEvaluation } from "./fogLockSafety";
import { SafetyParameters } from "./safetyConfig";
import { SensorValidationResult } from "./sensorValidation";

export interface DecisionEngineInput {
  raw: RawSensorData;
  calculated: CalculatedSafetyData;
  sensorValidation: SensorValidationResult;
  fogLockEval: FogLockEvaluation;
  aiAdvisory: AiAdvisory;
  brakeVerificationFault: boolean;
}

/**
 * Evaluates calculated safety metrics against the 12-level Deterministic Safety Priority Hierarchy.
 *
 * Highest severity condition wins. Lower conditions cannot overwrite higher safety conditions.
 */
export function evaluateDeterministicHierarchy(
  input: DecisionEngineInput,
  params: SafetyParameters
): SafetyDecision {
  const { raw, calculated, sensorValidation, fogLockEval, aiAdvisory, brakeVerificationFault } = input;

  const currentSpeedKmh = (raw.vehicle.speedMps ?? 0) * 3.6;

  // Initial values
  let safetyState: SafetyState = "SAFE";
  let finalAction: FinalAction = "PROCEED";
  let recommendedSpeedKmh = params.prototypeMaxSpeedKmh;
  let reason = "All safety metrics within normal operational bounds.";
  let reasonCode: ReasonCode = "NORMAL_OPERATION";
  let deterministicPriority = "12 - SAFE";
  let brakeCommand = false;
  let ruleName = "LEVEL_12_SAFE";
  let priorityNum = 12;

  // -------------------------------------------------------------------------
  // FAULT OVERRIDE: Hardware Brake Verification Fault
  // -------------------------------------------------------------------------
  if (brakeVerificationFault) {
    safetyState = "FAULT";
    finalAction = "STOP";
    recommendedSpeedKmh = 0;
    reason = "Brake command issued but vehicle deceleration failed verification (Brake Fault).";
    reasonCode = "BRAKE_VERIFICATION_FAULT";
    deterministicPriority = "0 - HARDWARE FAULT OVERRIDE";
    brakeCommand = true;
    ruleName = "BRAKE_VERIFICATION_FAULT";
    priorityNum = 0;
  }
  // -------------------------------------------------------------------------
  // PRIORITY 1: EMERGENCY / IMMINENT COLLISION
  // (TTC <= emergencyTtcS AND object inside projected corridor)
  // -------------------------------------------------------------------------
  else if (
    calculated.ttcSeconds !== null &&
    calculated.ttcSeconds <= params.emergencyTtcS &&
    calculated.objectInCorridor
  ) {
    safetyState = "EMERGENCY";
    finalAction = "EMERGENCY_BRAKING";
    recommendedSpeedKmh = 0;
    reason = `Imminent collision hazard detected! TTC = ${calculated.ttcSeconds}s inside safe corridor.`;
    reasonCode = "IMMINENT_COLLISION";
    deterministicPriority = "1 - EMERGENCY / IMMINENT COLLISION";
    brakeCommand = true;
    ruleName = "EMERGENCY_IMMINENT_COLLISION";
    priorityNum = 1;
  }
  // -------------------------------------------------------------------------
  // PRIORITY 2: CORRIDOR-BLOCKING HAZARD
  // (Object in corridor AND stopping margin is negative / zero)
  // -------------------------------------------------------------------------
  else if (
    calculated.objectInCorridor &&
    calculated.stoppingDistanceMarginM !== null &&
    calculated.stoppingDistanceMarginM <= 0
  ) {
    safetyState = "CRITICAL";
    finalAction = "BRAKE";
    recommendedSpeedKmh = 0;
    reason = `Corridor blocked by hazard at ${calculated.availableDistanceM}m. Required stopping distance is ${calculated.requiredStoppingDistanceM}m.`;
    reasonCode = "CORRIDOR_BLOCKED";
    deterministicPriority = "2 - CORRIDOR-BLOCKING HAZARD";
    brakeCommand = true;
    ruleName = "CORRIDOR_BLOCKING_HAZARD";
    priorityNum = 2;
  }
  // -------------------------------------------------------------------------
  // PRIORITY 3: CRITICAL TTC
  // (TTC <= criticalTtcS)
  // -------------------------------------------------------------------------
  else if (
    calculated.ttcSeconds !== null &&
    calculated.ttcSeconds <= params.criticalTtcS
  ) {
    safetyState = "CRITICAL";
    finalAction = "BRAKE";
    recommendedSpeedKmh = 0;
    reason = `Critical Time-To-Collision limit reached (TTC = ${calculated.ttcSeconds}s <= ${params.criticalTtcS}s). Immediate braking required.`;
    reasonCode = "TTC_CRITICAL";
    deterministicPriority = "3 - CRITICAL TTC";
    brakeCommand = true;
    ruleName = "CRITICAL_TTC";
    priorityNum = 3;
  }
  // -------------------------------------------------------------------------
  // PRIORITY 4: INSUFFICIENT STOPPING DISTANCE
  // (Available distance < Required stopping distance)
  // -------------------------------------------------------------------------
  else if (
    calculated.stoppingDistanceMarginM !== null &&
    calculated.stoppingDistanceMarginM < 0
  ) {
    safetyState = "CRITICAL";
    finalAction = "BRAKE";
    recommendedSpeedKmh = 0;
    reason = `Available distance (${calculated.availableDistanceM}m) is less than required stopping distance (${calculated.requiredStoppingDistanceM}m).`;
    reasonCode = "INSUFFICIENT_STOPPING_DISTANCE";
    deterministicPriority = "4 - INSUFFICIENT STOPPING DISTANCE";
    brakeCommand = true;
    ruleName = "INSUFFICIENT_STOPPING_DISTANCE";
    priorityNum = 4;
  }
  // -------------------------------------------------------------------------
  // PRIORITY 5: SENSOR FAULT (CRITICAL SENSORS MISSING/STALE)
  // (Radar or Encoder invalid/stale)
  // -------------------------------------------------------------------------
  else if (sensorValidation.isCriticalSensorFault) {
    safetyState = "FAULT";
    finalAction = "REDUCED_OPERATION";
    recommendedSpeedKmh = 0;
    reason = sensorValidation.faultReason ?? "Critical sensor hardware fault or stale data feed.";
    reasonCode = sensorValidation.staleSensors.radar
      ? "RADAR_FAULT"
      : sensorValidation.staleSensors.encoder
      ? "ENCODER_FAULT"
      : "CAN_FAULT";
    deterministicPriority = "5 - CRITICAL SENSOR FAULT";
    brakeCommand = true;
    ruleName = "CRITICAL_SENSOR_FAULT";
    priorityNum = 5;
  }
  // -------------------------------------------------------------------------
  // PRIORITY 6: FOG-LOCK CONFLICT
  // (FOG-LOCK DENIED or Token Expired/Invalid)
  // -------------------------------------------------------------------------
  else if (fogLockEval.effectiveAuthorization === "DENY") {
    safetyState = "WARNING";
    finalAction = "SLOW_DOWN";
    recommendedSpeedKmh = 0;
    reason = fogLockEval.reason;
    reasonCode = "FOG_LOCK_DENIED";
    deterministicPriority = "6 - FOG-LOCK CONFLICT";
    brakeCommand = false;
    ruleName = "FOG_LOCK_CONFLICT";
    priorityNum = 6;
  }
  // -------------------------------------------------------------------------
  // PRIORITY 7: ROAD EDGE / HIGHWALL HAZARD
  // (Edge clearance below minimum safety threshold)
  // -------------------------------------------------------------------------
  else if (
    calculated.edgeClearanceM !== null &&
    calculated.edgeClearanceM < params.minRoadEdgeClearanceM
  ) {
    safetyState = "WARNING";
    finalAction = "SLOW_DOWN";
    recommendedSpeedKmh = Math.round(params.prototypeMaxSpeedKmh * (params.warningSpeedPercent / 100));
    reason = `Road edge / highwall clearance low (${calculated.edgeClearanceM}m < ${params.minRoadEdgeClearanceM}m).`;
    reasonCode = "EDGE_HAZARD";
    deterministicPriority = "7 - ROAD EDGE / HIGHWALL HAZARD";
    brakeCommand = false;
    ruleName = "ROAD_EDGE_HAZARD";
    priorityNum = 7;
  }
  // -------------------------------------------------------------------------
  // PRIORITY 8: INSUFFICIENT VEHICLE SEPARATION
  // (Vehicle separation below required protected threshold)
  // -------------------------------------------------------------------------
  else if (calculated.separationSafe === false) {
    safetyState = "WARNING";
    finalAction = "SLOW_DOWN";
    recommendedSpeedKmh = Math.round(params.prototypeMaxSpeedKmh * (params.warningSpeedPercent / 100));
    reason = `Vehicle separation below safe protected distance threshold.`;
    reasonCode = "SEPARATION_LOW";
    deterministicPriority = "8 - INSUFFICIENT VEHICLE SEPARATION";
    brakeCommand = false;
    ruleName = "INSUFFICIENT_VEHICLE_SEPARATION";
    priorityNum = 8;
  }
  // -------------------------------------------------------------------------
  // PRIORITY 9: WARNING TTC
  // (TTC <= warningTtcS)
  // -------------------------------------------------------------------------
  else if (
    calculated.ttcSeconds !== null &&
    calculated.ttcSeconds <= params.warningTtcS
  ) {
    safetyState = "WARNING";
    finalAction = "SLOW_DOWN";
    recommendedSpeedKmh = Math.round(params.prototypeMaxSpeedKmh * (params.warningSpeedPercent / 100));
    reason = `Approaching target: TTC = ${calculated.ttcSeconds}s (Warning threshold <= ${params.warningTtcS}s). Reduce speed.`;
    reasonCode = "TTC_WARNING";
    deterministicPriority = "9 - WARNING TTC";
    brakeCommand = false;
    ruleName = "WARNING_TTC";
    priorityNum = 9;
  }
  // -------------------------------------------------------------------------
  // PRIORITY 10: CAUTION TTC
  // (TTC <= cautionTtcS)
  // -------------------------------------------------------------------------
  else if (
    calculated.ttcSeconds !== null &&
    calculated.ttcSeconds <= params.cautionTtcS
  ) {
    safetyState = "CAUTION";
    finalAction = "SPEED_LIMIT";
    recommendedSpeedKmh = Math.round(params.prototypeMaxSpeedKmh * (params.cautionSpeedPercent / 100));
    reason = `Target detected in path: TTC = ${calculated.ttcSeconds}s (Caution threshold <= ${params.cautionTtcS}s).`;
    reasonCode = "TTC_CAUTION";
    deterministicPriority = "10 - CAUTION TTC";
    brakeCommand = false;
    ruleName = "CAUTION_TTC";
    priorityNum = 10;
  }
  // -------------------------------------------------------------------------
  // PRIORITY 11: SPEED / ENVIRONMENT ADVISORY / COMMUNICATION DEGRADATION
  // (Heavy fog, wet road, or LoRa communication degraded)
  // -------------------------------------------------------------------------
  else if (
    fogLockEval.effectiveAuthorization === "COMM_LOST" ||
    raw.environment.visibility === "POOR" ||
    raw.environment.visibility === "ZERO" ||
    raw.environment.roadCondition === "SLIPPERY"
  ) {
    safetyState = "CAUTION";
    finalAction = "SPEED_LIMIT";

    const fogLockAdvisory = fogLockEval.speedAdvisoryKmh ?? params.prototypeMaxSpeedKmh;
    const envSpeedLimit = raw.environment.visibility === "ZERO" ? 10 : 20;

    recommendedSpeedKmh = Math.min(fogLockAdvisory, envSpeedLimit);
    reason =
      fogLockEval.effectiveAuthorization === "COMM_LOST"
        ? "LoRa comm degraded: applying default safety speed advisory."
        : `Environmental restriction: Weather=${raw.environment.weather}, Visibility=${raw.environment.visibility}.`;
    reasonCode = fogLockEval.effectiveAuthorization === "COMM_LOST" ? "COMMUNICATION_LOST" : "NORMAL_OPERATION";
    deterministicPriority = "11 - ENVIRONMENT / COMM ADVISORY";
    brakeCommand = false;
    ruleName = "ENVIRONMENT_COMM_ADVISORY";
    priorityNum = 11;
  }

  // Apply FOG-LOCK speed advisory clamp if lower than calculated recommended speed
  if (
    fogLockEval.speedAdvisoryKmh !== null &&
    fogLockEval.speedAdvisoryKmh < recommendedSpeedKmh &&
    safetyState !== "CRITICAL" &&
    safetyState !== "EMERGENCY" &&
    safetyState !== "FAULT"
  ) {
    recommendedSpeedKmh = fogLockEval.speedAdvisoryKmh;
  }

  // Diagnostic Trace snapshot for hackathon evaluation and debugging
  const trace: DecisionTrace = {
    vehicleSpeedMps: raw.vehicle.speedMps,
    objectDistanceM: raw.radar.distanceM,
    closingVelocityMps: calculated.closingVelocityMps,
    ttcSeconds: calculated.ttcSeconds,
    reactionDistanceM: calculated.reactionDistanceM,
    brakingDistanceM: calculated.brakingDistanceM,
    requiredStoppingDistanceM: calculated.requiredStoppingDistanceM,
    availableDistanceM: calculated.availableDistanceM,
    stoppingDistanceMarginM: calculated.stoppingDistanceMarginM,
    corridorStatus: calculated.corridorStatus,
    fogLockAuthorization: fogLockEval.effectiveAuthorization,
    evaluatedPriority: priorityNum,
    ruleName,
  };

  return {
    safetyState,
    finalAction,
    recommendedSpeedKmh,
    reason,
    reasonCode,
    deterministicPriority,
    brakeCommand,
    aiRiskScore: aiAdvisory.riskScore,
    aiRiskLevel: aiAdvisory.riskLevel,
    aiIsAdvisory: true,
    trace,
    timestampMs: Date.now(),
  };
}
