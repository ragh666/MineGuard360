import { describe, expect, it } from "vitest";
import { processSafetyPipeline } from "../safetyEngine";
import { SAFETY_CONFIG } from "../safetyConfig";
import { RawSensorData } from "../../data/types";

function createBaselineRawData(): RawSensorData {
  const now = Date.now();
  return {
    radar: {
      distanceM: 60,
      relativeVelocityMps: 0,
      angleDeg: 0,
      targetCount: 1,
      signalStrength: 95,
      trackPersistence: 0.99,
      timestampMs: now,
    },
    vehicle: {
      speedMps: 5.55, // 20 km/h
      direction: "FORWARD",
      brakeApplied: false,
      throttlePercent: 20,
      gear: "D",
      encoderPulses: 555,
      timestampMs: now,
    },
    fogLock: {
      blockId: "BLK_01",
      blockType: "HAUL_ROAD",
      authorization: "GRANT",
      token: {
        tokenId: "TOK_TEST",
        vehicleId: "V01",
        blockId: "BLK_01",
        direction: "A_TO_B",
        issuedAt: now - 1000,
        expiresAt: now + 60000,
        sequence: 10,
        status: "VALID",
      },
      tokenId: "TOK_TEST",
      direction: "A_TO_B",
      separationM: 50,
      speedAdvisoryKmh: 30,
      timestampMs: now,
    },
    environment: {
      weather: "NORMAL",
      roadCondition: "DRY",
      visibility: "GOOD",
      simulated: true,
      timestampMs: now,
    },
    sensorHealth: {
      radarValid: true,
      encoderValid: true,
      canValid: true,
      loraValid: true,
      brakeValid: true,
    },
    timestampMs: now,
  };
}

describe("FOG-HEMM Deterministic Safety Engine Unit Tests", () => {
  it("Test 1 — Safe: distance = 50m, closing velocity = 1 m/s, speed = 5 m/s", () => {
    const raw = createBaselineRawData();
    raw.radar.distanceM = 50;
    raw.radar.relativeVelocityMps = -1.0; // closing velocity 1 m/s => TTC = 50s
    raw.vehicle.speedMps = 5.0;

    const result = processSafetyPipeline(raw, SAFETY_CONFIG);

    expect(result.calculated.closingVelocityMps).toBe(1.0);
    expect(result.calculated.ttcSeconds).toBe(50.0);
    expect(result.decision.safetyState).toBe("SAFE");
    expect(result.decision.finalAction).toBe("PROCEED");
  });

  it("Test 2 — Caution: TTC inside caution range (4s - 6s)", () => {
    const raw = createBaselineRawData();
    raw.radar.distanceM = 25;
    raw.radar.relativeVelocityMps = -5.0; // closing velocity 5 m/s => TTC = 5.0s

    const result = processSafetyPipeline(raw, SAFETY_CONFIG);

    expect(result.calculated.ttcSeconds).toBe(5.0);
    expect(result.decision.safetyState).toBe("CAUTION");
    expect(result.decision.finalAction).toBe("SPEED_LIMIT");
  });

  it("Test 3 — Warning: TTC inside warning range (2s - 4s)", () => {
    const raw = createBaselineRawData();
    raw.radar.distanceM = 12;
    raw.radar.relativeVelocityMps = -4.0; // closing velocity 4 m/s => TTC = 3.0s

    const result = processSafetyPipeline(raw, SAFETY_CONFIG);

    expect(result.calculated.ttcSeconds).toBe(3.0);
    expect(result.decision.safetyState).toBe("WARNING");
    expect(result.decision.finalAction).toBe("SLOW_DOWN");
  });

  it("Test 4 — Critical TTC: TTC <= 2.0s", () => {
    const raw = createBaselineRawData();
    raw.radar.distanceM = 10;
    raw.radar.relativeVelocityMps = -6.0; // closing velocity 6 m/s => TTC = 1.67s

    const result = processSafetyPipeline(raw, SAFETY_CONFIG);

    expect(result.calculated.ttcSeconds).toBeLessThanOrEqual(2.0);
    expect(result.decision.safetyState).toBe("CRITICAL");
    expect(result.decision.finalAction).toBe("BRAKE");
    expect(result.decision.brakeCommand).toBe(true);
  });

  it("Test 5 — Emergency: TTC <= 1.0s and object inside corridor", () => {
    const raw = createBaselineRawData();
    raw.radar.distanceM = 5;
    raw.radar.relativeVelocityMps = -8.0; // closing velocity 8 m/s => TTC = 0.625s
    raw.radar.angleDeg = 0; // inside corridor

    const result = processSafetyPipeline(raw, SAFETY_CONFIG);

    expect(result.calculated.ttcSeconds).toBeLessThan(1.0);
    expect(result.calculated.objectInCorridor).toBe(true);
    expect(result.decision.safetyState).toBe("EMERGENCY");
    expect(result.decision.finalAction).toBe("EMERGENCY_BRAKING");
    expect(result.decision.brakeCommand).toBe(true);
  });

  it("Test 6 — Insufficient stopping distance: available < required stopping distance", () => {
    const raw = createBaselineRawData();
    raw.vehicle.speedMps = 10.0; // 36 km/h
    // Reaction (1s) = 10m, Braking (v^2/2a = 100/10) = 10m, Margin = 3m => Required = 23m
    raw.radar.distanceM = 15; // Available = 15m < 23m
    raw.radar.relativeVelocityMps = 0; // target not rapidly closing

    const result = processSafetyPipeline(raw, SAFETY_CONFIG);

    expect(result.calculated.requiredStoppingDistanceM).toBe(23.0);
    expect(result.calculated.availableDistanceM).toBe(15.0);
    expect(result.calculated.stoppingDistanceMarginM).toBe(-8.0);
    expect(result.decision.safetyState).toBe("CRITICAL");
    expect(result.decision.finalAction).toBe("BRAKE");
  });

  it("Test 7 — No closing: relative velocity >= 0", () => {
    const raw = createBaselineRawData();
    raw.radar.distanceM = 20;
    raw.radar.relativeVelocityMps = 2.0; // target moving away

    const result = processSafetyPipeline(raw, SAFETY_CONFIG);

    expect(result.calculated.closingVelocityMps).toBe(0);
    expect(result.calculated.ttcStatus).toBe("NO_CLOSING");
    expect(result.calculated.ttcSeconds).toBeNull();
    expect(result.decision.safetyState).not.toBe("EMERGENCY");
  });

  it("Test 8 — Radar failure: sensor invalid or missing", () => {
    const raw = createBaselineRawData();
    raw.sensorHealth.radarValid = false;
    raw.radar.distanceM = null;

    const result = processSafetyPipeline(raw, SAFETY_CONFIG);

    expect(result.decision.safetyState).toBe("FAULT");
    expect(result.decision.safetyState).not.toBe("SAFE");
  });

  it("Test 9 — LoRa communication lost", () => {
    const raw = createBaselineRawData();
    raw.fogLock.authorization = "COMM_LOST";

    const result = processSafetyPipeline(raw, SAFETY_CONFIG);

    expect(result.decision.safetyState).not.toBe("SAFE");
    expect(result.decision.reasonCode).toBe("COMMUNICATION_LOST");
  });

  it("Test 10 — AI disagreement: AI predicts LOW, Deterministic detects EMERGENCY", () => {
    const raw = createBaselineRawData();
    raw.radar.distanceM = 5;
    raw.radar.relativeVelocityMps = -8.0; // TTC = 0.625s => EMERGENCY

    const result = processSafetyPipeline(raw, SAFETY_CONFIG);

    expect(result.decision.aiIsAdvisory).toBe(true);
    expect(result.decision.safetyState).toBe("EMERGENCY");
    expect(result.decision.finalAction).toBe("EMERGENCY_BRAKING");
  });
});
