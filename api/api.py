from datetime import datetime, timedelta
import asyncio
from contextlib import asynccontextmanager
from db.DataBaseManager import db
import pandas as pd
from fastapi.encoders import jsonable_encoder
from fastapi import FastAPI, UploadFile, File, HTTPException, WebSocket, Depends, status, Header
from fastapi.middleware.cors import CORSMiddleware
from auth.auth_service import auth_service
from typing import List, Dict, Optional
import io
import json
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
from ai.yandex_gpt_client import yandex_client


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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # или ["*"] для разработки
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

security = HTTPBearer(auto_error=False)

def get_current_user_from_client(
    x_user_data: str = Header(..., alias="X-User-Data")
):
    try:
        # 1. Первый раз парсим JSON (убираем экранирование)
        first_parse = json.loads(x_user_data)
        
        # 2. Если результат - строка, парсим еще раз
        if isinstance(first_parse, str):
            user_dict = json.loads(first_parse)
        else:
            user_dict = first_parse
        # 3. Создаем объект UserResponse
        current_user = UserResponse(
            id=user_dict['id'],
            email=user_dict['email'],
            name=user_dict['name'],
            role=user_dict['role']
        )
        
        return current_user
    except (json.JSONDecodeError, KeyError):
        raise HTTPException(status_code=400, detail="Invalid user data in header")
    
def admin_required(current_user: UserResponse = Depends(get_current_user_from_client)):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

def operator_required(current_user: UserResponse = Depends(get_current_user_from_client)):
    if current_user.role != "operator":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="operator access required"
        )
    return current_user

def access_level(current_user: UserResponse = Depends(get_current_user_from_client)):
    if current_user.role not in ["operator", "admin"]:  # ← ИСПРАВЬТЕ ЛОГИКУ
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operator or admin access required"
        )
    return current_user

@app.post("/api/auth/login")
def login(form_data: LoginRequest):
    return auth_service.login(form_data.email, form_data.password)


@app.post("/api/ai/predict/post", response_model=PredictResponse)
def predict(request: PredictRequest):
    """
    Принимает предсказания от внешнего источника и сохраняет их в БД.
    """
    # 1. Извлекаем список предсказаний из тела запроса
    predictions_list = request.categories
    
    # 2. Вызываем исправленный метод БД, передавая ему список предсказаний.
    #    Метод теперь будет возвращать сохраненные данные или None в случае ошибки.
    saved_predictions = db.add_ai_prediction(predictions_list)
    
    # 3. Проверяем результат и возвращаем ответ
    if saved_predictions is None:
        # Если БД вернула ошибку, возвращаем серверную ошибку
        raise HTTPException(status_code=500, detail="Failed to save AI predictions to the database")

    # 4. Формируем и возвращаем успешный ответ в соответствии с моделью PredictResponse
    return PredictResponse(predictions=saved_predictions, confidence=0.75)

# @app.get("/api/ai/predict", response_model=PredictResponse)
# def predict():
#     # current_date = datetime.now().date()
#     # from_date = current_date - timedelta(days=3)
#     # historical_data = db.get_filter_inventory_history(from_date, current_date)
#     # inventory_data = db.get_products_unique(historical_data)
#     # request.categories = inventory_data
#     # predictions = yandex_client.get_prediction(request)
#     # return predictions
#     current_date = datetime.now().date()
#     from_date = current_date - timedelta(days=3)
#     historical_data = db.get_filter_inventory_history(
#         from_date=from_date,
#         to_date=current_date,
#         status="CRITICAL"
#     )
#     inventory_data = db.get_products_unique(historical_data)
#     predictions = yandex_client.get_prediction(inventory_data, historical_data)
#     request = PredictResponse(predictions=predictions, confidence=0.7)
#     return request

@app.get("/api/ai/predict", response_model=PredictResponse)
def get_predict():
    """
    Генерирует новые предсказания с помощью AI, сохраняет их в БД и возвращает.
    """
    # 1. Получаем исторические данные для анализа
    current_date = datetime.now().date()
    from_date = current_date - timedelta(days=3)
    
    historical_data = db.get_filter_inventory_history(
        from_date=from_date,
        to_date=current_date,
        status="CRITICAL"
    )
    
    if not historical_data:
        # Если нет критических остатков, предсказывать нечего
        logging.info("No critical inventory data found for prediction.")
        return PredictResponse(predictions=[], confidence=0.0)

    inventory_data = db.get_products_unique(historical_data)
    
    if not inventory_data:
        # Если уникальных продуктов нет, тоже нечего предсказывать
        logging.info("No unique products found in critical inventory.")
        return PredictResponse(predictions=[], confidence=0.0)

    # 2. Запрашиваем предсказания у AI
    predictions_from_ai = yandex_client.get_prediction(inventory_data, historical_data)
    
    # 3. Обрабатываем результат от AI
    if predictions_from_ai is None:
        # Если AI не смог сгенерировать предсказания, возвращаем ошибку сервера
        raise HTTPException(
            status_code=503, 
            detail="AI service is currently unavailable or returned an error."
        )
    
    # 4. Сохраняем предсказания в базу данных с помощью исправленного метода
    saved_predictions = db.add_ai_prediction(predictions_from_ai)
    
    if saved_predictions is None:
        # Если не удалось сохранить в БД, возвращаем ошибку
        raise HTTPException(
            status_code=500,
            detail="Failed to save AI predictions to the database."
        )
    
    # 5. Возвращаем успешный ответ
    return PredictResponse(predictions=saved_predictions, confidence=0.75)

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
def create_user(user: UserCreate, current_user: UserResponse = Depends(operator_required)):
    db_user = db.add_user(user.email, user.password, user.name, user.role)
    if not db_user:
        raise HTTPException(status_code=400, detail="User with this email already exists")
    return db_user

@app.get("/api/admin/user", response_model=List[UserResponse])
def get_all_users(current_user: UserResponse = Depends(operator_required)):
    if current_user.role != "operator":
        raise HTTPException(403, "Admin access required")
    users = db.get_all_users()
    return jsonable_encoder(users)

@app.put("/api/admin/user/{user_id}", response_model=UserResponse)
def update_user(user_id: int, user_update: UserUpdate, current_user: UserResponse = Depends(operator_required)):
    # Проверяем, что пользователь не пытается изменить себя
    if user_id == current_user.id:
        raise HTTPException(
            status_code=400, 
            detail="You cannot modify your own user account"
        )
    update_data = user_update.dict(exclude_unset=True)
    user = db.update_user(user_id, **update_data)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.delete("/api/admin/user/{user_id}")
def delete_user(user_id: int, current_user: UserResponse = Depends(operator_required)):
    # Проверяем, что пользователь не пытается удалить себя
    if user_id == current_user.id:
        raise HTTPException(
            status_code=400, 
            detail="You cannot delete your own user account"
        )
    
    success = db.delete_user(user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return {"status": "success", "message": "User deleted successfully"}

# Product endpoints
@app.post("/api/admin/products", response_model=ProductResponse)
def create_product(product: ProductCreate, current_user: UserResponse = Depends(operator_required)):
    product_id = db.add_product(
        name=product.name,
        category=product.category,
        min_stock=product.min_stock,
        optimal_stock=product.optimal_stock
    )
    if not product_id:
        raise HTTPException(status_code=400, detail="Failed to create product")
    return db.get_product(product_id)

@app.get("/api/admin/products", response_model=List[ProductResponse])
def get_all_products(current_user: UserResponse = Depends(access_level)):
    products = db.get_all_products()
    return jsonable_encoder(products)

@app.put("/api/admin/products/{product_id}", response_model=ProductResponse)
def update_product(product_id: str, product_update: ProductUpdate, current_user: UserResponse = Depends(access_level)):
    # Преобразуем Pydantic модель в словарь, исключая не установленные поля
    update_data = product_update.dict(exclude_unset=True)
    product = db.update_product(product_id, **update_data)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@app.delete("/api/admin/products/{product_id}")
def delete_product(product_id: str, current_user: UserResponse = Depends(access_level)):
    success = db.delete_product(product_id)
    if not success:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"status": "success", "message": "Product deleted successfully"}

# Robot endpoints
@app.post("/api/admin/robot", response_model=RobotResponse)
def create_robot(robot: RobotCreate, current_user: UserResponse = Depends(operator_required)):
    robot_id = db.add_robot(
        status=robot.status,
        battery_level=robot.battery_level,
        current_zone=robot.current_zone,
        current_row=robot.current_row,
        current_shelf=robot.current_shelf
    )
    if not robot_id:
        raise HTTPException(status_code=400, detail="Failed to create robot")
    return db.get_robot(robot_id)

@app.get("/api/admin/robot", response_model=List[RobotResponse])
def get_all_robots(current_user: UserResponse = Depends(access_level)):
    robots = db.get_all_robots()
    return jsonable_encoder(robots)

@app.put("/api/admin/robot/{robot_id}", response_model=RobotResponse)
def update_robot(robot_id: str, robot_update: RobotUpdate, current_user: UserResponse = Depends(access_level)):
    update_data = robot_update.dict(exclude_unset=True)
    robot = db.update_robot(robot_id, **update_data)
    if not robot:
        raise HTTPException(status_code=404, detail="Robot not found")
    return robot

@app.delete("/api/admin/robot/{robot_id}")
def delete_robot(robot_id: str, current_user: UserResponse = Depends(access_level)):
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