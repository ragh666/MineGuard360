import express from "express";
import http from "node:http";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { Server as SocketIOServer } from "socket.io";
import cors from "cors";
import { stateManager, SharedSystemState } from "./stateManager";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || Number(process.env.BACKEND_PORT) || 4000;

const app = express();
const server = http.createServer(app);

// CORS configuration for Driver Display (:3000) and Control Room (:3001)
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
  "http://localhost:5173",
  "http://localhost:5174",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Dev environment allow
      }
    },
    credentials: true,
  })
);

app.use(express.json());

// Initialize Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Broadcast state update helper
function broadcastStateUpdate() {
  const currentState = stateManager.getState();
  io.emit("state:update", currentState);
  io.emit("safety:update", currentState.decision);
  io.emit("environment:update", currentState.globalEnvironment);
  io.emit("block:update", currentState.blocks);
}

// ---------------------------------------------------------------------------
// REST API ENDPOINTS
// ---------------------------------------------------------------------------

// 1. Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ONLINE",
    subsystem: "FOG-HEMM Realtime Coordination Server",
    port: PORT,
    timestamp: Date.now(),
  });
});

// 2. Full shared state
app.get("/api/state", (req, res) => {
  res.json(stateManager.getState());
});

// 3. Update state
app.post("/api/state", (req, res) => {
  const updates = req.body;
  if (updates.globalEnvironment) {
    stateManager.setGlobalEnvironment(updates.globalEnvironment);
  }
  if (updates.selectedBlockId) {
    stateManager.setSelectedBlock(updates.selectedBlockId);
  }
  broadcastStateUpdate();
  res.json(stateManager.getState());
});

// 4. Multi-block status
app.get("/api/blocks", (req, res) => {
  res.json(stateManager.getState().blocks);
});

// 5. Update specific block
app.post("/api/blocks/:id", (req, res) => {
  const blockId = req.params.id;
  const updates = req.body;
  stateManager.updateBlock(blockId, updates);
  broadcastStateUpdate();
  res.json({ success: true, blocks: stateManager.getState().blocks });
});

// 6. Active fleet vehicles
app.get("/api/vehicles", (req, res) => {
  const s = stateManager.getState();
  res.json([
    {
      vehicleId: s.vehicleId,
      name: "Haul Truck HT-01 (Active)",
      status: s.decision.safetyState,
      speedKmh: s.globalEnvironment.vehicleSpeedKmh,
      blockId: s.selectedBlockId,
      ttcSeconds: s.calculated.ttcSeconds,
      aiRiskScore: s.decision.aiRiskScore ?? 15,
      aiRiskLevel: s.decision.aiRiskLevel ?? "LOW",
      batteryVoltageV: 7.4,
      isPrototypeReal: true,
    },
    {
      vehicleId: "V02",
      name: "Haul Truck HT-02 (Target)",
      status: "SAFE",
      speedKmh: s.globalEnvironment.leadObstacleSpeedKmh,
      blockId: s.selectedBlockId === "B1" ? "B2" : "B1",
      ttcSeconds: null,
      aiRiskScore: 10,
      aiRiskLevel: "LOW",
      batteryVoltageV: 7.2,
      isPrototypeReal: true,
    },
  ]);
});

// 7. Audit event log
app.get("/api/events", (req, res) => {
  res.json(stateManager.getState().eventLog);
});

// 8. Update environment
app.post("/api/environment", (req, res) => {
  stateManager.setGlobalEnvironment(req.body);
  broadcastStateUpdate();
  res.json({ success: true, environment: stateManager.getState().globalEnvironment });
});

// 9. Update vehicle dynamics
app.post("/api/dynamics", (req, res) => {
  const { speedKmh, leadDistanceM, leadSpeedKmh } = req.body;
  stateManager.setVehicleDynamics(
    speedKmh ?? stateManager.getState().globalEnvironment.vehicleSpeedKmh,
    leadDistanceM ?? stateManager.getState().globalEnvironment.leadObstacleDistanceM,
    leadSpeedKmh
  );
  broadcastStateUpdate();
  res.json({ success: true, dynamics: stateManager.getState().globalEnvironment });
});

// 10. Hardware fault injection
app.post("/api/fault", (req, res) => {
  const { faultKey, clearAll } = req.body;
  if (clearAll) {
    stateManager.clearAllFaults();
  } else if (faultKey) {
    stateManager.toggleFault(faultKey);
  }
  broadcastStateUpdate();
  res.json({ success: true, faults: stateManager.getState().activeFaults });
});

// 11. Pre-built scenario trigger
app.post("/api/scenario", (req, res) => {
  const { scenario } = req.body;
  if (scenario) {
    stateManager.setScenario(scenario);
    broadcastStateUpdate();
  }
  res.json({ success: true, currentScenario: stateManager.getState().currentScenario });
});

// 12. AI/ML Risk Prediction Adapter (Advisory Only)
app.post("/api/risk/predict", async (req, res) => {
  const {
    vehicle_id = "HEMM-001",
    speed = 25,
    distance = 30,
    relative_velocity = -4,
    ttc = null,
    stopping_distance = null,
    required_distance = null,
    block_status = "OCCUPIED",
    safe_corridor = "CENTER",
    sensor_health = "GOOD",
  } = req.body;

  // 1. If external AI model endpoint configured via AI_SERVICE_URL, query it
  const aiServiceUrl = process.env.AI_SERVICE_URL;
  if (aiServiceUrl) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);
      const response = await fetch(`${aiServiceUrl}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const aiResult = (await response.json()) as any;
        const score = Number(aiResult.risk_score) || 0;
        const level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" =
          aiResult.risk_level ||
          (score >= 80 ? "CRITICAL" : score >= 60 ? "HIGH" : score >= 35 ? "MEDIUM" : "LOW");

        stateManager.setAiRisk(score, level, "AVAILABLE");
        broadcastStateUpdate();

        return res.json({
          risk_score: score,
          risk_level: level,
          model_status: "AVAILABLE",
          source: "EXTERNAL_AI_MODEL",
        });
      }
    } catch (err: any) {
      console.warn(`[AI Adapter] External AI endpoint unreachable (${err?.message}). Falling back to POC simulation.`);
    }
  }

  // 2. Mock Adapter / POC Simulation Fallback
  // Derived clearly from kinematics without fabricating actual sensor measurements
  let score = 15;
  if (ttc !== null && ttc !== undefined) {
    const numTtc = Number(ttc);
    if (numTtc > 0 && numTtc < 1.5) score += 70;
    else if (numTtc > 0 && numTtc < 2.5) score += 55;
    else if (numTtc > 0 && numTtc < 4.0) score += 35;
    else if (numTtc > 0 && numTtc < 7.0) score += 15;
  }

  if (distance !== null && stopping_distance !== null) {
    const numDist = Number(distance);
    const numStop = Number(stopping_distance);
    if (numDist < numStop) {
      score += 25;
    }
  }

  if (block_status === "OCCUPIED" && safe_corridor === "CENTER") {
    score += 10;
  }

  if (sensor_health === "DEGRADED" || sensor_health === "FAULT") {
    score += 15;
  }

  const finalScore = Math.max(5, Math.min(98, Math.round(score)));
  let riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";
  if (finalScore >= 80) riskLevel = "CRITICAL";
  else if (finalScore >= 60) riskLevel = "HIGH";
  else if (finalScore >= 35) riskLevel = "MEDIUM";

  const modelStatus = aiServiceUrl ? "UNAVAILABLE" : "AVAILABLE";

  stateManager.setAiRisk(finalScore, riskLevel, modelStatus);
  broadcastStateUpdate();

  res.json({
    risk_score: finalScore,
    risk_level: riskLevel,
    model_status: modelStatus,
    simulation_indicator: "POC / SIMULATION",
    advisory_notice: "AI/ML output is strictly advisory and does NOT command braking or vehicle control directly.",
  });
});

app.get("/api/risk/status", (req, res) => {
  const current = stateManager.getAiRisk();
  res.json({
    model_status: current?.modelStatus ?? (process.env.AI_SERVICE_URL ? "CONFIGURED" : "POC / SIMULATION"),
    endpoint: process.env.AI_SERVICE_URL || "MOCK_ADAPTER",
    advisory_only: true,
    current_advisory: current,
    timestamp: Date.now(),
  });
});

// ---------------------------------------------------------------------------
// SOCKET.IO REALTIME EVENT HANDLERS
// ---------------------------------------------------------------------------

io.on("connection", (socket) => {
  console.log(`[WebSocket] Client connected: ${socket.id}`);

  // Send current authoritative state immediately on connection
  socket.emit("state:init", stateManager.getState());

  // Client requests latest state
  socket.on("state:request", () => {
    socket.emit("state:update", stateManager.getState());
  });

  // Client updates environment
  socket.on("environment:update", (envUpdates) => {
    stateManager.setGlobalEnvironment(envUpdates);
    broadcastStateUpdate();
  });

  // Client updates vehicle dynamics
  socket.on("dynamics:update", ({ speedKmh, leadDistanceM, leadSpeedKmh }) => {
    stateManager.setVehicleDynamics(speedKmh, leadDistanceM, leadSpeedKmh);
    broadcastStateUpdate();
  });

  // Client selects block
  socket.on("block:select", (blockId) => {
    stateManager.setSelectedBlock(blockId);
    broadcastStateUpdate();
  });

  // Client updates block
  socket.on("block:update", ({ blockId, updates }) => {
    stateManager.updateBlock(blockId, updates);
    broadcastStateUpdate();
  });

  // Client toggles fault
  socket.on("fault:toggle", (faultKey) => {
    stateManager.toggleFault(faultKey);
    broadcastStateUpdate();
  });

  // Client clears faults
  socket.on("fault:clear", () => {
    stateManager.clearAllFaults();
    broadcastStateUpdate();
  });

  // Client sets scenario
  socket.on("scenario:set", (scenario) => {
    stateManager.setScenario(scenario);
    broadcastStateUpdate();
  });

  // Client toggles demo ticker
  socket.on("demo:toggle", (isRunning) => {
    stateManager.getState().isDemoRunning = isRunning;
    broadcastStateUpdate();
  });

  socket.on("disconnect", () => {
    console.log(`[WebSocket] Client disconnected: ${socket.id}`);
  });
});

// ---------------------------------------------------------------------------
// STATIC FRONTEND SERVING & PRODUCTION ROUTES
// ---------------------------------------------------------------------------
const driverDist = path.join(__dirname, "../dist/driver");
const dashboardDist = path.join(__dirname, "../dist/dashboard");
const publicDir = path.join(__dirname, "../public");

// Global static fallbacks for public assets (images, fonts, icons)
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
}

// Fallback asset mounts so /assets always works regardless of base URL
if (fs.existsSync(path.join(driverDist, "assets"))) {
  app.use("/assets", express.static(path.join(driverDist, "assets")));
}
if (fs.existsSync(path.join(dashboardDist, "assets"))) {
  app.use("/assets", express.static(path.join(dashboardDist, "assets")));
}

// DRIVER DISPLAY STATIC SERVING
if (fs.existsSync(driverDist)) {
  app.use("/driver", express.static(driverDist));
  app.use("/driver/assets", express.static(path.join(driverDist, "assets")));

  // Redirect /driver to /driver/ for clean relative path resolution
  app.get("/driver", (req, res) => {
    res.redirect(301, "/driver/");
  });

  app.get(/^\/driver(\/.*)?$/, (req, res) => {
    res.sendFile(path.join(driverDist, "index.html"));
  });
}

// CONTROL-ROOM DASHBOARD STATIC SERVING
if (fs.existsSync(dashboardDist)) {
  app.use("/dashboard", express.static(dashboardDist));
  app.use("/dashboard/assets", express.static(path.join(dashboardDist, "assets")));

  const dashHtml = fs.existsSync(path.join(dashboardDist, "dashboard.html"))
    ? path.join(dashboardDist, "dashboard.html")
    : path.join(dashboardDist, "index.html");

  // Redirect /dashboard to /dashboard/ for clean relative path resolution
  app.get("/dashboard", (req, res) => {
    res.redirect(301, "/dashboard/");
  });

  app.get(/^\/dashboard(\/.*)?$/, (req, res) => {
    res.sendFile(dashHtml);
  });
}

// Landing Portal at root (/)
app.get("/", (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MineGuard360 — Operational Control & Safety System</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    body { background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 24px; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 16px; max-width: 720px; width: 100%; padding: 36px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.6); }
    .header-badges { display: flex; gap: 8px; margin-bottom: 16px; }
    .badge { background: #0284c7; color: white; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 6px; letter-spacing: 0.5px; }
    .sim-tag { background: #7c3aed; }
    .safety-tag { background: #059669; }
    h1 { font-size: 26px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 8px; color: #ffffff; }
    p.lead { color: #94a3b8; font-size: 14px; line-height: 1.6; margin-bottom: 28px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-bottom: 28px; }
    .btn { display: flex; flex-direction: column; align-items: flex-start; justify-content: center; padding: 24px; background: #0f172a; border: 1.5px solid #334155; border-radius: 12px; text-decoration: none; color: inherit; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
    .btn:hover { transform: translateY(-3px); box-shadow: 0 12px 20px -8px rgba(0,0,0,0.5); }
    .btn-driver:hover { border-color: #3b82f6; background: #172554; }
    .btn-dash:hover { border-color: #10b981; background: #064e3b; }
    .icon { font-size: 28px; margin-bottom: 12px; }
    .btn-title { font-size: 17px; font-weight: 700; color: #f8fafc; margin-bottom: 6px; }
    .btn-desc { font-size: 12px; color: #94a3b8; line-height: 1.4; }
    .footer { border-top: 1px solid #334155; padding-top: 20px; display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: #64748b; font-family: monospace; }
    .status-dot { display: inline-block; width: 8px; height: 8px; background: #10b981; border-radius: 50%; margin-right: 6px; box-shadow: 0 0 8px #10b981; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header-badges">
      <span class="badge">MINEGUARD360</span>
      <span class="badge sim-tag">POC / SIMULATION</span>
      <span class="badge safety-tag">DETERMINISTIC SAFETY ACTIVE</span>
    </div>
    <h1>Low-Visibility HEMM Dynamic Movement & Safety</h1>
    <p class="lead">Core Subsystems: <strong>FOG-HEMM</strong> (In-Cab Radar & Hazard Avoidance) + <strong>FOG-LOCK</strong> (Digital Block Movement Authorization). Select an operational interface to proceed:</p>

    <div class="grid">
      <a href="/driver" class="btn btn-driver">
        <span class="icon">🚚</span>
        <span class="btn-title">Driver Display</span>
        <span class="btn-desc">In-Cab Passive HUD, 3D Radar Hazard Spheres, Real-Time TTC, Safe Corridor & Speed Advisory.</span>
      </a>
      <a href="/dashboard" class="btn btn-dash">
        <span class="icon">🖥️</span>
        <span class="btn-title">Control-Room Dashboard</span>
        <span class="btn-desc">Mine-Wide Block Overview, Multi-Vehicle Telemetry, FOG-LOCK Tokens & Traceable Event Logs.</span>
      </a>
    </div>

    <div class="footer">
      <div><span class="status-dot"></span>Backend & WebSocket Server: <strong>Port ${PORT}</strong></div>
      <div>AI Advisory API: <code>POST /api/risk/predict</code></div>
    </div>
  </div>
</body>
</html>`);
});

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`MineGuard360 Shared Realtime Backend Server`);
  console.log(`Unified Portal:     http://localhost:${PORT}/`);
  console.log(`Driver Display:     http://localhost:${PORT}/driver`);
  console.log(`Control Dashboard:  http://localhost:${PORT}/dashboard`);
  console.log(`AI Prediction API:  http://localhost:${PORT}/api/risk/predict`);
  console.log(`Dev Driver HMI:     http://localhost:3000/`);
  console.log(`Dev Dashboard:      http://localhost:3001/`);
  console.log(`====================================================`);
});
