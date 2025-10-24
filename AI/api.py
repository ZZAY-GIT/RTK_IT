from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Dict

app = FastAPI()

class PredictRequest(BaseModel):
    period_days: int
    categories: List[Dict]

class PredictResponse(BaseModel):
    predictions: List[Dict]
    confidence: float

@app.post("/api/ai/predict", response_model=PredictResponse)
def predict(request: PredictRequest):
    return {
        "predictions": request.categories,
        "confidence": 0.95
    }

@app.get("/test")
def read_user(user_id: int | None = None):
    """Получить пользователя по ID"""
    state = {"robots": [123, 332, 12], "recent_scans": [543], "statistics": {123: {"battary": 98, "coords": (123, 322)}}}
    return state

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
