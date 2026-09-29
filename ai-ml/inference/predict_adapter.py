"""
MineGuard360 AI/ML Reference Inference Adapter
Sample Python FastAPI service demonstrating the model prediction contract.
"""

from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional

app = FastAPI(title="MineGuard360 AI Risk Advisory Service")

class RiskPredictionInput(BaseModel):
    vehicle_id: str = "HEMM-001"
    speed: float = 25.0
    distance: float = 30.0
    relative_velocity: float = -4.0
    ttc: Optional[float] = None
    stopping_distance: Optional[float] = None
    required_distance: Optional[float] = None
    block_status: str = "OCCUPIED"
    safe_corridor: str = "CENTER"
    sensor_health: str = "GOOD"

class RiskPredictionOutput(BaseModel):
    risk_score: int
    risk_level: str
    model_status: str

@app.post("/predict", response_model=RiskPredictionOutput)
def predict_risk(data: RiskPredictionInput):
    # Replace this calculation with your trained PyTorch / TensorFlow / Scikit-learn model inference:
    score = 15
    if data.ttc is not None:
        if data.ttc < 1.5:
            score += 70
        elif data.ttc < 2.5:
            score += 50
        elif data.ttc < 4.0:
            score += 30
        elif data.ttc < 6.0:
            score += 15

    if data.distance is not None and data.stopping_distance is not None:
        if data.distance < data.stopping_distance:
            score += 25

    if data.sensor_health in ["DEGRADED", "FAULT"]:
        score += 15

    final_score = max(5, min(99, int(score)))

    if final_score >= 80:
        level = "CRITICAL"
    elif final_score >= 60:
        level = "HIGH"
    elif final_score >= 35:
        level = "MEDIUM"
    else:
        level = "LOW"

    return {
        "risk_score": final_score,
        "risk_level": level,
        "model_status": "AVAILABLE"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
