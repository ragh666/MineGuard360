import {
  AiAdvisory,
  CalculatedSafetyData,
  RawSensorData,
  SafetyDecision,
} from "../data/types";
import { evaluateCorridor, evaluateEdgeClearance } from "./corridorSafety";
import { evaluateDeterministicHierarchy } from "./decisionHierarchy";
import { validateFogLockToken } from "./fogLockSafety";
import { SAFETY_CONFIG, SafetyParameters } from "./safetyConfig";
import { validateSensorHealth } from "./sensorValidation";
import { evaluateSeparation } from "./separation";
import {
  calculateBrakingDistance,
  calculateReactionDistance,
  calculateRequiredStoppingDistance,
  calculateStoppingMargin,
} from "./stoppingDistance";
import { calculateClosingVelocity, calculateTTC } from "./ttc";

export interface PipelineResult {
  raw: RawSensorData;
  calculated: CalculatedSafetyData;
  decision: SafetyDecision;
}

/**
 * Main Pure Pipeline Execution Function:
 * RAW INPUT -> VALIDATION -> CALCULATIONS -> DETERMINISTIC DECISION
 *
 * Implements the core architecture specified in FOG-HEMM Phase 1 Prompt.
 * AI/ML outputs remain strictly advisory and cannot override deterministic safety logic.
 *
 * @param raw Input RAW sensor data object
 * @param params Configured safety thresholds (defaults to SAFETY_CONFIG)
 * @param brakeVerificationFault Optional simulator flag indicating mechanical brake actuator failure
 */
export function processSafetyPipeline(
  raw: RawSensorData,
  params: SafetyParameters = SAFETY_CONFIG,
  brakeVerificationFault: boolean = false
): PipelineResult {
  // STEP 1: VALIDATION LAYER
  const sensorValidation = validateSensorHealth(raw, params);

  // STEP 2: CALCULATION ENGINE
  // 2a. Closing Velocity
  const closingVelocityMps = calculateClosingVelocity(raw.radar.relativeVelocityMps);

  // 2b. Time-To-Collision (TTC)
  const { ttcSeconds, ttcStatus } = calculateTTC(
    raw.radar.distanceM,
    closingVelocityMps
  );

  // 2c. Stopping Distances
  const speedMps = raw.vehicle.speedMps;
  const reactionDistanceM = calculateReactionDistance(speedMps, params.reactionTimeS);
  const brakingDistanceM = calculateBrakingDistance(
    speedMps,
    params.nominalDecelerationMps2
  );
  const stoppingDistanceM =
    reactionDistanceM !== null && brakingDistanceM !== null
      ? Math.round((reactionDistanceM + brakingDistanceM) * 100) / 100
      : null;

  const requiredStoppingDistanceM = calculateRequiredStoppingDistance(
    reactionDistanceM,
    brakingDistanceM,
    params.safetyMarginM
  );

  const availableDistanceM = raw.radar.distanceM;
  const stoppingDistanceMarginM = calculateStoppingMargin(
    availableDistanceM,
    requiredStoppingDistanceM
  );

  // 2d. Safe Corridor Occupancy
  const corridorEval = evaluateCorridor(raw.radar, params.corridorHalfWidthM);

  // 2e. Road Edge / Highwall Clearance
  const edgeEval = evaluateEdgeClearance(raw.radar, raw.environment, params.minRoadEdgeClearanceM);

  // 2f. Vehicle Separation
  const separationEval = evaluateSeparation(
    raw.fogLock.separationM,
    params.vehicleLengthM,
    reactionDistanceM,
    brakingDistanceM,
    params.safetyMarginM,
    params.minimumSafeSeparationM
  );

  // 2g. FOG-LOCK Digital Authorization
  const fogLockEval = validateFogLockToken(raw.fogLock, "V01", raw.timestampMs);

  // Assemble Calculated Safety Data
  const calculated: CalculatedSafetyData = {
    closingVelocityMps,
    ttcSeconds,
    ttcStatus,
    reactionDistanceM,
    brakingDistanceM,
    stoppingDistanceM,
    requiredStoppingDistanceM,
    availableDistanceM,
    stoppingDistanceMarginM,
    objectInCorridor: corridorEval.objectInCorridor,
    corridor: corridorEval.corridor,
    corridorStatus: corridorEval.corridorStatus,
    edgeClearanceM: edgeEval.edgeClearanceM,
    separationSafe: separationEval.separationSafe,
    speedLimitKmh: fogLockEval.speedAdvisoryKmh ?? params.prototypeMaxSpeedKmh,
  };

  // STEP 3: AI/ML ADVISORY GENERATION (DEMONSTRATION ONLY)
  // AI score derived for demonstration purposes. Clearly marked as ADVISORY ONLY.
  const aiAdvisory: AiAdvisory = generateDemoAiAdvisory(
    ttcSeconds,
    stoppingDistanceMarginM,
    corridorEval.objectInCorridor
  );

  // STEP 4: DETERMINISTIC SAFETY LOGIC (FINAL DECISION AUTHORITY)
  const decision = evaluateDeterministicHierarchy(
    {
      raw,
      calculated,
      sensorValidation,
      fogLockEval,
      aiAdvisory,
      brakeVerificationFault,
    },
    params
  );

  return {
    raw,
    calculated,
    decision,
  };
}

/**
 * Generates synthetic AI/ML risk score for UI advisory comparison demonstration.
 */
function generateDemoAiAdvisory(
  ttcSeconds: number | null,
  marginM: number | null,
  objectInCorridor: boolean
): AiAdvisory {
  if (ttcSeconds === null && marginM === null) {
    return {
      riskScore: 10,
      riskLevel: "LOW",
      isAdvisory: true,
      summary: "AI / ML DEMONSTRATION — ADVISORY ONLY (Low nominal risk)",
    };
  }

  let riskScore = 15;
  if (ttcSeconds !== null) {
    if (ttcSeconds < 1.5) riskScore += 65;
    else if (ttcSeconds < 4.0) riskScore += 45;
    else if (ttcSeconds < 7.0) riskScore += 25;
  }

  if (marginM !== null && marginM < 0) {
    riskScore += 20;
  }

  if (objectInCorridor) {
    riskScore += 10;
  }

  riskScore = Math.min(99, Math.max(5, riskScore));

  let riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";
  if (riskScore >= 80) riskLevel = "CRITICAL";
  else if (riskScore >= 60) riskLevel = "HIGH";
  else if (riskScore >= 35) riskLevel = "MEDIUM";

  return {
    riskScore,
    riskLevel,
    isAdvisory: true,
    summary: "AI / ML DEMONSTRATION — ADVISORY ONLY",
  };
}
