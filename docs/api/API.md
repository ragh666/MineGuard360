# MineGuard360 — API & Realtime Protocol Reference

## 1. REST API Endpoints

### System Health
- **`GET /api/health`**
  - Response: `{ status: "ONLINE", subsystem: "FOG-HEMM Realtime Coordination Server", port: 4000, timestamp: 1727600000000 }`

### Complete Shared State
- **`GET /api/state`**
  - Response: Full authoritative system state (`SharedSystemState`) including raw data, calculated physics metrics, deterministic decision, blocks, faults, and event log.
- **`POST /api/state`**
  - Updates global environment or selected block; broadcasts to all WebSocket clients.

### AI/ML Risk Prediction Adapter
- **`POST /api/risk/predict`**
  - Invokes AI model (or POC simulation fallback adapter).
  - Input:
    ```json
    {
      "vehicle_id": "HEMM-001",
      "speed": 35.0,
      "distance": 18.0,
      "relative_velocity": -12.0,
      "ttc": 2.1,
      "stopping_distance": 24.0,
      "required_distance": 30.0,
      "block_status": "OCCUPIED",
      "safe_corridor": "CENTER",
      "sensor_health": "GOOD"
    }
    ```
  - Output:
    ```json
    {
      "risk_score": 87,
      "risk_level": "HIGH",
      "model_status": "AVAILABLE",
      "simulation_indicator": "POC / SIMULATION",
      "advisory_notice": "AI/ML output is strictly advisory and does NOT command braking or vehicle control directly."
    }
    ```
- **`GET /api/risk/status`**
  - Returns current AI model status and integration endpoint.

### Vehicle Fleet
- **`GET /api/vehicles`**
  - Returns list of active HEMM haul trucks with telemetry, location, and risk scores.

### Haul Blocks (FOG-LOCK)
- **`GET /api/blocks`**
  - Returns array of physical and virtual haul blocks with occupancy state (`FREE`, `RESERVED`, `OCCUPIED`, `EXIT_PENDING`).
- **`POST /api/blocks/:id`**
  - Updates specific block properties; broadcasts update.

### Audit Events
- **`GET /api/events`**
  - Returns latest 50 safety transition audit events with full traceability.

### Hardware Fault Injection
- **`POST /api/fault`**
  - Body: `{ faultKey: "radarFault" | "encoderFault" | "canFault" | "loraFault" | "brakeFault", clearAll?: boolean }`

---

## 2. WebSocket Events (Socket.IO)

Both the Driver Display and Dashboard connect to the same WebSocket server instance.

### Server-to-Client Events (Broadcasts)
- **`state:init`**: Sent immediately upon socket connection with full authoritative state.
- **`state:update`**: Broadcast whenever any environment, fault, or vehicle change occurs.
- **`safety:update`**: High-frequency payload containing deterministic safety decision and brake commands.
- **`environment:update`**: Broadcast when weather, road condition, or visibility shifts.
- **`block:update`**: Broadcast when haul block occupancy or digital tokens transition.

### Client-to-Server Events (Commands)
- **`environment:update`**: Emitted by dashboard when operator adjusts sliders or presets.
- **`dynamics:update`**: Emitted when vehicle speed or lead obstacle distance changes.
- **`block:select`**: Selects active block for deep telemetry inspection.
- **`block:update`**: Updates occupancy or restriction flags on a block.
- **`fault:toggle`**: Injects or clears a specific hardware or communication fault.
- **`fault:clear`**: Clears all active faults.
- **`scenario:set`**: Triggers one of the 14 pre-built operational scenarios.
- **`demo:toggle`**: Starts or pauses the automated scenario ticker.
