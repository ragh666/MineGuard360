import { create } from "zustand";
import { datasetRowToRawData, RawDatasetRow } from "../data/datasetAdapter";
import { mockEngineInstance } from "../data/mockDataEngine";
import {
  CalculatedSafetyData,
  FogLockToken,
  RawEnvironmentData,
  RawSensorData,
  SafetyDecision,
  SafetyEvent,
  ScenarioType,
} from "../data/types";
import { SAFETY_CONFIG, SafetyParameters } from "../safety/safetyConfig";
import { processSafetyPipeline } from "../safety/safetyEngine";
import { socketService, ConnectionStatus } from "../services/socketClient";

export type AppViewMode = "DRIVER_DISPLAY" | "CONTROL_ROOM_DASHBOARD";

// Inverse Relationship between Fog Density and Visibility (PoC Demonstration Curve)
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

export type DashboardPageId =
  | "OVERVIEW"
  | "FLEET_MONITOR"
  | "BLOCK_MANAGER"
  | "MOVEMENT_TOKENS"
  | "RISK_MONITOR"
  | "SAFETY_ANALYTICS"
  | "ENVIRONMENT_SIMULATION"
  | "EVENT_LOG"
  | "SYSTEM_HEALTH"
  | "CONFIG"
  | "HELP"
  | "SAFETY_METRICS";

export interface DashboardBlockInfo {
  blockId: string;
  name: string;
  type: "PHYSICAL" | "VIRTUAL";
  category: "BLIND_CURVE" | "NARROW_ROAD" | "JUNCTION" | "HIGHWALL_EDGE";
  restricted: boolean;
  lengthM: number;
  maxOccupancy: number;
  currentOccupants: string[];
  protectedSeparationM: number;
  boundarySensors: string;
}

export interface SyntheticVehicleInfo {
  vehicleId: string;
  name: string;
  status: "SAFE" | "CAUTION" | "WARNING" | "CRITICAL" | "EMERGENCY" | "FAULT";
  speedKmh: number;
  blockId: string;
  ttcSeconds: number | null;
  aiRiskScore: number;
  aiRiskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  batteryVoltageV: number;
  isPrototypeReal: boolean;
}

export interface VehicleStoreState {
  // Backend Connection
  backendConnected: boolean;
  connectionStatus: ConnectionStatus;

  // Navigation & View
  activeAppView: AppViewMode;
  activeDashboardPage: DashboardPageId;
  isFleetScalePreview: boolean;

  // Core Pipeline Data for Primary Vehicle (V01)
  raw: RawSensorData;
  calculated: CalculatedSafetyData;
  decision: SafetyDecision;

  // Environment & Fault Injection (Control Room Authority)
  globalEnvironment: {
    weather: RawEnvironmentData["weather"];
    roadCondition: RawEnvironmentData["roadCondition"];
    visibility: RawEnvironmentData["visibility"];
    fogDensityPercent: number;
    visibilityMeters: number;
    sensorVisualMode: "Standard" | "Thermal" | "LiDAR";
    vehicleSpeedKmh: number;
    leadObstacleDistanceM: number;
  };

  activeFaults: {
    radarFault: boolean;
    encoderFault: boolean;
    canFault: boolean;
    loraFault: boolean;
    brakeFault: boolean;
  };

  // Block Management & Tokens
  blocks: DashboardBlockInfo[];
  tokens: FogLockToken[];

  // Config & Scenarios
  params: SafetyParameters;
  currentScenario: ScenarioType;
  isDemoRunning: boolean;
  brakeVerificationFault: boolean;

  // Event Stream
  eventLog: SafetyEvent[];

  // Actions
  setActiveAppView: (view: AppViewMode) => void;
  setActiveDashboardPage: (page: DashboardPageId) => void;
  toggleFleetScalePreview: () => void;
  setScenario: (scenario: ScenarioType) => void;
  toggleDemoMode: () => void;
  tickDemo: () => void;

  setGlobalEnvironment: (env: Partial<VehicleStoreState["globalEnvironment"]>) => void;
  setFogDensity: (densityPercent: number) => void;
  setSensorVisualMode: (mode: "Standard" | "Thermal" | "LiDAR") => void;
  setVehicleDynamics: (speedKmh: number, leadDistanceM: number) => void;
  toggleFault: (faultKey: keyof VehicleStoreState["activeFaults"]) => void;
  clearAllFaults: () => void;

  forceRestrictBlock: (blockId: string, operatorAttribution?: string) => void;
  forceRestrictVehicle: (vehicleId: string, operatorAttribution?: string) => void;
  setActiveBlockId: (blockId: string) => void;

  updateRawData: (updater: (prev: RawSensorData) => RawSensorData) => void;
  injectRawDatasetRow: (row: RawDatasetRow) => void;
  toggleBrakeVerificationFault: () => void;
  updateSafetyParams: (newParams: Partial<SafetyParameters>) => void;
  clearEventLog: () => void;

  getFleetVehicles: () => SyntheticVehicleInfo[];
}

const initialBlocks: DashboardBlockInfo[] = [
  {
    blockId: "B1",
    name: "Blind Curve (Sector 4)",
    type: "PHYSICAL",
    category: "BLIND_CURVE",
    restricted: false,
    lengthM: 120,
    maxOccupancy: 2,
    currentOccupants: ["V01"],
    protectedSeparationM: 25,
    boundarySensors: "IR-A1 / LD2401 ONLINE",
  },
  {
    blockId: "B2",
    name: "Narrow Haul Road",
    type: "VIRTUAL",
    category: "NARROW_ROAD",
    restricted: false,
    lengthM: 80,
    maxOccupancy: 1,
    currentOccupants: ["V02"],
    protectedSeparationM: 30,
    boundarySensors: "VIRTUAL BEACON ONLINE",
  },
  {
    blockId: "B3",
    name: "Junction X-Pass",
    type: "VIRTUAL",
    category: "JUNCTION",
    restricted: false,
    lengthM: 60,
    maxOccupancy: 1,
    currentOccupants: [],
    protectedSeparationM: 20,
    boundarySensors: "VIRTUAL BEACON ONLINE",
  },
  {
    blockId: "B4",
    name: "Highwall Cliff Margin",
    type: "VIRTUAL",
    category: "HIGHWALL_EDGE",
    restricted: false,
    lengthM: 150,
    maxOccupancy: 2,
    currentOccupants: [],
    protectedSeparationM: 35,
    boundarySensors: "VIRTUAL BEACON ONLINE",
  },
];

const initialTokens: FogLockToken[] = [
  {
    tokenId: "TOK_99231",
    vehicleId: "V01",
    blockId: "B1",
    direction: "A_TO_B",
    issuedAt: Date.now() - 5000,
    expiresAt: Date.now() + 55000,
    sequence: 42,
    status: "VALID",
  },
  {
    tokenId: "TOK_99232",
    vehicleId: "V02",
    blockId: "B2",
    direction: "B_TO_A",
    issuedAt: Date.now() - 2000,
    expiresAt: Date.now() + 28000,
    sequence: 43,
    status: "VALID",
  },
];

const initialRaw = mockEngineInstance.emitCurrentTelemetry() ?? (
  processSafetyPipeline(
    {
      radar: { distanceM: 50, relativeVelocityMps: 0, angleDeg: 0, targetCount: 1, signalStrength: 90, trackPersistence: 0.99, timestampMs: Date.now() },
      vehicle: { speedMps: 5.55, direction: "FORWARD", brakeApplied: false, throttlePercent: 20, gear: "D", encoderPulses: 555, timestampMs: Date.now() },
      fogLock: { blockId: "B1", blockType: "HAUL_ROAD_BLOCK", authorization: "GRANT", token: initialTokens[0], tokenId: "TOK_99231", direction: "A_TO_B", separationM: 40, speedAdvisoryKmh: 30, timestampMs: Date.now() },
      environment: { weather: "NORMAL", roadCondition: "DRY", visibility: "GOOD", simulated: true, timestampMs: Date.now() },
      sensorHealth: { radarValid: true, encoderValid: true, canValid: true, loraValid: true, brakeValid: true },
      timestampMs: Date.now(),
    }
  ).raw
);

const initialPipeline = processSafetyPipeline(initialRaw, SAFETY_CONFIG, false);

export const useVehicleStore = create<VehicleStoreState>((set, get) => {
  // Listen for socket connection status
  socketService.onStatusChange((status) => {
    set({
      backendConnected: status === "CONNECTED",
      connectionStatus: status,
    });
  });

  // Socket state listeners
  const socket = socketService.getSocket();
  if (socket) {
    const handleBackendState = (bState: any) => {
      if (!bState) return;
      set((prev) => ({
        ...prev,
        raw: bState.raw ?? prev.raw,
        calculated: bState.calculated ?? prev.calculated,
        decision: bState.decision ?? prev.decision,
        globalEnvironment: bState.globalEnvironment ?? prev.globalEnvironment,
        activeFaults: bState.activeFaults ?? prev.activeFaults,
        blocks: bState.blocks ?? prev.blocks,
        tokens: bState.tokens ?? prev.tokens,
        eventLog: bState.eventLog ?? prev.eventLog,
        currentScenario: bState.currentScenario ?? prev.currentScenario,
        isDemoRunning: bState.isDemoRunning !== undefined ? bState.isDemoRunning : prev.isDemoRunning,
      }));

      if (bState.isDemoRunning !== undefined) {
        if (bState.isDemoRunning && !mockEngineInstance.getIsRunning()) {
          mockEngineInstance.start(500);
        } else if (!bState.isDemoRunning && mockEngineInstance.getIsRunning()) {
          mockEngineInstance.stop();
        }
      }
    };

    socket.on("state:init", handleBackendState);
    socket.on("state:update", handleBackendState);
  }
  // Automated scenario cycling callback from mock engine
  mockEngineInstance.onScenarioChange((newScenario) => {
    get().setScenario(newScenario);
  });

  // Telemetry ticker subscription
  mockEngineInstance.subscribe((newRaw) => {
    const {
      params,
      brakeVerificationFault,
      decision: prevDecision,
      eventLog,
      globalEnvironment,
      activeFaults,
    } = get();

    // Apply active global environment settings to incoming raw telemetry
    const mergedRaw: RawSensorData = {
      ...newRaw,
      environment: {
        ...newRaw.environment,
        weather: globalEnvironment.weather,
        roadCondition: globalEnvironment.roadCondition,
        visibility: globalEnvironment.visibility,
      },
      sensorHealth: {
        radarValid: newRaw.sensorHealth.radarValid && !activeFaults.radarFault,
        encoderValid: newRaw.sensorHealth.encoderValid && !activeFaults.encoderFault,
        canValid: newRaw.sensorHealth.canValid && !activeFaults.canFault,
        loraValid: newRaw.sensorHealth.loraValid && !activeFaults.loraFault,
        brakeValid: newRaw.sensorHealth.brakeValid && !activeFaults.brakeFault,
      },
    };

    if (prevDecision.brakeCommand) {
      mockEngineInstance.applyBrakeDeceleration(2.5);
    }

    const newPipeline = processSafetyPipeline(mergedRaw, params, brakeVerificationFault);

    // Event Log handling
    let updatedLog = eventLog;
    if (prevDecision.safetyState !== newPipeline.decision.safetyState) {
      const newEvent: SafetyEvent = {
        id: `EVT_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        timestampMs: Date.now(),
        timestampStr: new Date().toLocaleTimeString(),
        vehicleId: "V01",
        previousState: prevDecision.safetyState,
        newState: newPipeline.decision.safetyState,
        reasonCode: newPipeline.decision.reasonCode,
        reason: newPipeline.decision.reason,
        ttcSeconds: newPipeline.calculated.ttcSeconds,
        distanceM: newPipeline.calculated.availableDistanceM,
        requiredStoppingDistanceM: newPipeline.calculated.requiredStoppingDistanceM,
        availableDistanceM: newPipeline.calculated.availableDistanceM,
        finalAction: newPipeline.decision.finalAction,
      };
      updatedLog = [newEvent, ...eventLog].slice(0, 50);
    }

    set({
      raw: newPipeline.raw,
      calculated: newPipeline.calculated,
      decision: newPipeline.decision,
      eventLog: updatedLog,
    });
  });

  return {
    backendConnected: socketService.getStatus() === "CONNECTED",
    connectionStatus: socketService.getStatus(),

    activeAppView: "DRIVER_DISPLAY",
    activeDashboardPage: "OVERVIEW",
    isFleetScalePreview: false,

    raw: initialPipeline.raw,
    calculated: initialPipeline.calculated,
    decision: initialPipeline.decision,

    globalEnvironment: {
      weather: "DENSE_FOG",
      roadCondition: "WET",
      visibility: "POOR",
      fogDensityPercent: 85,
      visibilityMeters: 15,
      sensorVisualMode: "Standard",
      vehicleSpeedKmh: 27,
      leadObstacleDistanceM: 20,
    },

    activeFaults: {
      radarFault: false,
      encoderFault: false,
      canFault: false,
      loraFault: false,
      brakeFault: false,
    },

    blocks: initialBlocks,
    tokens: initialTokens,

    params: SAFETY_CONFIG,
    currentScenario: "NORMAL_ROAD",
    isDemoRunning: false,
    brakeVerificationFault: false,
    eventLog: [],

    setActiveAppView: (view) => set({ activeAppView: view }),
    setActiveDashboardPage: (page) => set({ activeDashboardPage: page }),
    toggleFleetScalePreview: () =>
      set((state) => ({ isFleetScalePreview: !state.isFleetScalePreview })),

    setScenario: (scenario: ScenarioType) => {
      mockEngineInstance.setScenario(scenario);
      if (scenario === "NORMAL_ROAD") {
        get().clearAllFaults();
        const resetEnv = {
          weather: "NORMAL" as const,
          roadCondition: "DRY" as const,
          visibility: "GOOD" as const,
          fogDensityPercent: 0,
          visibilityMeters: 200,
          vehicleSpeedKmh: 20,
          leadObstacleDistanceM: 80,
          leadObstacleSpeedKmh: 20,
        };
        const { raw } = get();
        const updatedRaw: RawSensorData = {
          ...raw,
          vehicle: {
            ...raw.vehicle,
            speedMps: 20 / 3.6,
            brakeApplied: false,
          },
          radar: {
            ...raw.radar,
            distanceM: 80,
            relativeVelocityMps: 0,
            targetCount: 0,
          },
          fogLock: {
            ...raw.fogLock,
            authorization: "GRANT",
          },
        };
        set({ currentScenario: scenario, brakeVerificationFault: false, raw: updatedRaw });
        get().setGlobalEnvironment(resetEnv);
      } else {
        set({ currentScenario: scenario });
      }
      socketService.emitScenarioSet(scenario);
    },

    toggleDemoMode: () => {
      const { isDemoRunning } = get();
      const newRunning = !isDemoRunning;
      if (newRunning) {
        mockEngineInstance.start(500);
      } else {
        mockEngineInstance.stop();
      }
      set({ isDemoRunning: newRunning });
      socketService.emitDemoToggle(newRunning);
    },

    tickDemo: () => {
      mockEngineInstance.nextScenario();
    },

    setGlobalEnvironment: (newEnv) => {
      const { globalEnvironment, raw, params, brakeVerificationFault } = get();
      const updatedEnv = { ...globalEnvironment, ...newEnv };
      const updatedRaw: RawSensorData = {
        ...raw,
        vehicle: {
          ...raw.vehicle,
          ...(newEnv.vehicleSpeedKmh !== undefined ? { speedMps: newEnv.vehicleSpeedKmh / 3.6 } : {}),
        },
        radar: {
          ...raw.radar,
          ...(newEnv.leadObstacleDistanceM !== undefined ? { distanceM: newEnv.leadObstacleDistanceM } : {}),
        },
        environment: {
          ...raw.environment,
          weather: updatedEnv.weather,
          roadCondition: updatedEnv.roadCondition,
          visibility: updatedEnv.visibility,
          fogDensityPercent: updatedEnv.fogDensityPercent,
          visibilityMeters: updatedEnv.visibilityMeters,
          sensorVisualMode: updatedEnv.sensorVisualMode,
          leadObstacleDistanceM: updatedEnv.leadObstacleDistanceM,
        },
      };

      const newPipeline = processSafetyPipeline(updatedRaw, params, brakeVerificationFault);
      const newState = {
        globalEnvironment: updatedEnv,
        raw: newPipeline.raw,
        calculated: newPipeline.calculated,
        decision: newPipeline.decision,
      };
      set(newState);
      socketService.emitEnvironmentUpdate(updatedEnv);
    },

    setFogDensity: (densityPercent: number) => {
      const { setGlobalEnvironment } = get();
      const clampedDensity = Math.max(0, Math.min(100, Math.round(densityPercent)));
      const { visibilityMeters, weather, visibility } = calculateDemonstrationVisibility(clampedDensity);

      setGlobalEnvironment({
        fogDensityPercent: clampedDensity,
        visibilityMeters,
        weather,
        visibility,
      });
    },

    setSensorVisualMode: (mode: "Standard" | "Thermal" | "LiDAR") => {
      const { globalEnvironment, setGlobalEnvironment } = get();
      setGlobalEnvironment({ sensorVisualMode: mode });
    },

    setVehicleDynamics: (speedKmh: number, leadDistanceM: number) => {
      const { globalEnvironment, raw, params, brakeVerificationFault } = get();
      const updatedEnv = {
        ...globalEnvironment,
        vehicleSpeedKmh: speedKmh,
        leadObstacleDistanceM: leadDistanceM,
      };
      const updatedRaw: RawSensorData = {
        ...raw,
        vehicle: {
          ...raw.vehicle,
          speedMps: speedKmh / 3.6,
        },
        radar: {
          ...raw.radar,
          distanceM: leadDistanceM,
        },
        environment: {
          ...raw.environment,
          leadObstacleDistanceM: leadDistanceM,
        },
      };

      const newPipeline = processSafetyPipeline(updatedRaw, params, brakeVerificationFault);
      const newState = {
        globalEnvironment: updatedEnv,
        raw: newPipeline.raw,
        calculated: newPipeline.calculated,
        decision: newPipeline.decision,
      };
      set(newState);
      socketService.emitDynamicsUpdate(speedKmh, leadDistanceM);
    },

    setActiveBlockId: (blockId: string) => {
      const { raw, params, brakeVerificationFault } = get();
      const updatedRaw: RawSensorData = {
        ...raw,
        fogLock: {
          ...raw.fogLock,
          blockId,
        },
      };
      const newPipeline = processSafetyPipeline(updatedRaw, params, brakeVerificationFault);
      const newState = {
        raw: newPipeline.raw,
        calculated: newPipeline.calculated,
        decision: newPipeline.decision,
      };
      set(newState);
      socketService.emitBlockSelect(blockId);
    },

    toggleFault: (faultKey) => {
      const { activeFaults, raw, params, brakeVerificationFault } = get();
      const updatedFaults = {
        ...activeFaults,
        [faultKey]: !activeFaults[faultKey],
      };

      const updatedRaw: RawSensorData = {
        ...raw,
        sensorHealth: {
          radarValid: !updatedFaults.radarFault,
          encoderValid: !updatedFaults.encoderFault,
          canValid: !updatedFaults.canFault,
          loraValid: !updatedFaults.loraFault,
          brakeValid: !updatedFaults.brakeFault,
        },
      };

      const newPipeline = processSafetyPipeline(updatedRaw, params, brakeVerificationFault);
      set({
        activeFaults: updatedFaults,
        raw: newPipeline.raw,
        calculated: newPipeline.calculated,
        decision: newPipeline.decision,
      });
      socketService.emitFaultToggle(faultKey);
    },

    clearAllFaults: () => {
      const { raw, params, brakeVerificationFault } = get();
      const updatedFaults = {
        radarFault: false,
        encoderFault: false,
        canFault: false,
        loraFault: false,
        brakeFault: false,
      };

      const updatedRaw: RawSensorData = {
        ...raw,
        sensorHealth: {
          radarValid: true,
          encoderValid: true,
          canValid: true,
          loraValid: true,
          brakeValid: true,
        },
      };

      const newPipeline = processSafetyPipeline(updatedRaw, params, brakeVerificationFault);
      set({
        activeFaults: updatedFaults,
        brakeVerificationFault: false,
        raw: newPipeline.raw,
        calculated: newPipeline.calculated,
        decision: newPipeline.decision,
      });
      socketService.emitFaultClear();
    },

    forceRestrictBlock: (blockId: string, operatorAttribution?: string) => {
      const { blocks, tokens, raw, params, brakeVerificationFault, eventLog } = get();
      const updatedBlocks = blocks.map((b) =>
        b.blockId === blockId ? { ...b, restricted: true } : b
      );

      // Force token denial for this block
      const updatedTokens = tokens.map((t) =>
        t.blockId === blockId ? { ...t, status: "REVOKED" as const } : t
      );

      const updatedRaw: RawSensorData = {
        ...raw,
        fogLock: {
          ...raw.fogLock,
          authorization: "DENY",
        },
      };

      const newPipeline = processSafetyPipeline(updatedRaw, params, brakeVerificationFault);

      const operatorIdStr = operatorAttribution ?? "Operator Action";
      const manualEvent: SafetyEvent = {
        id: `EVT_MANUAL_${Date.now()}`,
        timestampMs: Date.now(),
        timestampStr: new Date().toLocaleTimeString(),
        vehicleId: `Block ${blockId}`,
        previousState: newPipeline.decision.safetyState,
        newState: "WARNING",
        reasonCode: "FOG_LOCK_DENIED",
        reason: `Block ${blockId} access restricted by ${operatorIdStr}`,
        ttcSeconds: newPipeline.calculated.ttcSeconds,
        distanceM: newPipeline.calculated.availableDistanceM,
        requiredStoppingDistanceM: newPipeline.calculated.requiredStoppingDistanceM,
        availableDistanceM: newPipeline.calculated.availableDistanceM,
        finalAction: "SLOW_DOWN",
      };

      set({
        blocks: updatedBlocks,
        tokens: updatedTokens,
        raw: newPipeline.raw,
        calculated: newPipeline.calculated,
        decision: newPipeline.decision,
        eventLog: [manualEvent, ...eventLog].slice(0, 50),
      });
      socketService.emitBlockUpdate(blockId, { restricted: true, occupancyState: "OCCUPIED" });
    },

    forceRestrictVehicle: (vehicleId: string, operatorAttribution?: string) => {
      const { tokens, eventLog } = get();
      const updatedTokens = tokens.map((t) =>
        t.vehicleId === vehicleId ? { ...t, status: "REVOKED" as const } : t
      );

      const operatorIdStr = operatorAttribution ?? "Operator Action";
      const manualEvent: SafetyEvent = {
        id: `EVT_REVOKE_${Date.now()}`,
        timestampMs: Date.now(),
        timestampStr: new Date().toLocaleTimeString(),
        vehicleId,
        previousState: "SAFE",
        newState: "WARNING",
        reasonCode: "FOG_LOCK_DENIED",
        reason: `Movement token for ${vehicleId} revoked by ${operatorIdStr}`,
        ttcSeconds: null,
        distanceM: null,
        requiredStoppingDistanceM: null,
        availableDistanceM: null,
        finalAction: "SLOW_DOWN",
      };

      set({
        tokens: updatedTokens,
        eventLog: [manualEvent, ...eventLog].slice(0, 50),
      });
    },

    updateRawData: (updater) => {
      const { raw, params, brakeVerificationFault } = get();
      const updatedRaw = updater(raw);
      const newPipeline = processSafetyPipeline(updatedRaw, params, brakeVerificationFault);
      set({
        raw: newPipeline.raw,
        calculated: newPipeline.calculated,
        decision: newPipeline.decision,
      });
    },

    injectRawDatasetRow: (row: RawDatasetRow) => {
      const newRaw = datasetRowToRawData(row);
      const { params, brakeVerificationFault } = get();
      const newPipeline = processSafetyPipeline(newRaw, params, brakeVerificationFault);
      set({
        raw: newPipeline.raw,
        calculated: newPipeline.calculated,
        decision: newPipeline.decision,
      });
    },

    toggleBrakeVerificationFault: () => {
      const { raw, params, brakeVerificationFault } = get();
      const newFaultState = !brakeVerificationFault;
      const newPipeline = processSafetyPipeline(raw, params, newFaultState);
      set({
        brakeVerificationFault: newFaultState,
        decision: newPipeline.decision,
      });
    },

    updateSafetyParams: (newParams) => {
      const { raw, params, brakeVerificationFault } = get();
      const updatedParams = { ...params, ...newParams };
      const newPipeline = processSafetyPipeline(raw, updatedParams, brakeVerificationFault);
      set({
        params: updatedParams,
        calculated: newPipeline.calculated,
        decision: newPipeline.decision,
      });
    },

    clearEventLog: () => set({ eventLog: [] }),

    getFleetVehicles: () => {
      const { raw, decision, calculated, isFleetScalePreview } = get();

      // Primary prototype real vehicle V01
      const v01: SyntheticVehicleInfo = {
        vehicleId: "V01",
        name: "Dumper V01 (Active)",
        status: decision.safetyState,
        speedKmh: raw.vehicle.speedMps !== null ? Math.round(raw.vehicle.speedMps * 3.6) : 0,
        blockId: raw.fogLock.blockId ?? "B1",
        ttcSeconds: calculated.ttcSeconds,
        aiRiskScore: decision.aiRiskScore ?? 15,
        aiRiskLevel: decision.aiRiskLevel ?? "LOW",
        batteryVoltageV: 7.4, // Real LiPo prototype pack voltage
        isPrototypeReal: true,
      };

      // Primary prototype stationary target V02
      const v02: SyntheticVehicleInfo = {
        vehicleId: "V02",
        name: "Dumper V02 (Stationary Target)",
        status: "SAFE",
        speedKmh: 0,
        blockId: "B2",
        ttcSeconds: null,
        aiRiskScore: 10,
        aiRiskLevel: "LOW",
        batteryVoltageV: 7.2,
        isPrototypeReal: true,
      };

      const baseFleet = [v01, v02];

      if (!isFleetScalePreview) {
        return baseFleet;
      }

      // Fleet scale preview additional synthetic vehicles V03-V08
      const syntheticFleet: SyntheticVehicleInfo[] = [
        {
          vehicleId: "V03",
          name: "Hauler V03",
          status: "CAUTION",
          speedKmh: 22,
          blockId: "B1",
          ttcSeconds: 5.8,
          aiRiskScore: 42,
          aiRiskLevel: "MEDIUM",
          batteryVoltageV: 24.2,
          isPrototypeReal: false,
        },
        {
          vehicleId: "V04",
          name: "Hauler V04",
          status: "SAFE",
          speedKmh: 28,
          blockId: "B3",
          ttcSeconds: null,
          aiRiskScore: 12,
          aiRiskLevel: "LOW",
          batteryVoltageV: 24.8,
          isPrototypeReal: false,
        },
        {
          vehicleId: "V05",
          name: "Water Truck V05",
          status: "WARNING",
          speedKmh: 15,
          blockId: "B4",
          ttcSeconds: 3.4,
          aiRiskScore: 68,
          aiRiskLevel: "HIGH",
          batteryVoltageV: 23.9,
          isPrototypeReal: false,
        },
        {
          vehicleId: "V06",
          name: "Service Pickup V06",
          status: "SAFE",
          speedKmh: 30,
          blockId: "B3",
          ttcSeconds: null,
          aiRiskScore: 8,
          aiRiskLevel: "LOW",
          batteryVoltageV: 24.1,
          isPrototypeReal: false,
        },
      ];

      return [...baseFleet, ...syntheticFleet];
    },
  };
});
