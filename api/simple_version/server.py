from fastapi import FastAPI
import uvicorn
from datetime import datetime
from pydantic import BaseModel
from typing import List, Dict

# Создаем приложение FastAPI
app = FastAPI(title="Сервер для настоящих роботов")

# Здесь будем хранить все данные от роботов
all_robot_data = []


# Модели для данных от роботов (чтобы FastAPI понимал структуру)
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


@app.get("/")
async def home():
    """Главная страница"""
    return {
        "message": "🚀 Сервер для настоящих роботов запущен!",
        "endpoints": {
            "посмотреть данные": "/robots-data",
            "очистить данные": "/clear-data",
            "статистика": "/stats"
        },
        "total_messages": len(all_robot_data)
    }


@app.post("/api/robots/data")
async def receive_robot_data(data: RobotData):
    """
    Принимаем данные от роботов (как в оригинальном эмуляторе)
    """
    # Добавляем время получения
    received_data = {
        **data.dict(),
        "received_at": datetime.now().strftime("%H:%M:%S"),
        "server_timestamp": datetime.utcnow().isoformat() + "Z"
    }

    # Сохраняем данные
    all_robot_data.append(received_data)

    # Оставляем только последние 50 сообщений
    if len(all_robot_data) > 50:
        all_robot_data.pop(0)

    print(f"✅ Получены данные от {data.robot_id}")
    print(f"   📍 Локация: {data.location.zone}-{data.location.row}-{data.location.shelf}")
    print(f"   🔋 Батарея: {data.battery_level}%")
    print(f"   📦 Товаров: {len(data.scan_results)}")

    return {"status": "success", "message": "Data received"}


@app.get("/api/robots/data")
async def get_robots_data():
    """Показываем все данные от роботов"""
    return {
        "total_messages": len(all_robot_data),
        "robots_data": all_robot_data
    }


@app.get("/stats")
async def get_stats():
    """Статистика по роботам"""
    if not all_robot_data:
        return {"message": "Пока нет данных от роботов"}

    # Собираем статистику
    robot_ids = list(set(item["robot_id"] for item in all_robot_data))
    total_products = sum(len(item["scan_results"]) for item in all_robot_data)

    # Последние данные каждого робота
    latest_data = {}
    for robot_id in robot_ids:
        robot_messages = [item for item in all_robot_data if item["robot_id"] == robot_id]
        if robot_messages:
            latest_data[robot_id] = robot_messages[-1]

    return {
        "total_robots": len(robot_ids),
        "total_messages": len(all_robot_data),
        "total_products_scanned": total_products,
        "robots": robot_ids,
        "latest_data": latest_data
    }


@app.get("/clear-data")
async def clear_data():
    """Очищаем все данные"""
    all_robot_data.clear()
    return {"message": "Все данные очищены!"}


# Запускаем сервер
if __name__ == "__main__":
    print("🚀 Запускаем сервер для НАСТОЯЩИХ роботов...")
    print("📖 Откройте в браузере: http://localhost:8000")
    print("👀 Данные роботов: http://localhost:8000/api/robots/data")
    print("📊 Статистика: http://localhost:8000/stats")
    uvicorn.run(app, host="0.0.0.0", port=8000)