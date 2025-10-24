from fastapi import FastAPI, Depends
from db.DataBaseManager import DataBaseManager
from settings import settings
from fastapi.security import OAuth2PasswordRequestForm
from auth.auth_service import auth_service
from typing import List, Dict
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
import json

db = DataBaseManager(settings.CONN_STR)

app = FastAPI(title="Simple FastAPI Service", version="1.0.0")

class PredictRequest(BaseModel):
    period_days: int
    categories: List[Dict]

class PredictResponse(BaseModel):
    predictions: List[Dict]
    confidence: float

class Location(BaseModel):
    zone: str
    row: int
    shelf: int

class ScanResult(BaseModel):
    product_id: str
    product_name: str
    quantity: int
    status: str

class RobotData(BaseModel):
    robot_id: str
    timestamp: str
    location: Location
    scan_results: List[ScanResult]
    battery_level: float
    next_checkpoint: str


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
def receive_robot_data(data: RobotData):
    status = db.add_robot_data(data)
    if status:
        return {"status": "success", "message": "Data received"}
    else: 
        return {"status": "failed", "message": "Data not received"}
    
@app.get("/api/dashboard/current")
def get_current_data():
    data = db.get_current_state()
    return data

@app.get("/api/inventory/history")
def get_inventory_history(
    from_date: Optional[str] = None,
    to_date: Optional[str] = None, 
    zone: Optional[str] = None,
    status: Optional[str] = None
):
    from_dt = datetime.fromisoformat(from_date) if from_date else None
    to_dt = datetime.fromisoformat(to_date) if to_date else None
    result = db.get_filter_inventory_history(from_date=from_dt, to_date=to_dt, zone=zone, status=status)
    return result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
