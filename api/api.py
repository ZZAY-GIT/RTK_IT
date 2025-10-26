from datetime import datetime

from fastapi import FastAPI, Depends, WebSocket, WebSocketDisconnect
import asyncio
from db.DataBaseManager import db
from settings import settings
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from auth.auth_service import auth_service
from typing import List, Dict
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import logging
from api.websocket_manager import ws_manager, ws_handler


app = FastAPI(title="Simple FastAPI Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # или ["*"] для разработки
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

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

@app.on_event("startup")
async def startup_event():
    """Запуск фоновых задач при старте приложения"""
    logging.info("Starting application...")
    
    # Запускаем фоновую задачу для broadcast обновлений
    asyncio.create_task(
        ws_manager.broadcast_dashboard_updates(
            interval=5  # Обновления каждые 3 секунды
        )
    )
    
    logging.info("WebSocket broadcast task started")


@app.on_event("shutdown")
async def shutdown_event():
    """Очистка при остановке приложения"""
    logging.info("Shutting down application...")
    
    # Закрываем все активные WebSocket соединения
    for connection in ws_manager.active_connections[:]:
        try:
            await connection.close()
        except:
            pass
    
    logging.info("All WebSocket connections closed")

class LoginRequest(BaseModel):
    email: str
    password: str

@app.post("/api/auth/login")
def login(form_data: LoginRequest):
    return auth_service.login(form_data.email, form_data.password)

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


@app.websocket("/api/ws/dashboard")
async def websocket_dashboard(websocket: WebSocket):
    """
    WebSocket endpoint для real-time обновлений дашборда
    
    Клиент может отправлять:
    - "ping" - проверка соединения
    - {"type": "refresh"} - запросить немедленное обновление
    - {"type": "subscribe"} - подписаться на обновления (по умолчанию)
    
    Сервер отправляет:
    - {"type": "initial_data", "data": {...}} - при подключении
    - {"type": "dashboard_update", "data": {...}} - периодические обновления
    - {"type": "ping"} - проверка соединения
    - {"type": "pong"} - ответ на ping от клиента
    """
    await ws_handler.handle_connection(websocket, db)


@app.get("/api/ws/status")
async def websocket_status():
    """Получить статус WebSocket соединений"""
    return {
        "active_connections": ws_manager.get_connections_count(),
        "status": "operational"
    }


# =============== Health Check ===============

@app.get("/health")
async def health_check():
    """Проверка здоровья приложения"""
    return {
        "status": "healthy",
        "websocket_connections": ws_manager.get_connections_count()
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
