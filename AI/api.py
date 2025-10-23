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
async def predict(request: PredictRequest):
    # Пример: просто возвращаем те же категории с confidence=0.95
    return {
        "predictions": request.categories,
        "confidence": 0.95
    }