from fastapi import FastAPI, Depends
from DB.DataBaseManager import DataBaseManager
from settings import settings
from fastapi.security import OAuth2PasswordRequestForm
from auth.auth_service import auth_service
from typing import List, Dict
from pydantic import BaseModel
import json

db = DataBaseManager(settings.CONN_STR)

app = FastAPI(title="Simple FastAPI Service", version="1.0.0")

class PredictRequest(BaseModel):
    period_days: int
    categories: List[Dict]

class PredictResponse(BaseModel):
    predictions: List[Dict]
    confidence: float



@app.get("/test")
def read_user(user_id: int | None = None):
    """Получить пользователя по ID"""
    state = {"robots": [123, 332, 12], "recent_scans": [543], "statistics": {123: {"battary": 98, "coords": (123, 322)}}}
    return state

@app.post("/api/auth/login")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    return auth_service.login(form_data.username, form_data.password)



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

@app.post("/api/robots/data")
def receive_robot_data(data: dict):
    pass
    # with open("C:\\RTK_IT\\api\\test.json", "a", encoding="utf-8") as file:
    #     json.dump(data, file, ensure_ascii=False, indent=4)
    # return {"status": "success", "message": "Data received"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
