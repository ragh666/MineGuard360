import {
  RawSensorData,
  RawEnvironmentData,
  FogLockToken,
  SafetyEvent,
  ScenarioType,
} from "../src/data/types";
import { SAFETY_CONFIG, SafetyParameters } from "../src/safety/safetyConfig";
import { runSafetyEvaluation, createSafetyEvent, PipelineResult } from "./safetyEngineService";
import { saveStateToDb, loadStateFromDb, saveEventToDb, loadEventsFromDb } from "./db";

export interface BlockState {
  blockId: string;
  name: string;
  type: "PHYSICAL" | "VIRTUAL";
  category: "BLIND_CURVE" | "NARROW_ROAD" | "JUNCTION" | "HIGHWALL_EDGE";
  restricted: boolean;
  lengthM: number;
  maxOccupancy: number;
  occupancyState: "FREE" | "RESERVED" | "OCCUPIED" | "EXIT_PENDING";
  currentOccupants: string[];
  protectedSeparationM: number;
  boundarySensors: string;
  weather: RawEnvironmentData["weather"];
  roadCondition: RawEnvironmentData["roadCondition"];
  fogDensityPercent: number;
  visibilityMeters: number;
  visibility: RawEnvironmentData["visibility"];
  movementAuthority: "AUTHORIZED" | "RESTRICTED" | "HOLD";
  tokenStatus: "VALID" | "EXPIRED" | "INVALID" | "REVOKED";
}

export interface UnifiedSystemSummary {
  vehicleId: string;
  selectedBlock: string;
  currentBlock: string;
  targetBlock: string;
  direction: "A_TO_B" | "B_TO_A" | "UNKNOWN";
  vehicleSpeed: number; // km/h
  recommendedSpeed: number; // km/h
  fogDensity: number; // %
  visibilityDistance: number; // m
  weatherCondition: string;
  roadCondition: string;
  objectDetected: boolean;
  objectType: string;
  objectDistance: number; // m
  objectSpeed: number; // km/h
  relativeVelocity: number; // m/s
  ttc: number | null; // s
  stoppingDistance: number; // m
  requiredSafetyDistance: number; // m
  safeSeparationDistance: number; // m
  safeCorridor: {
    left: "AVAILABLE" | "RESTRICTED" | "BLOCKED";
    center: "AVAILABLE" | "RESTRICTED" | "BLOCKED";
    right: "AVAILABLE" | "RESTRICTED" | "BLOCKED";
  };
  protectedZone: boolean;
  blockState: "FREE" | "RESERVED" | "OCCUPIED" | "EXIT_PENDING";
  tokenStatus: "VALID" | "EXPIRED" | "INVALID" | "REVOKED";
  movementAuthority: "AUTHORIZED" | "RESTRICTED" | "HOLD";
  safetyState: string;
  warningLevel: "SAFE" | "CAUTION" | "WARNING" | "CRITICAL" | "EMERGENCY" | "FAULT";
  warningMessage: string;
  sensorHealth: "HEALTHY" | "DEGRADED" | "FAULT";
  radarStatus: "HEALTHY" | "DEGRADED" | "FAULT";
  ld2401AStatus: "HEALTHY" | "FAULT";
  ld2401BStatus: "HEALTHY" | "FAULT";
  loraStatus: "CONNECTED" | "DISCONNECTED";
  canStatus: "AVAILABLE" | "UNAVAILABLE" | "SIMULATED";
  aiStatus: "AVAILABLE" | "UNAVAILABLE";
  lastUpdated: number;
}

export interface SharedSystemState {
  vehicleId: string;
  selectedBlockId: string;
  currentScenario: ScenarioType;
  isDemoRunning: boolean;

  // Primary vehicle pipeline data
  raw: RawSensorData;
  calculated: PipelineResult["calculated"];
  decision: PipelineResult["decision"];

  // Global environment controls
  globalEnvironment: {
    weather: RawEnvironmentData["weather"];
    roadCondition: RawEnvironmentData["roadCondition"];
    visibility: RawEnvironmentData["visibility"];
    fogDensityPercent: number;
    visibilityMeters: number;
    sensorVisualMode: "Standard" | "Thermal" | "LiDAR";
    vehicleSpeedKmh: number;
    leadObstacleDistanceM: number;
    leadObstacleSpeedKmh: number;
  };

  // Hardware fault injection
  activeFaults: {
    radarFault: boolean;
    encoderFault: boolean;
    canFault: boolean;
    loraFault: boolean;
    brakeFault: boolean;
  };
  brakeVerificationFault: boolean;

  // Multi-block management
  blocks: BlockState[];
  tokens: FogLockToken[];

  // Audit event log
  eventLog: SafetyEvent[];

  // Unified Section 4 summary snapshot
  summary: UnifiedSystemSummary;
}

// Automatic Inverse Relationship between Fog Density and Visibility (PoC Demonstration Curve)
export function calculateDemonstrationVisibility(fogDensityPercent: number): {
  visibilityMeters: number;
  weather: RawEnvironmentData["weather"];
  visibility: RawEnvironmentData["visibility"];
} {
  const density = Math.max(0, Math.min(100, Math.round(fogDensityPercent)));
  let visibilityMeters: number;
  let weather: RawEnvironmentData["weather"] = "NORMAL";
  let visibility: RawEnvironmentData["visibility"] = "GOOD";

  if (density <= 20) {
    // 0–20%: 200m+
    visibilityMeters = Math.round(200 - (density / 20) * 50);
    weather = "NORMAL";
    visibility = "GOOD";
  } else if (density <= 40) {
    // 20–40%: 100–200m
    visibilityMeters = Math.round(150 - ((density - 20) / 20) * 50);
    weather = "FOG";
    visibility = "MODERATE";
  } else if (density <= 60) {
    // 40–60%: 50–100m
    visibilityMeters = Math.round(100 - ((density - 40) / 20) * 50);
    weather = "FOG";
    visibility = "MODERATE";
  } else if (density <= 75) {
    // 60–75%: 20–50m
    visibilityMeters = Math.round(50 - ((density - 60) / 15) * 30);
    weather = "DENSE_FOG";
    visibility = "POOR";
  } else if (density <= 90) {
    // 75–90%: 10–20m
    visibilityMeters = Math.round(20 - ((density - 75) / 15) * 10);
    weather = "DENSE_FOG";
    visibility = "POOR";
  } else {
    // 90–100%: 2–10m
    visibilityMeters = Math.max(2, Math.round((10 - ((density - 90) / 10) * 8) * 10) / 10);
    weather = "DENSE_FOG";
    visibility = "ZERO";
  }

  return { visibilityMeters, weather, visibility };
}

const defaultBlocks: BlockState[] = [
  {
    blockId: "B1",
    name: "Blind Curve (Sector 4)",
    type: "PHYSICAL",
    category: "BLIND_CURVE",
    restricted: false,
    lengthM: 120,
    maxOccupancy: 2,
    occupancyState: "OCCUPIED",
    currentOccupants: ["V01"],
    protectedSeparationM: 25,
    boundarySensors: "LD2401-A / LD2401-B ONLINE",
    weather: "NORMAL",
    roadCondition: "DRY",
    fogDensityPercent: 15,
    visibilityMeters: 165,
    visibility: "GOOD",
    movementAuthority: "AUTHORIZED",
    tokenStatus: "VALID",
  },
  {
    blockId: "B2",
    name: "Narrow Haul Road",
    type: "VIRTUAL",
    category: "NARROW_ROAD",
    restricted: false,
    lengthM: 80,
    maxOccupancy: 1,
    occupancyState: "FREE",
    currentOccupants: [],
    protectedSeparationM: 30,
    boundarySensors: "VIRTUAL BEACON ONLINE",
    weather: "DENSE_FOG",
    roadCondition: "WET",
    fogDensityPercent: 85,
    visibilityMeters: 15,
    visibility: "POOR",
    movementAuthority: "RESTRICTED",
    tokenStatus: "VALID",
  },
  {
    blockId: "B3",
    name: "Junction X-Pass",
    type: "VIRTUAL",
    category: "JUNCTION",
    restricted: false,
    lengthM: 60,
    maxOccupancy: 1,
    occupancyState: "FREE",
    currentOccupants: [],
    protectedSeparationM: 20,
    boundarySensors: "VIRTUAL BEACON ONLINE",
    weather: "HEAVY_RAIN",
    roadCondition: "WET",
    fogDensityPercent: 50,
    visibilityMeters: 50,
    visibility: "MODERATE",
    movementAuthority: "RESTRICTED",
    tokenStatus: "VALID",
  },
  {
    blockId: "B4",
    name: "Highwall Cliff Margin",
    type: "VIRTUAL",
    category: "HIGHWALL_EDGE",
    restricted: false,
    lengthM: 150,
    maxOccupancy: 2,
    occupancyState: "FREE",
    currentOccupants: [],
    protectedSeparationM: 35,
    boundarySensors: "VIRTUAL BEACON ONLINE",
    weather: "DENSE_FOG",
    roadCondition: "SLIPPERY",
    fogDensityPercent: 95,
    visibilityMeters: 5,
    visibility: "ZERO",
    movementAuthority: "HOLD",
    tokenStatus: "VALID",
  },
];

const defaultTokens: FogLockToken[] = [
  {
    tokenId: "TOK_99231",
    vehicleId: "HEMM-001",
    blockId: "B1",
    direction: "A_TO_B",
    issuedAt: Date.now() - 5000,
    expiresAt: Date.now() + 55000,
    sequence: 42,
    status: "VALID",
  },
];

export class SystemStateManager {
  private state: SharedSystemState;
  private externalAiRisk: {
    riskScore: number;
    riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    modelStatus: string;
    updatedAt: number;
  } | null = null;

  constructor() {
    // Attempt to load previous state from SQLite
    const saved = loadStateFromDb("current");
    const savedEvents = loadEventsFromDb(50);

    const initialBlocks = saved?.blocks ?? defaultBlocks;
    const initialTokens = saved?.tokens ?? defaultTokens;
    const initialGlobalEnv = saved?.globalEnvironment ?? {
      weather: "DENSE_FOG",
      roadCondition: "WET",
      visibility: "POOR",
      fogDensityPercent: 85,
      visibilityMeters: 15,
      sensorVisualMode: "Standard" as const,
      vehicleSpeedKmh: 27,
      leadObstacleDistanceM: 20,
      leadObstacleSpeedKmh: 13,
    };

    const initialFaults = saved?.activeFaults ?? {
      radarFault: false,
      encoderFault: false,
      canFault: false,
      loraFault: false,
      brakeFault: false,
    };

    const initialRaw: RawSensorData = {
      radar: {
        distanceM: initialGlobalEnv.leadObstacleDistanceM,
        relativeVelocityMps: -3.89, // closing
        angleDeg: 0,
        targetCount: 1,
        signalStrength: 92,
        trackPersistence: 0.99,
        timestampMs: Date.now(),
      },
      vehicle: {
        speedMps: initialGlobalEnv.vehicleSpeedKmh / 3.6,
        direction: "FORWARD",
        brakeApplied: false,
        throttlePercent: 25,
        gear: "D",
        encoderPulses: 550,
        timestampMs: Date.now(),
      },
      fogLock: {
        blockId: saved?.selectedBlockId ?? "B1",
        blockType: "HAUL_ROAD_BLOCK",
        authorization: "GRANT",
        token: initialTokens[0] ?? null,
        tokenId: initialTokens[0]?.tokenId ?? "TOK_99231",
        direction: "A_TO_B",
        separationM: 45,
        speedAdvisoryKmh: 25,
        timestampMs: Date.now(),
      },
      environment: {
        weather: initialGlobalEnv.weather,
        roadCondition: initialGlobalEnv.roadCondition,
        visibility: initialGlobalEnv.visibility,
        fogDensityPercent: initialGlobalEnv.fogDensityPercent,
        visibilityMeters: initialGlobalEnv.visibilityMeters,
        sensorVisualMode: initialGlobalEnv.sensorVisualMode,
        leadObstacleDistanceM: initialGlobalEnv.leadObstacleDistanceM,
        simulated: true,
        timestampMs: Date.now(),
      },
      sensorHealth: {
        radarValid: !initialFaults.radarFault,
        encoderValid: !initialFaults.encoderFault,
        canValid: !initialFaults.canFault,
        loraValid: !initialFaults.loraFault,
        brakeValid: !initialFaults.brakeFault,
      },
      timestampMs: Date.now(),
    };

    const pipeline = runSafetyEvaluation(initialRaw, SAFETY_CONFIG, false);

    this.state = {
      vehicleId: "HEMM-001",
      selectedBlockId: saved?.selectedBlockId ?? "B1",
      currentScenario: saved?.currentScenario ?? "NORMAL_ROAD",
      isDemoRunning: false,
      raw: pipeline.raw,
      calculated: pipeline.calculated,
      decision: pipeline.decision,
      globalEnvironment: initialGlobalEnv,
      activeFaults: initialFaults,
      brakeVerificationFault: false,
      blocks: initialBlocks,
      tokens: initialTokens,
      eventLog: savedEvents.length > 0 ? savedEvents : (saved?.eventLog ?? []),
      summary: this.generateUnifiedSummary(
        "HEMM-001",
        saved?.selectedBlockId ?? "B1",
        initialGlobalEnv,
        initialFaults,
        pipeline,
        initialBlocks
      ),
    };

    // Recompute pipeline on initial load
    this.recompute();
  }

  public getState(): SharedSystemState {
    return this.state;
  }

  public setAiRisk(
    riskScore: number,
    riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
    modelStatus: string = "AVAILABLE"
  ): void {
    this.externalAiRisk = {
      riskScore: Math.max(0, Math.min(100, Math.round(riskScore))),
      riskLevel,
      modelStatus,
      updatedAt: Date.now(),
    };
    this.recompute();
  }

  public getAiRisk() {
    return this.externalAiRisk;
  }

  public recompute(): PipelineResult {
    const prevDecision = this.state.decision;
    const { globalEnvironment, activeFaults, selectedBlockId, brakeVerificationFault, blocks } = this.state;

    // Find active block to ensure block-specific consistency
    const activeBlock = blocks.find((b) => b.blockId === selectedBlockId) ?? blocks[0];

    // Check block occupancy / FOG-LOCK authorization conflict
    const isBlockConflict = this.state.currentScenario === "NORMAL_ROAD"
      ? false
      : (activeBlock.restricted || (activeBlock.occupancyState === "OCCUPIED" && !activeBlock.currentOccupants.includes("V01") && !activeBlock.currentOccupants.includes("HEMM-001")));
    const isLoraDown = activeFaults.loraFault;

    const fogLockAuth: RawSensorData["fogLock"]["authorization"] = isLoraDown
      ? "COMM_LOST"
      : isBlockConflict
      ? "DENY"
      : "GRANT";

    // Build raw data
    const updatedRaw: RawSensorData = {
      radar: {
        distanceM: activeFaults.radarFault ? null : globalEnvironment.leadObstacleDistanceM,
        relativeVelocityMps: activeFaults.radarFault ? null : (globalEnvironment.leadObstacleSpeedKmh - globalEnvironment.vehicleSpeedKmh) / 3.6,
        angleDeg: 0,
        targetCount: activeFaults.radarFault ? 0 : 1,
        signalStrength: activeFaults.radarFault ? 0 : 92,
        trackPersistence: activeFaults.radarFault ? 0 : 0.99,
        timestampMs: Date.now(),
      },
      vehicle: {
        speedMps: activeFaults.encoderFault ? null : globalEnvironment.vehicleSpeedKmh / 3.6,
        direction: "FORWARD",
        brakeApplied: prevDecision.brakeCommand,
        throttlePercent: prevDecision.brakeCommand ? 0 : 25,
        gear: "D",
        encoderPulses: activeFaults.encoderFault ? null : Math.round(globalEnvironment.vehicleSpeedKmh * 15),
        timestampMs: Date.now(),
      },
      fogLock: {
        blockId: selectedBlockId,
        blockType: activeBlock.type === "PHYSICAL" ? "PHYSICAL_BLOCK" : "VIRTUAL_BLOCK",
        authorization: fogLockAuth,
        token: (() => {
          const tok = this.state.tokens.find((t) => t.blockId === selectedBlockId) ?? this.state.tokens[0];
          if (!tok) return null;
          if (this.state.currentScenario === "NORMAL_ROAD") {
            return {
              ...tok,
              vehicleId: "V01",
              status: "VALID" as const,
              expiresAt: Date.now() + 3600000,
            };
          }
          return tok;
        })(),
        tokenId: this.state.tokens.find((t) => t.blockId === selectedBlockId)?.tokenId ?? null,
        direction: "A_TO_B",
        separationM: activeBlock.protectedSeparationM + 15,
        speedAdvisoryKmh: activeBlock.restricted ? 0 : 25,
        timestampMs: Date.now(),
      },
      environment: {
        weather: globalEnvironment.weather,
        roadCondition: globalEnvironment.roadCondition,
        visibility: globalEnvironment.visibility,
        fogDensityPercent: globalEnvironment.fogDensityPercent,
        visibilityMeters: globalEnvironment.visibilityMeters,
        sensorVisualMode: globalEnvironment.sensorVisualMode,
        leadObstacleDistanceM: globalEnvironment.leadObstacleDistanceM,
        simulated: true,
        timestampMs: Date.now(),
      },
      sensorHealth: {
        radarValid: !activeFaults.radarFault,
        encoderValid: !activeFaults.encoderFault,
        canValid: !activeFaults.canFault,
        loraValid: !activeFaults.loraFault,
        brakeValid: !activeFaults.brakeFault,
      },
      timestampMs: Date.now(),
    };

    const pipeline = runSafetyEvaluation(updatedRaw, SAFETY_CONFIG, brakeVerificationFault);

    // Apply external AI risk advisory if available (Advisory only — NEVER directly commands brakes)
    if (this.externalAiRisk) {
      pipeline.decision.aiRiskScore = this.externalAiRisk.riskScore;
      pipeline.decision.aiRiskLevel = this.externalAiRisk.riskLevel;

      // Deterministic Resolver Rule: If AI risk is high/critical and vehicle was in nominal safe state,
      // advise speed reduction without bypassing physical safety logic or claiming false emergency brake authority
      if (
        (this.externalAiRisk.riskLevel === "CRITICAL" || this.externalAiRisk.riskLevel === "HIGH") &&
        pipeline.decision.safetyState === "SAFE"
      ) {
        pipeline.decision.safetyState = "WARNING";
        pipeline.decision.finalAction = "SLOW_DOWN";
        pipeline.decision.recommendedSpeedKmh = Math.min(pipeline.decision.recommendedSpeedKmh, 20);
        pipeline.decision.reason = `AI Risk Advisory elevated (${this.externalAiRisk.riskLevel} - Score ${this.externalAiRisk.riskScore}). Precautionary speed reduction advisory.`;
        pipeline.decision.reasonCode = "TTC_CAUTION";
        pipeline.decision.deterministicPriority = "12 - AI RISK ADVISORY";
        pipeline.decision.brakeCommand = false;
      }
    }

    // Event logging if safety state transitioned
    let updatedLog = this.state.eventLog;
    if (prevDecision && prevDecision.safetyState !== pipeline.decision.safetyState) {
      const newEvt = createSafetyEvent(
        "HEMM-001",
        selectedBlockId,
        prevDecision.safetyState,
        pipeline,
        {
          fogLockState: activeBlock.occupancyState,
          movementAuthority: activeBlock.movementAuthority,
          sensorStatus: activeFaults.radarFault ? "DEGRADED" : "HEALTHY",
          communicationStatus: activeFaults.loraFault ? "OFFLINE" : "ONLINE",
        }
      );
      updatedLog = [newEvt, ...this.state.eventLog].slice(0, 50);
      saveEventToDb(newEvt);
    }

    this.state.raw = pipeline.raw;
    this.state.calculated = pipeline.calculated;
    this.state.decision = pipeline.decision;
    this.state.eventLog = updatedLog;

    // Update block state
    this.state.blocks = this.state.blocks.map((b) => {
      if (b.blockId === selectedBlockId) {
        return {
          ...b,
          weather: globalEnvironment.weather,
          roadCondition: globalEnvironment.roadCondition,
          fogDensityPercent: globalEnvironment.fogDensityPercent,
          visibilityMeters: globalEnvironment.visibilityMeters,
          visibility: globalEnvironment.visibility,
          movementAuthority: pipeline.decision.brakeCommand
            ? "HOLD"
            : pipeline.decision.safetyState === "SAFE"
            ? "AUTHORIZED"
            : "RESTRICTED",
        };
      }
      return b;
    });

    // Update unified summary
    this.state.summary = this.generateUnifiedSummary(
      this.state.vehicleId,
      selectedBlockId,
      globalEnvironment,
      activeFaults,
      pipeline,
      this.state.blocks
    );

    // Persist snapshot to SQLite
    saveStateToDb("current", {
      selectedBlockId: this.state.selectedBlockId,
      currentScenario: this.state.currentScenario,
      globalEnvironment: this.state.globalEnvironment,
      activeFaults: this.state.activeFaults,
      blocks: this.state.blocks,
      tokens: this.state.tokens,
      eventLog: this.state.eventLog,
    });

    return pipeline;
  }

  public setGlobalEnvironment(env: Partial<SharedSystemState["globalEnvironment"]>): void {
    let updated = { ...this.state.globalEnvironment, ...env };

    // If fog density changed, apply demonstration inverse visibility curve automatically
    if (env.fogDensityPercent !== undefined && env.visibilityMeters === undefined) {
      const computed = calculateDemonstrationVisibility(env.fogDensityPercent);
      updated.visibilityMeters = computed.visibilityMeters;
      if (env.weather === undefined) updated.weather = computed.weather;
      if (env.visibility === undefined) updated.visibility = computed.visibility;
    }

    this.state.globalEnvironment = updated;
    this.recompute();
  }

  public setVehicleDynamics(speedKmh: number, leadDistanceM: number, leadSpeedKmh?: number): void {
    this.state.globalEnvironment.vehicleSpeedKmh = speedKmh;
    this.state.globalEnvironment.leadObstacleDistanceM = leadDistanceM;
    if (leadSpeedKmh !== undefined) {
      this.state.globalEnvironment.leadObstacleSpeedKmh = leadSpeedKmh;
    }
    this.recompute();
  }

  public setSelectedBlock(blockId: string): void {
    this.state.selectedBlockId = blockId;
    const foundBlock = this.state.blocks.find((b) => b.blockId === blockId);
    if (foundBlock) {
      // Sync global environment to block's current environment
      this.state.globalEnvironment.weather = foundBlock.weather;
      this.state.globalEnvironment.roadCondition = foundBlock.roadCondition;
      this.state.globalEnvironment.fogDensityPercent = foundBlock.fogDensityPercent;
      this.state.globalEnvironment.visibilityMeters = foundBlock.visibilityMeters;
      this.state.globalEnvironment.visibility = foundBlock.visibility;
    }
    this.recompute();
  }

  public updateBlock(blockId: string, updates: Partial<BlockState>): void {
    this.state.blocks = this.state.blocks.map((b) => {
      if (b.blockId === blockId) {
        return { ...b, ...updates };
      }
      return b;
    });

    if (this.state.selectedBlockId === blockId) {
      if (updates.fogDensityPercent !== undefined || updates.roadCondition !== undefined || updates.weather !== undefined) {
        this.state.globalEnvironment = {
          ...this.state.globalEnvironment,
          ...(updates.fogDensityPercent !== undefined ? { fogDensityPercent: updates.fogDensityPercent } : {}),
          ...(updates.visibilityMeters !== undefined ? { visibilityMeters: updates.visibilityMeters } : {}),
          ...(updates.roadCondition !== undefined ? { roadCondition: updates.roadCondition } : {}),
          ...(updates.weather !== undefined ? { weather: updates.weather } : {}),
        };
      }
    }

    this.recompute();
  }

  public toggleFault(faultKey: keyof SharedSystemState["activeFaults"]): void {
    this.state.activeFaults[faultKey] = !this.state.activeFaults[faultKey];
    this.recompute();
  }

  public clearAllFaults(): void {
    this.state.activeFaults = {
      radarFault: false,
      encoderFault: false,
      canFault: false,
      loraFault: false,
      brakeFault: false,
    };
    this.state.brakeVerificationFault = false;
    this.recompute();
  }

  public setScenario(scenario: ScenarioType): void {
    this.state.currentScenario = scenario;

    switch (scenario) {
      case "NORMAL_ROAD":
        this.clearAllFaults();
        // Ensure active block is free, authorized, and not restricted
        {
          const activeBlk = this.state.blocks.find((b) => b.blockId === this.state.selectedBlockId);
          if (activeBlk) {
            activeBlk.restricted = false;
            activeBlk.movementAuthority = "AUTHORIZED";
            if (!activeBlk.currentOccupants.includes("V01")) {
              activeBlk.currentOccupants.push("V01");
            }
          }
          const t = this.state.tokens.find((tok) => tok.blockId === this.state.selectedBlockId);
          if (t) {
            t.status = "VALID";
            t.vehicleId = "V01";
            t.expiresAt = Date.now() + 3600000;
          }
        }
        this.setGlobalEnvironment({
          weather: "NORMAL",
          roadCondition: "DRY",
          visibility: "GOOD",
          fogDensityPercent: 0,
          visibilityMeters: 200,
          vehicleSpeedKmh: 20,
          leadObstacleDistanceM: 80,
          leadObstacleSpeedKmh: 20,
        });
        break;

      case "OBJECT_AHEAD":
        this.clearAllFaults();
        this.setGlobalEnvironment({
          weather: "NORMAL",
          roadCondition: "DRY",
          fogDensityPercent: 20,
          visibilityMeters: 150,
          vehicleSpeedKmh: 30,
          leadObstacleDistanceM: 35,
          leadObstacleSpeedKmh: 20,
        });
        break;

      case "APPROACHING_OBJECT":
        this.clearAllFaults();
        this.setGlobalEnvironment({
          weather: "FOG",
          roadCondition: "WET",
          fogDensityPercent: 50,
          visibilityMeters: 50,
          vehicleSpeedKmh: 38,
          leadObstacleDistanceM: 28,
          leadObstacleSpeedKmh: 12,
        });
        break;

      case "BLIND_CURVE":
        this.clearAllFaults();
        this.setSelectedBlock("B1");
        this.setGlobalEnvironment({
          weather: "DENSE_FOG",
          roadCondition: "WET",
          fogDensityPercent: 85,
          visibilityMeters: 15,
          vehicleSpeedKmh: 27,
          leadObstacleDistanceM: 20,
          leadObstacleSpeedKmh: 10,
        });
        break;

      case "JUNCTION_CONFLICT":
        this.clearAllFaults();
        this.setSelectedBlock("B3");
        this.setGlobalEnvironment({
          weather: "HEAVY_RAIN",
          roadCondition: "WET",
          fogDensityPercent: 65,
          visibilityMeters: 30,
          vehicleSpeedKmh: 25,
          leadObstacleDistanceM: 22,
          leadObstacleSpeedKmh: 0,
        });
        break;

      case "FOLLOWING_TOO_CLOSE":
        this.clearAllFaults();
        this.setGlobalEnvironment({
          weather: "NORMAL",
          roadCondition: "WET",
          fogDensityPercent: 30,
          visibilityMeters: 120,
          vehicleSpeedKmh: 42,
          leadObstacleDistanceM: 14,
          leadObstacleSpeedKmh: 38,
        });
        break;

      case "CRITICAL_TTC":
        this.clearAllFaults();
        this.setGlobalEnvironment({
          weather: "DENSE_FOG",
          roadCondition: "SLIPPERY",
          fogDensityPercent: 85,
          visibilityMeters: 15,
          vehicleSpeedKmh: 36,
          leadObstacleDistanceM: 15,
          leadObstacleSpeedKmh: 5,
        });
        break;

      case "EMERGENCY_COLLISION":
        this.clearAllFaults();
        this.setGlobalEnvironment({
          weather: "DENSE_FOG",
          roadCondition: "SLIPPERY",
          fogDensityPercent: 95,
          visibilityMeters: 5,
          vehicleSpeedKmh: 45,
          leadObstacleDistanceM: 9,
          leadObstacleSpeedKmh: 0,
        });
        break;

      case "RADAR_FAILURE":
        this.clearAllFaults();
        this.state.activeFaults.radarFault = true;
        this.recompute();
        break;

      case "ENCODER_FAILURE":
        this.clearAllFaults();
        this.state.activeFaults.encoderFault = true;
        this.recompute();
        break;

      case "CAN_FAILURE":
        this.clearAllFaults();
        this.state.activeFaults.canFault = true;
        this.recompute();
        break;

      case "LORA_FAILURE":
        this.clearAllFaults();
        this.state.activeFaults.loraFault = true;
        this.recompute();
        break;

      case "BRAKE_FAILURE":
        this.clearAllFaults();
        this.state.brakeVerificationFault = true;
        this.recompute();
        break;

      case "SENSOR_DISAGREEMENT":
        this.clearAllFaults();
        this.state.activeFaults.radarFault = true;
        this.recompute();
        break;
    }
  }

  public clearEventLog(): void {
    this.state.eventLog = [];
  }

  private generateUnifiedSummary(
    vehicleId: string,
    selectedBlockId: string,
    env: SharedSystemState["globalEnvironment"],
    faults: SharedSystemState["activeFaults"],
    pipeline: PipelineResult,
    blocks: BlockState[]
  ): UnifiedSystemSummary {
    const activeBlock = blocks.find((b) => b.blockId === selectedBlockId) ?? blocks[0];
    const { calculated, decision, raw } = pipeline;

    const corridorLeft: "AVAILABLE" | "RESTRICTED" | "BLOCKED" =
      calculated.corridor === "LEFT" && calculated.corridorStatus === "BLOCKED"
        ? "BLOCKED"
        : calculated.corridor === "LEFT"
        ? "RESTRICTED"
        : "AVAILABLE";

    const corridorCenter: "AVAILABLE" | "RESTRICTED" | "BLOCKED" =
      calculated.corridor === "CENTER" && calculated.corridorStatus === "BLOCKED"
        ? "BLOCKED"
        : calculated.corridor === "CENTER"
        ? "RESTRICTED"
        : "AVAILABLE";

    const corridorRight: "AVAILABLE" | "RESTRICTED" | "BLOCKED" =
      calculated.corridor === "RIGHT" && calculated.corridorStatus === "BLOCKED"
        ? "BLOCKED"
        : calculated.corridor === "RIGHT"
        ? "RESTRICTED"
        : "AVAILABLE";

    const warningLevel: UnifiedSystemSummary["warningLevel"] =
      decision.safetyState === "EMERGENCY"
        ? "EMERGENCY"
        : decision.safetyState === "CRITICAL"
        ? "CRITICAL"
        : decision.safetyState === "WARNING"
        ? "WARNING"
        : decision.safetyState === "CAUTION"
        ? "CAUTION"
        : decision.safetyState === "FAULT"
        ? "FAULT"
        : "SAFE";

    const movementAuthority: UnifiedSystemSummary["movementAuthority"] =
      decision.brakeCommand
        ? "HOLD"
        : decision.safetyState === "SAFE"
        ? "AUTHORIZED"
        : "RESTRICTED";

    return {
      vehicleId,
      selectedBlock: selectedBlockId,
      currentBlock: selectedBlockId,
      targetBlock: selectedBlockId === "B1" ? "B2" : selectedBlockId === "B2" ? "B3" : selectedBlockId === "B3" ? "B4" : "B1",
      direction: "A_TO_B",
      vehicleSpeed: env.vehicleSpeedKmh,
      recommendedSpeed: decision.recommendedSpeedKmh,
      fogDensity: env.fogDensityPercent,
      visibilityDistance: env.visibilityMeters,
      weatherCondition: env.weather,
      roadCondition: env.roadCondition,
      objectDetected: !faults.radarFault && raw.radar.distanceM !== null,
      objectType: "VEHICLE",
      objectDistance: raw.radar.distanceM ?? 0,
      objectSpeed: env.leadObstacleSpeedKmh,
      relativeVelocity: raw.radar.relativeVelocityMps ?? 0,
      ttc: calculated.ttcSeconds,
      stoppingDistance: calculated.stoppingDistanceM ?? 0,
      requiredSafetyDistance: calculated.requiredStoppingDistanceM ?? 0,
      safeSeparationDistance: activeBlock.protectedSeparationM,
      safeCorridor: {
        left: corridorLeft,
        center: corridorCenter,
        right: corridorRight,
      },
      protectedZone: activeBlock.restricted,
      blockState: activeBlock.occupancyState,
      tokenStatus: activeBlock.tokenStatus,
      movementAuthority,
      safetyState: decision.safetyState,
      warningLevel,
      warningMessage: decision.reason,
      sensorHealth: faults.radarFault || faults.encoderFault ? "FAULT" : faults.canFault ? "DEGRADED" : "HEALTHY",
      radarStatus: faults.radarFault ? "FAULT" : "HEALTHY",
      ld2401AStatus: "HEALTHY",
      ld2401BStatus: "HEALTHY",
      loraStatus: faults.loraFault ? "DISCONNECTED" : "CONNECTED",
      canStatus: faults.canFault ? "UNAVAILABLE" : "SIMULATED",
      aiStatus: "AVAILABLE",
      lastUpdated: Date.now(),
    };
  }
}

export const stateManager = new SystemStateManager();
