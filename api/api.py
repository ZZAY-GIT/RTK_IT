from datetime import datetime
import asyncio
from contextlib import asynccontextmanager
from db.DataBaseManager import db
import pandas as pd
from fastapi import FastAPI, UploadFile, File, HTTPException, WebSocket, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from auth.auth_service import auth_service
from typing import List, Dict, Optional
import io
from settings import settings
import logging
from api.websocket_manager import ws_manager, ws_handler
from api.schemas import (
    UserCreate, UserUpdate, UserResponse,
    ProductCreate, ProductUpdate, ProductResponse,
    RobotCreate, RobotUpdate, RobotResponse,
    PredictRequest, PredictResponse, LoginRequest
)

from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

app = FastAPI(title="Simple FastAPI Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # или ["*"] для разработки
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

security = HTTPBearer()


def admin_required(current_user: UserResponse):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Запуск при старте приложения
    logging.info("Starting application...")
    
    # Запускаем фоновую задачу для broadcast обновлений
    broadcast_task = asyncio.create_task(
        ws_manager.broadcast_dashboard_updates(
            interval=5  # Обновления каждые 5 секунд
        )
    )
    
    logging.info("WebSocket broadcast task started")
    
    yield  # Приложение работает
    
    # Очистка при остановке приложения
    logging.info("Shutting down application...")
    
    # Отменяем фоновую задачу
    broadcast_task.cancel()
    try:
        await broadcast_task
    except asyncio.CancelledError:
        pass
    
    # Закрываем все активные WebSocket соединения
    for connection in ws_manager.active_connections[:]:
        try:
            await connection.close()
        except:
            pass
    
    logging.info("All WebSocket connections closed")

app = FastAPI(title="Simple FastAPI Service", version="1.0.0", lifespan=lifespan)

# Остальной код остается без изменений...
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # или ["*"] для разработки
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

@app.post("/api/auth/login")
def login(form_data: LoginRequest):
    return auth_service.login(form_data.email, form_data.password)


@app.post("/api/ai/predict/post", response_model=PredictResponse)
def predict(request: PredictRequest):
    db.add_predictions(request)

@app.get("/api/ai/predict", response_model=PredictResponse)
def predict(request: PredictRequest):
    predictions = db.get_last_predictions()
    return predictions

@app.post("/api/robots/data")
def receive_robot_data(data: dict):
    status = db.add_robot_data(data)
    

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
                logging.error(f"Error with record {record}: {e}")
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
        logging.error(f"CSV import error: {e}")
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

# =============== Admin Endpoints ===============

# User endpoints
@app.post("/api/admin/user", response_model=UserResponse)
def create_user(user: UserCreate, current_user: UserResponse = Depends(admin_required)):
    db_user = db.add_user(user.email, user.password, user.name, user.role)
    if not db_user:
        raise HTTPException(status_code=400, detail="User with this email already exists")
    return db_user

@app.get("/api/admin/user", response_model=List[UserResponse])
def get_all_users(current_user: UserResponse = Depends(admin_required)):
    users = db.get_all_users()
    return users

@app.get("/api/admin/user/{user_id}", response_model=UserResponse)
def get_user(user_id: int, current_user: UserResponse = Depends(admin_required)):
    user = db.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.put("/api/admin/user/{user_id}", response_model=UserResponse)
def update_user(user_id: int, user_update: UserUpdate, current_user: UserResponse = Depends(admin_required)):
    # Преобразуем Pydantic модель в словарь для передачи в метод обновления
    update_data = user_update.dict(exclude_unset=True)
    user = db.update_user(user_id, **update_data)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.delete("/api/admin/user/{user_id}")
def delete_user(user_id: int, current_user: UserResponse = Depends(admin_required)):
    success = db.delete_user(user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return {"status": "success", "message": "User deleted successfully"}

# Product endpoints
@app.post("/api/admin/product", response_model=ProductResponse)
def create_product(product: ProductCreate, current_user: UserResponse = Depends(admin_required)):
    success = db.add_product(product.id, product.name, product.category, product.min_stock, product.optimal_stock)
    if not success:
        raise HTTPException(status_code=400, detail="Product with this ID already exists")
    return db.get_product(product.id)

@app.get("/api/admin/product", response_model=List[ProductResponse])
def get_all_products(current_user: UserResponse = Depends(admin_required)):
    products = db.get_all_products()
    return products

@app.get("/api/admin/product/{product_id}", response_model=ProductResponse)
def get_product(product_id: str, current_user: UserResponse = Depends(admin_required)):
    product = db.get_product(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@app.put("/api/admin/product/{product_id}", response_model=ProductResponse)
def update_product(product_id: str, product_update: ProductUpdate, current_user: UserResponse = Depends(admin_required)):
    # Преобразуем Pydantic модель в словарь для передачи в метод обновления
    update_data = product_update.dict(exclude_unset=True)
    product = db.update_product(product_id, **update_data)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@app.delete("/api/admin/product/{product_id}")
def delete_product(product_id: str, current_user: UserResponse = Depends(admin_required)):
    success = db.delete_product(product_id)
    if not success:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"status": "success", "message": "Product deleted successfully"}

# Robot endpoints
@app.post("/api/admin/robot", response_model=RobotResponse)
def create_robot(robot: RobotCreate, current_user: UserResponse = Depends(admin_required)):
    db_robot = db.add_robot(robot.id, robot.status, robot.battery_level)
    if not db_robot:
        raise HTTPException(status_code=400, detail="Robot with this ID already exists")
    return db_robot

@app.get("/api/admin/robot", response_model=List[RobotResponse])
def get_all_robots(current_user: UserResponse = Depends(admin_required)):
    robots = db.get_all_robots()
    return robots

@app.get("/api/admin/robot/{robot_id}", response_model=RobotResponse)
def get_robot(robot_id: str, current_user: UserResponse = Depends(admin_required)):
    robot = db.get_robot(robot_id)
    if not robot:
        raise HTTPException(status_code=404, detail="Robot not found")
    return robot

@app.put("/api/admin/robot/{robot_id}", response_model=RobotResponse)
def update_robot(robot_id: str, robot_update: RobotUpdate, current_user: UserResponse = Depends(admin_required)):
    # Преобразуем Pydantic модель в словарь для передачи в метод обновления
    update_data = robot_update.dict(exclude_unset=True)
    robot = db.update_robot(robot_id, **update_data)
    if not robot:
        raise HTTPException(status_code=404, detail="Robot not found")
    return robot

@app.delete("/api/admin/robot/{robot_id}")
def delete_robot(robot_id: str, current_user: UserResponse = Depends(admin_required)):
    success = db.delete_robot(robot_id)
    if not success:
        raise HTTPException(status_code=404, detail="Robot not found")
    return {"status": "success", "message": "Robot deleted successfully"}

# =============== WebSocket ===============

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
    await ws_handler.handle_connection(websocket)


@app.get("/api/ws/status")
async def websocket_status():
    """Получить статус WebSocket соединений"""
    return {
        "active_connections": ws_manager.get_connections_count(),
        "status": "operational"
    }


# =============== Health Check ===============

@app.get("/")
@app.get("/health")
async def health_check():
    """Проверка здоровья приложения"""
    return {
        "status": "healthy",
        "websocket_connections": ws_manager.get_connections_count()
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="localhost", port=8000)