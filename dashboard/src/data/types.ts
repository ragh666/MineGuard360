/**
 * FOG-HEMM Safety & Calculation Engine - Core Data Types
 * Strictly separates RAW input data, CALCULATED safety metrics, and DECIDED safety states.
 */

// ---------------------------------------------------------------------------
// 1. RAW DATA MODEL (Simulated / ESP32 / CAN / LoRa Sensor Feed)
// ---------------------------------------------------------------------------

export type ObstacleClass = "HEMM" | "ROCK" | "PERSON" | "VEHICLE" | "EDGE" | "UNKNOWN";

export interface RawRadarData {
  distanceM: number | null;
  relativeVelocityMps: number | null;
  angleDeg: number | null;
  targetCount: number;
  signalStrength: number | null;
  trackPersistence: number | null;
  obstacleClass?: ObstacleClass;
  timestampMs: number;
}

export interface RawVehicleData {
  speedMps: number | null;
  direction: "FORWARD" | "REVERSE" | "UNKNOWN";
  brakeApplied: boolean | null;
  throttlePercent: number | null;
  gear: string | null;
  encoderPulses: number | null;
  engineRpm?: number | null;
  timestampMs: number;
}

export interface FogLockToken {
  tokenId: string;
  vehicleId: string;
  blockId: string;
  direction: "A_TO_B" | "B_TO_A" | "UNKNOWN";
  issuedAt: number;
  expiresAt: number;
  sequence: number;
  status: "VALID" | "EXPIRED" | "INVALID" | "REVOKED";
}

export interface RawFogLockData {
  blockId: string | null;
  blockType: string | null;
  authorization: "GRANT" | "DENY" | "COMM_LOST" | "UNKNOWN";
  token: FogLockToken | null;
  tokenId: string | null;
  direction: "A_TO_B" | "B_TO_A" | "UNKNOWN";
  separationM: number | null;
  speedAdvisoryKmh: number | null;
  timestampMs: number;
}

export interface RawEnvironmentData {
  weather:
    | "NORMAL"
    | "FOG"
    | "DENSE_FOG"
    | "RAIN"
    | "HEAVY_RAIN"
    | "DUST"
    | "MONSOON"
    | "HIGH_HUMIDITY";

  roadCondition: "DRY" | "WET" | "SLIPPERY";

  visibility: "GOOD" | "MODERATE" | "POOR" | "ZERO";

  fogDensityPercent?: number;
  visibilityMeters?: number;
  sensorVisualMode?: "Standard" | "Thermal" | "LiDAR";
  leadObstacleDistanceM?: number;

  simulated: boolean;
  timestampMs: number;
}

export interface SensorHealth {
  radarValid: boolean;
  encoderValid: boolean;
  canValid: boolean;
  loraValid: boolean;
  brakeValid: boolean;
}

export interface RawSensorData {
  radar: RawRadarData;
  vehicle: RawVehicleData;
  fogLock: RawFogLockData;
  environment: RawEnvironmentData;
  sensorHealth: SensorHealth;
  timestampMs: number;
}

// ---------------------------------------------------------------------------
// 2. CALCULATED DATA MODEL (Engine Derived Pure Output)
// ---------------------------------------------------------------------------

export type TtcStatus = "VALID" | "NO_CLOSING" | "UNKNOWN";
export type CorridorType = "LEFT" | "CENTER" | "RIGHT" | "NONE" | "UNKNOWN";
export type CorridorStatus = "CLEAR" | "BLOCKED" | "UNKNOWN";

export interface CalculatedSafetyData {
  closingVelocityMps: number | null;

  ttcSeconds: number | null;
  ttcStatus: TtcStatus;

  reactionDistanceM: number | null;
  brakingDistanceM: number | null;
  stoppingDistanceM: number | null; // D_reaction + D_brake
  requiredStoppingDistanceM: number | null; // D_reaction + D_brake + D_margin

  availableDistanceM: number | null;
  stoppingDistanceMarginM: number | null;

  objectInCorridor: boolean;
  corridor: CorridorType;
  corridorStatus: CorridorStatus;

  edgeClearanceM: number | null;
  separationSafe: boolean | null;
  speedLimitKmh: number | null;
}

// ---------------------------------------------------------------------------
// 3. DECIDED DATA MODEL (Deterministic Engine Outputs & AI Advisory)
// ---------------------------------------------------------------------------

export type SafetyState =
  | "SAFE"
  | "CAUTION"
  | "WARNING"
  | "CRITICAL"
  | "EMERGENCY"
  | "FAULT";

export type FinalAction =
  | "PROCEED"
  | "SPEED_LIMIT"
  | "SLOW_DOWN"
  | "BRAKE"
  | "EMERGENCY_BRAKING"
  | "REDUCED_OPERATION"
  | "STOP";

export type ReasonCode =
  | "NORMAL_OPERATION"
  | "TTC_CAUTION"
  | "TTC_WARNING"
  | "TTC_CRITICAL"
  | "CRITICAL_TTC"
  | "IMMINENT_COLLISION"
  | "INSUFFICIENT_STOPPING_DISTANCE"
  | "CORRIDOR_BLOCKED"
  | "BLOCKED_CORRIDOR"
  | "EDGE_HAZARD"
  | "FOG_LOCK_DENIED"
  | "FOG_LOCK_CONFLICT"
  | "PROTECTED_ZONE_CONFLICT"
  | "BLOCK_RESTRICTION"
  | "SEPARATION_LOW"
  | "RADAR_FAULT"
  | "SENSOR_DEGRADATION"
  | "CAN_FAULT"
  | "ENCODER_FAULT"
  | "BRAKE_FAULT"
  | "BRAKE_VERIFICATION_FAULT"
  | "COMMUNICATION_LOST"
  | "COMMUNICATION_DEGRADATION"
  | "UNKNOWN_DATA";

export interface AiAdvisory {
  riskScore: number | null;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | null;
  isAdvisory: true;
  summary: string;
}

export interface DecisionTrace {
  vehicleSpeedMps: number | null;
  objectDistanceM: number | null;
  closingVelocityMps: number | null;
  ttcSeconds: number | null;
  reactionDistanceM: number | null;
  brakingDistanceM: number | null;
  requiredStoppingDistanceM: number | null;
  availableDistanceM: number | null;
  stoppingDistanceMarginM: number | null;
  corridorStatus: CorridorStatus;
  fogLockAuthorization: string;
  evaluatedPriority: number;
  ruleName: string;
}

export interface SafetyDecision {
  safetyState: SafetyState;
  finalAction: FinalAction;
  recommendedSpeedKmh: number;
  reason: string;
  reasonCode: ReasonCode;
  deterministicPriority: string;
  brakeCommand: boolean;

  aiRiskScore: number | null;
  aiRiskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | null;
  aiIsAdvisory: true;

  trace: DecisionTrace;
  timestampMs: number;
}

// ---------------------------------------------------------------------------
// 4. EVENT LOG & SCENARIO TYPES
// ---------------------------------------------------------------------------

export interface SafetyEvent {
  id: string;
  timestampMs: number;
  timestampStr: string;
  vehicleId: string;
  blockId?: string;
  previousState: SafetyState;
  newState: SafetyState;
  safetyState?: SafetyState;
  reasonCode: ReasonCode;
  reason: string;
  ttcSeconds: number | null;
  distanceM: number | null;
  stoppingDistanceM?: number | null;
  requiredStoppingDistanceM: number | null;
  availableDistanceM: number | null;
  riskScore?: number | null;
  riskLevel?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | null;
  fogLockState?: string;
  movementAuthority?: string;
  finalDecision?: SafetyState;
  finalAction: FinalAction;
  action?: FinalAction;
  sensorStatus?: string;
  communicationStatus?: string;
}

export type ScenarioType =
  | "NORMAL_ROAD"
  | "OBJECT_AHEAD"
  | "APPROACHING_OBJECT"
  | "BLIND_CURVE"
  | "JUNCTION_CONFLICT"
  | "FOLLOWING_TOO_CLOSE"
  | "CRITICAL_TTC"
  | "EMERGENCY_COLLISION"
  | "RADAR_FAILURE"
  | "ENCODER_FAILURE"
  | "CAN_FAILURE"
  | "LORA_FAILURE"
  | "BRAKE_FAILURE"
  | "SENSOR_DISAGREEMENT";
