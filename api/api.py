from datetime import datetime

from fastapi import FastAPI, Depends, WebSocket, WebSocketDisconnect
import asyncio
from db.DataBaseManager import db
import pandas as pd
from fastapi import FastAPI, Depends, UploadFile, File, HTTPException
from settings import settings
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from auth.auth_service import auth_service
from typing import List, Dict
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
import io
import logging
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
    return {"status": "success", "message": "Data received"}

    
@app.post("/api/inventory/import")
def add_csv_file(file_csv: UploadFile = File(...)):
    if not file_csv.filename.lower().endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed")
    
    try:
        # Читаем файл
        contents = file_csv.file.read()
        csv_text = contents.decode('utf-8')
        
        # Используем StringIO для pandas
        df = pd.read_csv(io.StringIO(csv_text), delimiter=';')
        records = df.to_dict('records')
        
        # Добавляем записи в БД
        success_count = 0
        for record in records:
            try:
                db.add_robot_data_csv(record)
                success_count += 1
            except Exception as e:
                logger.error(f"Error with record {record}: {e}")
                continue
        
        return {
            "status": "success", 
            "records_processed": success_count,
            "total_records": len(records)
        }
        
    except pd.errors.EmptyDataError:
        raise HTTPException(status_code=400, detail="CSV file is empty")
    except pd.errors.ParserError:
        raise HTTPException(status_code=400, detail="Error parsing CSV file")
    except Exception as e:
        logger.error(f"CSV import error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
    finally:
        file_csv.file.close()
    

@app.get("/api/dashboard/current")
def get_current_data():
    data = db.get_current_state()
    return data

@app.get("/api/inventory/history")
def get_inventory_history(
    from_date: Optional[str] = None,
    to_date: Optional[str] = None, 
    zone: Optional[str] = None,
    status: Optional[str] = None):
    from_dt = datetime.fromisoformat(from_date) if from_date else None
    to_dt = datetime.fromisoformat(to_date) if to_date else None
    
    items = db.get_filter_inventory_history(
        from_date=from_dt, 
        to_date=to_dt, 
        zone=zone, 
        status=status
    )
    
    return {
        "total": len(items),
        "items": items,
        "pagination": {}  # пустой объект, как в требовании
    }

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
