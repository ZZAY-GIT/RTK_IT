from fastapi import FastAPI, Depends, HTTPException
from typing import List
from DB.schemas import RobotDataCreate, RobotDataResponse
from DB.DataBaseManager import DataBaseManager
from settings import settings
from fastapi.security import OAuth2PasswordRequestForm
from auth.auth_service import auth_service
import json
from pydantic import BaseModel
from typing import List, Dict

db = DataBaseManager(settings.CONN_STR)

app = FastAPI(title="Simple FastAPI Service", version="1.0.0")

@app.get("/test")
def read_user(user_id: int | None = None):
    """Получить пользователя по ID"""
    state = {"robots": [123, 332, 12], "recent_scans": [543], "statistics": {123: {"battary": 98, "coords": (123, 322)}}}
    return state

@app.post("/api/auth/login")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    return auth_service.login(form_data.username, form_data.password)

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

@app.post("/api/robots/data")
def receive_robot_data(data: dict):
    with open("C:\\RTK_IT\\api\\test.json", "a", encoding="utf-8") as file:
        json.dump(data, file, ensure_ascii=False, indent=4)
    return {"status": "success", "message": "Data received"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)





