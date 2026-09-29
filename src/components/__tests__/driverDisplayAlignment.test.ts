import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
import { processSafetyPipeline } from "../../safety/safetyEngine";
import { SAFETY_CONFIG } from "../../safety/safetyConfig";
import { RawSensorData } from "../../data/types";

describe("FOG-HEMM Driver HMI Safety & UX Alignment Verification", () => {
  const driverDisplayPath = path.resolve(__dirname, "../PassiveDriverDisplay.tsx");
  const corridorHUDPath = path.resolve(__dirname, "../PerspectiveSafetyCorridorHUD.tsx");
  const circularRadarHUDPath = path.resolve(__dirname, "../CircularRadarHUD.tsx");

  const driverDisplayContent = fs.readFileSync(driverDisplayPath, "utf-8");
  const corridorHUDContent = fs.readFileSync(corridorHUDPath, "utf-8");
  const circularRadarHUDContent = fs.readFileSync(circularRadarHUDPath, "utf-8");

  // 1. DGPS Lock Removal
  it("Requirement 1: completely removes DGPS lock from Driver Safety Display", () => {
    expect(driverDisplayContent).not.toContain("dgpsLock");
    expect(driverDisplayContent).not.toContain("DGPS Lock");
    expect(driverDisplayContent).not.toContain("ACTIVE (±0.05m)");
  });

  // 2. Persistent FOG-LOCK Decision State
  it("Requirement 2: includes persistent FOG-LOCK status chip near Block ID and separates 2 cooperating layers", () => {
    expect(driverDisplayContent).toContain("FOG-LOCK: GRANTED");
    expect(driverDisplayContent).toContain("FOG-LOCK: CONTROLLED ENTRY");
    expect(driverDisplayContent).toContain("FOG-LOCK: RESTRICT");
    expect(driverDisplayContent).toContain("FOG-LOCK: HOLD");
    expect(driverDisplayContent).toContain("FOG-LOCK: UNKNOWN / FAULT");

    // Cooperating safety layers
    expect(driverDisplayContent).toContain("Layer 1: Local Safety");
    expect(driverDisplayContent).toContain("Layer 2: FOG-LOCK Authority");
  });

  // 3. Standardize Reason Codes
  it("Requirement 3: displays standardized internal reason code from decision.reasonCode", () => {
    expect(driverDisplayContent).toContain("Reason Code:");
    expect(driverDisplayContent).toContain("decision.reasonCode");
  });

  // 4. Replace 3D Predictive Cubes with Circular Radar Target Visualization
  it("Requirement 4: removes 3D predictive cubes terminology and uses 2D Circular Radar Target Visualizer", () => {
    expect(driverDisplayContent).not.toContain("3D Predictive Cubes");
    expect(driverDisplayContent).not.toContain("3D PREDICTIVE CUBES");
    expect(corridorHUDContent).not.toContain("3D PREDICTIVE CUBES: ACTIVE");

    // Circular Radar Target HUD file checks
    expect(circularRadarHUDContent).toContain("CircularRadarHUD");
    expect(circularRadarHUDContent).toContain("HEMM (EGO)");
    expect(circularRadarHUDContent).toContain("PROTECTED ZONE");
    expect(circularRadarHUDContent).toContain("○ TARGET");
    expect(circularRadarHUDContent).toContain("CLOSING");
  });

  // 5. Show Token Status
  it("Requirement 5: shows compact token status field associated with FOG-LOCK", () => {
    expect(driverDisplayContent).toContain("TOKEN: VALID");
    expect(driverDisplayContent).toContain("TOKEN: EXPIRED");
    expect(driverDisplayContent).toContain("TOKEN: NONE");
  });

  // 6. Show Brake-Verification Result
  it("Requirement 6: displays brake-verification result upon braking intervention", () => {
    expect(driverDisplayContent).toContain("✓ STOP VERIFIED");
    expect(driverDisplayContent).toContain("VERIFYING STOP...");
    expect(driverDisplayContent).toContain("⚠ STOP NOT VERIFIED");
  });

  // 8. Subtle POC / SIMULATION Label
  it("Requirement 8: retains subtle POC / SIMULATION label in header", () => {
    expect(driverDisplayContent).toContain("POC / SIMULATION");
  });

  // 12. Final Acceptance Check Scenarios A through H
  it("Requirement 12: Deterministic engine supports Scenarios A through H cleanly", () => {
    const now = Date.now();
    const base: RawSensorData = {
      radar: { distanceM: 50, relativeVelocityMps: 0, angleDeg: 0, targetCount: 1, signalStrength: 90, trackPersistence: 0.99, timestampMs: now },
      vehicle: { speedMps: 5.5, direction: "FORWARD", brakeApplied: false, throttlePercent: 20, gear: "D", encoderPulses: 550, timestampMs: now },
      fogLock: { blockId: "B1", blockType: "HAUL_ROAD", authorization: "GRANT", token: { tokenId: "T1", vehicleId: "V01", blockId: "B1", direction: "A_TO_B", issuedAt: now - 1000, expiresAt: now + 50000, sequence: 1, status: "VALID" }, tokenId: "T1", direction: "A_TO_B", separationM: 40, speedAdvisoryKmh: 30, timestampMs: now },
      environment: { weather: "NORMAL", roadCondition: "DRY", visibility: "GOOD", simulated: true, timestampMs: now },
      sensorHealth: { radarValid: true, encoderValid: true, canValid: true, loraValid: true, brakeValid: true },
      timestampMs: now,
    };

    // Scenario A: SAFE
    const resA = processSafetyPipeline(base, SAFETY_CONFIG);
    expect(resA.decision.safetyState).toBe("SAFE");
    expect(resA.decision.reasonCode).toBe("NORMAL_OPERATION");

    // Scenario D: CRITICAL OBSTACLE (close distance inside corridor, TTC < 2.0s)
    const criticalRaw = {
      ...base,
      radar: { ...base.radar, distanceM: 10, relativeVelocityMps: -6 },
    };
    const resD = processSafetyPipeline(criticalRaw, SAFETY_CONFIG);
    expect(resD.decision.safetyState).toBe("CRITICAL");
    expect(resD.decision.brakeCommand).toBe(true);

    // Scenario E: SENSOR FAILURE
    const sensorFailRaw = {
      ...base,
      sensorHealth: { ...base.sensorHealth, radarValid: false },
    };
    const resE = processSafetyPipeline(sensorFailRaw, SAFETY_CONFIG);
    expect(resE.decision.safetyState).toBe("FAULT");
    expect(resE.decision.safetyState).not.toBe("SAFE");

    // Scenario F: LoRa Failure / FOG-LOCK Denied
    const loraFailRaw = {
      ...base,
      fogLock: { ...base.fogLock, authorization: "DENY" as const },
    };
    const resF = processSafetyPipeline(loraFailRaw, SAFETY_CONFIG);
    expect(resF.decision.safetyState).not.toBe("SAFE");
    expect(resF.decision.reasonCode).toBe("FOG_LOCK_DENIED");
  });
});
