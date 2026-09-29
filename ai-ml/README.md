# MineGuard360 — AI/ML Risk Advisory Subsystem

## Overview
This subsystem provides Machine Learning risk scoring and predictive analytics for low-visibility haul road operations.

> **CRITICAL ARCHITECTURAL SAFETY RULE**
> - The AI/ML model output is **STRICTLY ADVISORY**.
> - The AI/ML model **CANNOT** directly command mechanical braking, motor cut-off, or grant/deny FOG-LOCK block authorizations.
> - The **Deterministic Safety Resolver** in `shared/safety/` is the **FINAL and SOLE safety authority**.
> - When the AI/ML model is unreachable or unavailable, the system continues running safely in POC / SIMULATION mode without interrupting operations.

---

## Model Prediction API Contract

The trained AI/ML model must expose a standard HTTP endpoint:

### Endpoint
`POST /predict`

### Input Payload (JSON)
```json
{
  "vehicle_id": "HEMM-001",
  "speed": 35.0,
  "distance": 18.5,
  "relative_velocity": -12.2,
  "ttc": 2.1,
  "stopping_distance": 24.0,
  "required_distance": 30.0,
  "block_status": "OCCUPIED",
  "safe_corridor": "CENTER",
  "sensor_health": "GOOD"
}
```

### Output Response (JSON)
```json
{
  "risk_score": 87,
  "risk_level": "HIGH",
  "model_status": "AVAILABLE"
}
```

### Value Ranges
| Field | Type | Permitted Values | Description |
| :--- | :--- | :--- | :--- |
| `risk_score` | Integer | `0` to `100` | Normalized collision/hazard risk assessment |
| `risk_level` | String | `"LOW"`, `"MEDIUM"`, `"HIGH"`, `"CRITICAL"` | Categorical risk band |
| `model_status`| String | `"AVAILABLE"`, `"DEGRADED"`, `"UNAVAILABLE"` | Model operational health |

---

## Risk Band Classification
- **LOW (0 - 34):** Nominal operating conditions, safe following distance.
- **MEDIUM (35 - 59):** Approaching hazard, degraded visibility, precautionary deceleration advised.
- **HIGH (60 - 79):** Significant closing rate, low margin; triggers driver display `WARNING` with `SLOW_DOWN` advisory.
- **CRITICAL (80 - 100):** Extreme proximity or emergency threshold; deterministic resolver enforces braking.

---

## Integration with MineGuard360 Backend

When the model is ready:
1. Start your Python inference server (e.g. FastAPI / Flask / TorchServe) on any port (e.g. `http://localhost:5000`).
2. Set the `AI_SERVICE_URL` environment variable in the root `.env` or `backend/.env`:
   ```env
   AI_SERVICE_URL=http://localhost:5000
   ```
3. The MineGuard360 backend will automatically proxy incoming risk evaluation requests to your model and broadcast the advisory output over WebSockets to both the Driver Display and Control-Room Dashboard.
4. If `AI_SERVICE_URL` is empty, the backend automatically uses its built-in kinematic simulation adapter (`POC / SIMULATION`).
