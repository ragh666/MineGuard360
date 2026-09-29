# MineGuard360
### Low-Visibility HEMM Safety & Dynamic Movement Authorization Platform
**Core Subsystems:** FOG-HEMM (In-Cab Active Collision Avoidance) + FOG-LOCK (Digital Block Movement Authorization)

---

> **Important Deployment Architecture**  
> **Driver Display** and **Control Room Dashboard** are **completely separate frontend applications** designed for independent deployment (e.g. to separate Vercel/Netlify URLs). Both frontend applications connect to the **same central MineGuard360 backend and WebSocket service**.  
> The **backend is the single authoritative source** of live simulation, haul road environment, hardware faults, and safety state.

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Problem](#problem)
3. [Solution](#solution)
4. [Core Innovation](#core-innovation)
5. [FOG-HEMM](#fog-hemm)
6. [FOG-LOCK](#fog-lock)
7. [System Architecture](#system-architecture)
8. [Driver Display](#driver-display)
9. [Control Room Dashboard](#control-room-dashboard)
10. [AI/ML Integration](#aiml-integration)
11. [Deterministic Safety Resolver](#deterministic-safety-resolver)
12. [Environment Simulation](#environment-simulation)
13. [Fault Injection](#fault-injection)
14. [Backend Service](#backend-service)
15. [WebSocket Architecture](#websocket-architecture)
16. [Project Structure](#project-structure)
17. [Local Development](#local-development)
18. [Environment Variables](#environment-variables)
19. [Deployment](#deployment)
    - [Backend Deployment](#backend-deployment)
    - [Driver Display Deployment](#driver-display-deployment)
    - [Dashboard Deployment](#dashboard-deployment)
20. [REST API Reference](#rest-api-reference)
21. [WebSocket Events](#websocket-events)
22. [Safety States](#safety-states)
23. [FOG-LOCK States](#fog-lock-states)
24. [Failure Handling & Graceful Degradation](#failure-handling--graceful-degradation)
25. [Testing & Quality Assurance](#testing--quality-assurance)
26. [POC Limitations](#poc-limitations)
27. [Future Work](#future-work)
28. [Team / Project Information](#team--project-information)

---

## Project Overview
MineGuard360 is an integrated, industrial-grade collision avoidance and traffic management platform engineered for heavy earth-moving machinery (HEMM) operating in extreme open-cast mine environments. It addresses critical hazard conditions caused by zero-visibility fog, dust clouds, steep haul gradients, blind intersections, and tight haulage cuts.

## Problem
In open-cast surface mining operations:
- Dense fog, monsoonal rainfall, and particulate coal/silica dust reduce operator visibility below 10–15 meters.
- Haul trucks weighing 200–400 tonnes have long stopping distances (exceeding 25–40 meters even at moderate speeds of 25–35 km/h).
- Blind corners, narrow haulage ramps, and multi-vehicle junctions routinely experience near-miss incidents and head-on haul road collisions.
- Operators cannot visually classify distant hazards through heavy fog, leading to delayed brake reactions and catastrophic impacts.

## Solution
MineGuard360 eliminates reliance on naked-eye driver visibility and GNSS positioning by coupling:
1. **FOG-HEMM (In-Cab HUD):** Millimeter-wave radar distance and closing-velocity telemetry, dynamic Time-To-Collision (TTC) calculations, and clean 3D radar hazard spheres projected onto an ergonomic driver corridor HUD.
2. **FOG-LOCK (Digital Coordinator):** Infrastructure-to-Vehicle (I2V) and Vehicle-to-Vehicle (V2V) digital block management using decentralized micro-tokens and boundary trip sensors over local LoRa mesh networks.

## Core Innovation
- **GPS/GNSS Independence:** Works deep in pit cuts, under highwalls, and near metal infrastructure without satellite signals.
- **Cognitive Clarity HUD:** Displays simplified 3D hazard spheres in an intuitive forward perspective so illiterate or non-technical operators immediately grasp hazard distance and urgency without reading numbers.
- **Multilingual HMI:** Translates all safety states, warnings, and reason codes into 8 regional languages (**English, Hindi, Tamil, Telugu, Malayalam, Kannada, Bengali, Marathi**) at the presentation layer while keeping internal safety logic 100% language-independent.
- **Deterministic Absolute Authority:** AI/ML provides advisory risk scores only. The mechanical brake and safety decisions are enforced exclusively by deterministic physical formulas (reaction distance + braking distance + safety margin).

---

## FOG-HEMM
FOG-HEMM (*Forward Obstacle Guidance for Heavy Earth Moving Machinery*) is the active in-cab perception subsystem.
- **Sensor Fusion:** Continuous 100 Hz tracking from front millimeter-wave radar and wheel speed encoders.
- **Real-Time Kinematics:** Computes Closing Velocity ($v_{rel}$), Time-To-Collision ($TTC = d / v_{rel}$), Reaction Distance ($D_{react} = v \cdot t_{react}$), Braking Distance ($D_{brake} = v^2 / 2a$), and Required Stopping Distance ($D_{req} = D_{react} + D_{brake} + D_{margin}$).
- **Safe Corridor Guidance:** Monitors 3-lane lateral occupancy (Left, Center, Right) and dynamically computes safe steering bias and recommended approach speed.

---

## FOG-LOCK
FOG-LOCK (*Forward Obstacle Grid Lock*) is the digital haul-road block authorization protocol.
- **Block Partitioning:** Divides hazardous road sections (Blind Curves, Narrow Cuts, Highwall descents, Junctions) into monitored blocks.
- **Token Authorization:** Vehicles must request and hold a valid cryptographically timestamped token before entering restricted single-lane corridors.
- **Authority Levels:** `GRANT` (Authorized entry), `CONTROLLED_ENTRY` (Precautionary speed cap), `HOLD` (Stop before block entry line), `RESTRICT` (Speed reduced to walking pace).
- **Fail-Safe Comm Lost:** If LoRa mesh signals drop, the block status drops to `UNKNOWN` or `COMM_LOST` and vehicles enforce an automatic `HOLD` or restricted speed crawl.

---

## System Architecture

```
                  ┌────────────────────────────────────────────────────────┐
                  │                  MINEGUARD360 BACKEND                  │
                  │   Authoritative State & Deterministic Safety Engine    │
                  └───────────────────────────┬────────────────────────────┘
                                              │
                                 Socket.IO & REST Endpoints
                                              │
                      ┌───────────────────────┴───────────────────────┐
                      │                                               │
                      ▼                                               ▼
         ┌─────────────────────────┐                     ┌─────────────────────────┐
         │   DRIVER DISPLAY HUD    │                     │  CONTROL ROOM DASHBOARD │
         │   (In-Cab Operations)   │                     │  (Command & Dispatch)   │
         │  Separate Web Deploy    │                     │  Separate Web Deploy    │
         │  e.g. Vercel Port 3000  │                     │  e.g. Vercel Port 3001  │
         └─────────────────────────┘                     └─────────────────────────┘
```

---

## Driver Display
An operator-focused, dark-themed in-cab interface designed for high-glare and zero-visibility cab environments.
- **Perspective Safety Corridor:** Forward road perspective with glowing 3D Radar Hazard Spheres representing closing targets.
- **Speed & Distance Telemetry:** Large, high-contrast speed readout, TTC countdown, stopping distance vs required safety margin.
- **FOG-LOCK Strip:** Active Block ID, Movement Authority (`GRANT`, `HOLD`, `RESTRICT`), Token countdown.
- **Sound Alarms:** Auto-silencing pulsing hazard tone (10-second max duration with operator acknowledge button).
- **Multilingual Support:** Instant language toggle supporting 8 Indian mining languages.

---

## Control Room Dashboard
A dispatch and safety supervisory dashboard providing complete pit-wide situational awareness.
- **Mine Overview:** Visual haul road map with real-time block occupancy and vehicle positions.
- **Fleet Monitor:** Telemetry, speed, battery reserve, and health status for all trucks.
- **FOG-LOCK Token Manager:** Live token status, lease expiration countdowns, and manual override authorizations.
- **Environment Simulation:** Master controls for weather (`NORMAL`, `FOG`, `DENSE_FOG`, `RAIN`, `DUST`), road condition (`DRY`, `WET`, `SLIPPERY`), and visibility distance.
- **Fault Injection:** One-click simulation of Radar Fault, LoRa Link Drop, Wheel Encoder Failure, CAN Bus Error, and Actuator Failure.
- **Audit Event Log:** Complete chronological log recording timestamp, vehicle, block, TTC, risk score, reason code, and action.

---

## AI/ML Integration
The AI/ML model provides supplementary hazard pattern recognition and predictive risk advisory.
- **Advisory Role Only:** AI output **CANNOT** directly command mechanical braking or vehicle stops.
- **Standardized API Contract:**
  ```json
  POST /api/risk/predict
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
  Response:
  ```json
  {
    "risk_score": 87,
    "risk_level": "HIGH",
    "model_status": "AVAILABLE",
    "simulation_indicator": "POC / SIMULATION",
    "advisory_notice": "AI/ML output is strictly advisory."
  }
  ```
- **Fallback Simulation:** When an external AI model is not running, the system transparently utilizes its built-in kinematic estimation adapter clearly labeled `"POC / SIMULATION"`.

---

## Deterministic Safety Resolver
The Deterministic Safety Resolver is the **final safety authority** governing vehicle behavior. It evaluates a 12-level priority hierarchy:

1. **Hardware Brake Verification Fault** $\rightarrow$ `FAULT` / `STOP`
2. **Priority 1: Imminent Collision ($TTC \le 1.0s$)** $\rightarrow$ `EMERGENCY` / `EMERGENCY_BRAKING`
3. **Priority 2: Corridor-Blocking Hazard ($Margin \le 0m$)** $\rightarrow$ `CRITICAL` / `BRAKE`
4. **Priority 3: Critical TTC ($TTC \le 2.0s$)** $\rightarrow$ `CRITICAL` / `BRAKE`
5. **Priority 4: Insufficient Stopping Distance ($d < D_{req}$)** $\rightarrow$ `CRITICAL` / `BRAKE`
6. **Priority 5: Critical Sensor Fault (Radar/Encoder Offline)** $\rightarrow$ `FAULT` / `REDUCED_OPERATION`
7. **Priority 6: FOG-LOCK Conflict (Token Denied / Occupied)** $\rightarrow$ `WARNING` / `SLOW_DOWN`
8. **Priority 7: Road Edge / Highwall Clearance Hazard** $\rightarrow$ `WARNING` / `SLOW_DOWN`
9. **Priority 8: Vehicle Separation Low** $\rightarrow$ `WARNING` / `SLOW_DOWN`
10. **Priority 9: Warning TTC ($TTC \le 4.0s$)** $\rightarrow$ `WARNING` / `SLOW_DOWN`
11. **Priority 10: Caution TTC ($TTC \le 7.0s$)** $\rightarrow$ `CAUTION` / `SPEED_LIMIT`
12. **Priority 11: Environmental / Comm Advisory** $\rightarrow$ `CAUTION` / `SPEED_LIMIT`
13. **Priority 12: Elevated AI Advisory (Score $\ge 60$)** $\rightarrow$ `WARNING` / `SLOW_DOWN` (Advisory precautionary speed cap; never commands emergency brake directly)
14. **Default: Safe Operation** $\rightarrow$ `SAFE` / `PROCEED`

---

## Environment Simulation
Environment settings altered on the Dashboard propagate instantaneously over WebSockets to the Driver Display:
- **Fog Density:** $0\%$ to $100\%$ with physical visibility curve ($200m$ down to $2m$).
- **Road Conditions:** `DRY` ($\mu=0.65$), `WET` ($\mu=0.45$), `SLIPPERY` ($\mu=0.25$).
- **Weather Contexts:** `NORMAL`, `FOG`, `DENSE_FOG`, `RAIN`, `HEAVY_RAIN`, `DUST`, `MONSOON`.

---

## Fault Injection
Both frontends stay synchronized when any hardware fault is triggered:
- `radarFault`: Frontend perception area immediately marks targets `UNKNOWN`.
- `loraFault`: Token validation fails; movement authority drops to `COMM_LOST` / `HOLD`.
- `encoderFault`: Odometry marked degraded; safe operational speed cap enforced.
- `brakeFault`: Triggers immediate `FAULT` override.

---

## Backend Service
Located in `backend/`:
- **Express 5.x REST API:** Handles state querying, environmental updates, block assignments, and AI predictions.
- **Socket.IO Real-Time Server:** Broadcasts synchronized authoritative updates.
- **SQLite Audit Storage:** Persists all safety state transitions and events into `fog_hemm.db`.
- **Portal Service:** Serves an operations hub on `/` with quick launch buttons for Driver Display and Control Room.

---

## WebSocket Architecture
- Single persistent Socket.IO connection per client.
- Auto-reconnect with exponential backoff ($1s$ to $5s$).
- Event protocol:
  - `state:init`: Sent on connection.
  - `state:update`: Broadcast whenever authoritative state shifts.
  - `safety:update`: Real-time decision and speed advisory.
  - `environment:update`: Live weather/visibility changes.
  - `block:update`: Block occupancy transitions.

---

## Project Structure

```
MineGuard360/
├── README.md                           # Master Project Documentation
├── .gitignore                          # Clean Git Ignore Rules
├── .env.example                        # Documented Environment Template
├── package.json                        # Root Workspace Orchestration
│
├── driver-display/                     # APPLICATION 1: Driver Display (Vite/React)
│   ├── package.json                    # Independent build & dev scripts
│   ├── vite.config.ts                  # Port 3000, base '/'
│   ├── index.html                      # Direct Driver HMI entry point
│   ├── public/                         # Vehicle & haul road texture assets
│   └── src/
│       ├── main.tsx                    # Driver React entry
│       ├── App.tsx                     # In-Cab Passive HUD Layout
│       ├── components/                 # 3D Corridor HUD, Speed, Sound alarms
│       ├── services/socketClient.ts    # Configured for VITE_WS_URL
│       └── store/vehicleStore.ts       # State sync with backend
│
├── dashboard/                          # APPLICATION 2: Control Room Dashboard (Vite/React)
│   ├── package.json                    # Independent build & dev scripts
│   ├── vite.config.ts                  # Port 3001, base '/'
│   ├── index.html                      # Direct Dashboard entry point
│   ├── public/                         # Static assets
│   └── src/
│       ├── main.tsx                    # Dashboard React entry
│       ├── App.tsx                     # Operations layout & 11 subpages
│       ├── components/dashboard/       # Block manager, fleet, fault controls
│       ├── services/socketClient.ts    # Configured for VITE_WS_URL
│       └── store/vehicleStore.ts       # State sync with backend
│
├── backend/                            # CENTRAL AUTHORITATIVE SERVICE
│   ├── package.json                    # Independent backend dependencies
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts                    # Express + Socket.IO Server & Routes
│       ├── stateManager.ts             # Authoritative Live Simulation & State
│       ├── safetyEngineService.ts      # Pure safety pipeline bridge
│       ├── db.ts                       # SQLite Event & State Persistence
│       └── test_sync.ts                # Realtime synchronization test suite
│
├── shared/                             # SHARED TYPES & SAFETY LOGIC
│   ├── index.ts                        # Barrel export
│   ├── types/                          # TypeScript interfaces & types
│   ├── constants/                      # Safety thresholds & block defaults
│   └── safety/                         # Pure deterministic safety engine
│
├── ai-ml/                              # AI/ML SUBSYSTEM & INTERFACES
│   ├── README.md                       # Contract & integration guide
│   ├── inference/predict_adapter.py    # Reference FastAPI prediction service
│   ├── training/dataset_schema.json    # JSON schema for training data
│   └── models/                         # Trained model artifacts directory
│
└── docs/                               # DETAILED DOCUMENTATION
    ├── architecture/ARCHITECTURE.md    # End-to-end architecture guide
    ├── deployment/DEPLOYMENT.md        # Vercel / Render / Cloud step-by-step
    └── api/API.md                      # Full REST & WebSocket API reference
```

---

## Local Development

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm (v9.0.0 or higher)

### Run Everything with One Command
From the root directory:
```bash
npm install
npm run dev
```
This automatically launches:
1. **Backend Server & WebSockets:** `http://localhost:4000/`
2. **Driver Display HMI:** `http://localhost:3000/`
3. **Control Room Dashboard:** `http://localhost:3001/`

### Running Components Independently
- **Driver Display Only:**
  ```bash
  cd driver-display
  npm install
  npm run dev
  ```
- **Dashboard Only:**
  ```bash
  cd dashboard
  npm install
  npm run dev
  ```
- **Backend Only:**
  ```bash
  cd backend
  npm install
  npm start
  ```

---

## Environment Variables

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

| Variable | Default | Purpose |
| :--- | :--- | :--- |
| `PORT` / `BACKEND_PORT` | `4000` | Port for Express & Socket.IO |
| `DRIVER_PORT` | `3000` | Local dev port for Driver Display |
| `DASHBOARD_PORT` | `3001` | Local dev port for Control Dashboard |
| `VITE_BACKEND_URL` | `https://mineguard360-backend.onrender.com` | Backend API and Socket.IO URL for frontends |
| `CORS_ORIGINS` | `https://mineguard360-driver.vercel.app,https://mineguard360-dashboard.vercel.app` | Comma-separated allowed frontend origins |
| `SIMULATION_MODE` | `true` | Enables POC simulation mode indicator |
| `AI_SERVICE_URL` | `""` | Optional URL of external trained AI model |

---

## Deployment

### Backend Deployment
Deploy `backend/` to any Node.js hosting platform (e.g. Render, Railway, AWS EC2):
1. Root directory: `backend`
2. Build command: `npm install`
3. Start command: `npm start`
4. Set `CORS_ORIGINS` to your frontend production URLs.

### Driver Display Deployment
Deploy `driver-display/` to Vercel or Netlify:
1. Root directory: `driver-display`
2. Framework preset: `Vite`
3. Build command: `npm run build`
4. Output directory: `dist`
5. Set `VITE_BACKEND_URL=https://mineguard360-backend.onrender.com`.

### Dashboard Deployment
Deploy `dashboard/` to Vercel or Netlify:
1. Root directory: `dashboard`
2. Framework preset: `Vite`
3. Build command: `npm run build`
4. Output directory: `dist`
5. Set `VITE_BACKEND_URL=https://mineguard360-backend.onrender.com`.

---

## REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Operational Portal with one-click app launch |
| `GET` | `/api/health` | Service health status and timestamp |
| `GET` | `/api/state` | Authoritative system state |
| `POST` | `/api/state` | Update global environment / selected block |
| `POST` | `/api/risk/predict` | AI/ML prediction adapter endpoint |
| `GET` | `/api/risk/status` | AI/ML model status and configuration |
| `GET` | `/api/vehicles` | Telemetry for all active HEMM haul trucks |
| `GET` | `/api/blocks` | Haul block occupancy and token status |
| `POST` | `/api/blocks/:id` | Update specific block occupancy state |
| `GET` | `/api/events` | Latest 50 traceable safety audit events |
| `POST` | `/api/dynamics` | Update vehicle speed and lead distance |
| `POST` | `/api/fault` | Inject or clear hardware/sensor faults |
| `POST` | `/api/scenario` | Trigger one of 14 pre-built operational scenarios |

---

## Safety States
- **`SAFE`**: Clear corridor, safe stopping margin, normal speed permitted.
- **`CAUTION`**: Minor environmental degradation or approaching target; speed advisory capped.
- **`WARNING`**: Obstacle in projected corridor, close separation; driver must reduce speed.
- **`CRITICAL`**: Insufficient stopping distance or critical TTC ($\le 2.0s$); mechanical brake enforced.
- **`EMERGENCY`**: Imminent collision hazard ($TTC \le 1.0s$); maximum emergency braking active.
- **`FAULT`**: Critical sensor failure or brake response mismatch; vehicle brought to a controlled stop.

---

## FOG-LOCK States
- **`FREE`**: Block has zero occupants; open for token reservations.
- **`RESERVED`**: Token granted to an approaching vehicle; entering pending.
- **`OCCUPIED`**: Vehicle is inside the block boundary.
- **`EXIT_PENDING`**: Vehicle is crossing the exit boundary sensor.
- **`UNKNOWN`**: Boundary sensor communication degraded; fail-safe hold enforced.
- **`FAULT`**: Hardware failure on boundary detectors.
- **`CLOSED`**: Block administratively closed by dispatch.

---

## Failure Handling & Graceful Degradation
- **UNKNOWN Never Equals SAFE:** If any telemetry stream drops or becomes corrupt, safety logic treats the area as `UNKNOWN` or `FAULT`.
- **LoRa Mesh Loss:** Vehicles unable to verify token validity automatically enforce reduced speed crawl ($10\text{ km/h}$) and will not enter blind single-lane corridors.
- **Actuator Verification:** If a brake command is issued but deceleration telemetry fails to verify within 500 ms, the system flags `BRAKE_VERIFICATION_FAULT` and sounds continuous cab alerts.

---

## Testing & Quality Assurance
Run the complete automated test suite across all packages:
```bash
npm test
```
- **127 automated unit and integration tests** verifying:
  - Sound alarm state transitions and auto-silencing.
  - Stopping distance calculations and kinematic margins.
  - Multi-language translation integrity across all 8 languages.
  - WebSocket state synchronization.
  - Deterministic priority hierarchy resolution.

---

## POC Limitations
- Sensor telemetry is generated via mathematical simulation models and high-fidelity mock data generators rather than physical CAN-bus transceivers.
- Boundary detection uses simulated tripwire events rather than physical microwave gate beams.
- Machine learning risk scores currently utilize a validated kinematic simulation adapter until model training on opencast pit datasets is completed.

---

## Future Work
- Direct hardware integration with ESP32-S3 radar nodes and J1939 CAN transceivers.
- Real-time V2V LoRaWAN ad-hoc mesh field trials in active open-cast coal mines.
- Edge TensorRT inference deployment on vehicle-mounted NVIDIA Jetson Orin compute modules.

---

## Team / Project Information
- **Project Name:** MineGuard360
- **Subsystems:** FOG-HEMM + FOG-LOCK
- **Application Focus:** Smart Opencast Mining Safety & Realtime Collision Avoidance
- **License:** Proprietary / Smart Mining Hackathon PoC
