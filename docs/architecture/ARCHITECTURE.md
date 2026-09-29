# MineGuard360 — System Architecture

## Executive Summary
MineGuard360 is a mission-critical safety platform designed for heavy earth-moving machinery (HEMM) operating in low-visibility opencast mines (dense fog, monsoonal rain, particulate dust).

The platform integrates two core subsystems:
1. **FOG-HEMM (In-Cab Active Collision Avoidance):** Provides millimeter-wave radar obstacle detection, 3D safe corridor tracking, real-time Time-To-Collision (TTC) calculations, and dynamic speed advisory.
2. **FOG-LOCK (Dynamic Movement Authorization):** Manages blind-curve and narrow-haul road block occupancy using digital movement tokens and boundary sensors over local LoRa wireless mesh.

---

## High-Level System Topology

```
                  ┌───────────────────────────────────────────────┐
                  │            MINEGUARD360 BACKEND               │
                  │   Authoritative State & Deterministic Engine  │
                  └───────────────────────┬───────────────────────┘
                                          │
                            WebSocket (Socket.IO) & REST
                                          │
                     ┌────────────────────┴────────────────────┐
                     │                                         │
                     ▼                                         ▼
        ┌─────────────────────────┐               ┌─────────────────────────┐
        │  DRIVER DISPLAY HUD     │               │  CONTROL ROOM DASHBOARD │
        │  (In-Cab Driver View)   │               │  (Mine Operations View) │
        │  Port 3000 / Dedicated  │               │  Port 3001 / Dedicated  │
        └─────────────────────────┘               └─────────────────────────┘
```

---

## Safety Decision Hierarchy & Deterministic Resolver

```
Radar / Wheel Speed / FOG-LOCK Token / Boundary Sensors
                          ↓
                 Sensor Validation Layer
                          ↓
              Kinematic Safety Calculations
          (Closing Velocity, TTC, Stopping Distance)
                          ↓
         AI/ML Risk Advisory (Strictly Non-Authoritative)
                          +
            FOG-LOCK Block Movement Authority
                          ↓
            DETERMINISTIC SAFETY RESOLVER
         (12-Level Priority Safety Hierarchy)
                          ↓
                 FINAL SAFETY DECISION
           (State, Speed Limit, Brake Override)
                          ↓
           Realtime WebSocket State Broadcast
                          ↓
        Driver Display HUD  +  Control-Room Dashboard
```

### Safety Authority Principles
1. **AI/ML is Advisory Only:** AI/ML produces risk predictions (`risk_score`, `risk_level`). It **CANNOT** command vehicle braking directly or override physical safety limits.
2. **Deterministic Safety Resolver is Final Authority:** Physical stopping distance, critical TTC limits, and sensor fail-safes always supersede software advisories.
3. **Fail-Safe UNKNOWN Rule:** Incomplete, corrupted, or stale sensor data automatically resolves to `UNKNOWN` or `FAULT`—it is **NEVER** assumed to be `SAFE`.
4. **LoRa Degradation Handling:** If communication to the FOG-LOCK coordinator is lost, the vehicle enforces safe speed restriction and will not grant entry to unverified blocks.

---

## Component Separation

| Subsystem | Folder | Responsibility |
| :--- | :--- | :--- |
| **Driver Display** | `driver-display/` | In-cab passive HUD, 3D radar hazard spheres, stopping distance, TTC, safe corridor, sound alarms. |
| **Dashboard** | `dashboard/` | Mine-wide overview, haul block occupancy, multi-vehicle telemetry, fault injection, environment simulation. |
| **Backend** | `backend/` | Authoritative simulation, REST API, WebSocket server, SQLite event logging, AI adapter. |
| **Shared Core** | `shared/` | Pure calculation functions, safety rules, configuration thresholds, and TypeScript schemas. |
| **AI/ML** | `ai-ml/` | Model training schemas, inference server adapters, and model weights. |
