from datetime import datetime

from fastapi import FastAPI, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy.connectors import asyncio

from db.DataBaseManager import DataBaseManager
from settings import settings
from fastapi.security import OAuth2PasswordRequestForm
from auth.auth_service import auth_service
from typing import List, Dict
from pydantic import BaseModel
import json
from api.websocket_manager import manager, send_robot_update, send_inventory_alert

db = DataBaseManager(settings.CONN_STR)

async def periodic_dashboard_updates():
    "Фоновая задача для обновления статистики каждые 5 сек"
    while True:
        try:  # Получаем текущие данные из базы
            current_data = db.get_current_state()

            # Отправляем обновление через WebSocket
            await manager.broadcast({
                "type": "statistics_update",
                "data": current_data,
                "timestamp": datetime.now().isoformat() + "Z"
            })

        except Exception as e:
            print(f"Error in periodic updates: {e}")

        await asyncio.sleep(5)
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


@app.websocket("/api/ws/dashboard")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Ожидаем сообщения от клиента (можно использовать для heartbeat)
            data = await websocket.receive_text()
            # Обрабатываем команды от клиента если нужно
            try:
                command = json.loads(data)
                if command.get("type") == "ping":
                    await manager.send_personal_message({"type": "pong"}, websocket)
            except json.JSONDecodeError:
                pass

    except WebSocketDisconnect:
        manager.disconnect(websocket)

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
async def receive_robot_data(data: RobotData):
    status = db.add_robot_data(data)
    if status:
        # Отправляем обновление через WebSocket
        await send_robot_update({
            "robot_id": data.robot_id,
            "battery_level": data.battery_level,
            "location": data.location.dict(),
            "status": "active",
            "last_update": data.timestamp
        })
@app.get("/api/inventory/history")
async def get_history():
    # history = db.get_last_day_inventory_history()
    # return history
    return {"status": "ok", "message": "History endpoint stub for WebSocket testing"}

@app.get("/api/dashboard/current")
async def get_current_data():
    data = db.get_current_state()
    return data


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
