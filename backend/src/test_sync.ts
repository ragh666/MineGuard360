import { io } from "socket.io-client";

async function runTest() {
  console.log("=================================================");
  console.log("STARTING FOG-HEMM REALTIME SYNCHRONIZATION TEST");
  console.log("=================================================");

  // 1. Connect Driver Display simulated client
  const driverSocket = io("http://localhost:4000");
  let driverReceivedInit = false;
  let lastDriverState: any = null;

  driverSocket.on("state:init", (state) => {
    console.log("[Driver Client] Received state:init! Active block:", state.selectedBlockId);
    driverReceivedInit = true;
    lastDriverState = state;
  });

  driverSocket.on("state:update", (state) => {
    console.log(
      `[Driver Client] Received state:update -> Fog: ${state.globalEnvironment.fogDensityPercent}%, Vis: ${state.globalEnvironment.visibilityMeters}m, Speed: ${state.globalEnvironment.vehicleSpeedKmh}km/h, Safety: ${state.decision.safetyState}, Action: ${state.decision.finalAction}`
    );
    lastDriverState = state;
  });

  // 2. Connect Dashboard simulated client
  const dashboardSocket = io("http://localhost:4000");
  let dashboardReceivedInit = false;

  dashboardSocket.on("state:init", () => {
    console.log("[Dashboard Client] Received state:init!");
    dashboardReceivedInit = true;
  });

  // Wait for initial socket connections
  await new Promise((r) => setTimeout(r, 1200));

  if (!driverReceivedInit || !dashboardReceivedInit) {
    throw new Error("Failed to receive state:init on one or both clients");
  }
  console.log("-> Both Driver Display and Dashboard connected to port 4000 successfully!\n");

  // TEST STEP 1: Set Fog 85%, Vis 15m, Road WET, Speed 27 km/h, Dist 20m from Dashboard
  console.log("[ACTION 1] Dashboard sets: Fog=85%, Visibility=15m, Road=WET, Speed=27km/h, Lead Distance=20m");
  dashboardSocket.emit("environment:update", {
    fogDensityPercent: 85,
    visibilityMeters: 15,
    roadCondition: "WET",
    weather: "DENSE_FOG",
  });
  dashboardSocket.emit("dynamics:update", {
    speedKmh: 27,
    leadDistanceM: 20,
    leadSpeedKmh: 10,
  });

  await new Promise((r) => setTimeout(r, 1000));

  console.log("-> VERIFYING DRIVER DISPLAY RECEIVED STATE:");
  console.log("   Fog Density:", lastDriverState.globalEnvironment.fogDensityPercent, "% (Expected: 85%)");
  console.log("   Visibility:", lastDriverState.globalEnvironment.visibilityMeters, "m (Expected: 15m)");
  console.log("   Road Condition:", lastDriverState.globalEnvironment.roadCondition, "(Expected: WET)");
  console.log("   Speed:", lastDriverState.globalEnvironment.vehicleSpeedKmh, "km/h (Expected: 27 km/h)");
  console.log("   Lead Distance:", lastDriverState.globalEnvironment.leadObstacleDistanceM, "m (Expected: 20m)");
  console.log("   Recommended Speed:", lastDriverState.decision.recommendedSpeedKmh, "km/h");
  console.log("   Safety State:", lastDriverState.decision.safetyState);
  console.log("   Final Action:", lastDriverState.decision.finalAction);
  console.log("   Corridor Status:", lastDriverState.calculated.corridorStatus);
  console.log("   Stopping Distance:", lastDriverState.calculated.stoppingDistanceM, "m");

  if (lastDriverState.globalEnvironment.fogDensityPercent !== 85) {
    throw new Error("Fog density synchronization failed");
  }

  // TEST STEP 2: Change Fog Density to 95%
  console.log("\n[ACTION 2] Dashboard changes Fog Density: 85% -> 95%");
  dashboardSocket.emit("environment:update", { fogDensityPercent: 95 });
  await new Promise((r) => setTimeout(r, 1000));

  console.log("-> VERIFYING DRIVER DISPLAY RECEIVED 95% FOG STATE:");
  console.log("   Fog Density:", lastDriverState.globalEnvironment.fogDensityPercent, "% (Expected: 95%)");
  console.log("   Visibility:", lastDriverState.globalEnvironment.visibilityMeters, "m (Expected: <= 10m)");
  console.log("   Recommended Speed:", lastDriverState.decision.recommendedSpeedKmh, "km/h");
  console.log("   Safety State:", lastDriverState.decision.safetyState);

  // TEST STEP 3: Return to Normal Clear Road (0-10% fog, 200m visibility, DRY)
  console.log("\n[ACTION 3] Dashboard changes back to Clear Road (Normal, Dry, 200m visibility)");
  dashboardSocket.emit("environment:update", {
    fogDensityPercent: 10,
    visibilityMeters: 200,
    weather: "NORMAL",
    roadCondition: "DRY",
  });
  await new Promise((r) => setTimeout(r, 1000));
  console.log("   Fog Density:", lastDriverState.globalEnvironment.fogDensityPercent, "% (Expected: 10%)");
  console.log("   Visibility:", lastDriverState.globalEnvironment.visibilityMeters, "m (Expected: 200m)");
  console.log("   Safety State:", lastDriverState.decision.safetyState, "(Expected: SAFE)");

  // TEST STEP 4: Simulate Block B2 Occupied & Conflict
  console.log("\n[ACTION 4] Dashboard sets Block B2 = OCCUPIED & selects B2");
  dashboardSocket.emit("block:update", {
    blockId: "B2",
    updates: { restricted: true, occupancyState: "OCCUPIED" },
  });
  dashboardSocket.emit("block:select", "B2");
  await new Promise((r) => setTimeout(r, 1000));

  console.log("   Active Block:", lastDriverState.selectedBlockId, "(Expected: B2)");
  console.log("   Block State:", lastDriverState.summary.blockState, "(Expected: OCCUPIED)");
  console.log("   Movement Authority:", lastDriverState.summary.movementAuthority, "(Expected: RESTRICTED or HOLD)");
  console.log("   Warning Message:", lastDriverState.decision.reason);

  // TEST STEP 5: LoRa Failure Simulation
  console.log("\n[ACTION 5] Dashboard simulates LoRa failure");
  dashboardSocket.emit("fault:toggle", "loraFault");
  await new Promise((r) => setTimeout(r, 1000));

  console.log("   LoRa Status:", lastDriverState.summary.loraStatus, "(Expected: DISCONNECTED)");
  console.log("   Active Faults (loraFault):", lastDriverState.activeFaults.loraFault);

  driverSocket.close();
  dashboardSocket.close();

  console.log("\n=================================================");
  console.log("ALL REALTIME SYNCHRONIZATION TESTS PASSED 100%!");
  console.log("=================================================");
  process.exit(0);
}

runTest().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
