from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict
import uvicorn
from datetime import datetime
from DB.DataBaseManager import db

app = FastAPI(title="Умный склад")


statistics = {
    "total_robots": 0,
    "total_scans": 0,
    "critical_items": 0,
    "active_robots": 0
}

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
        "message": "Умный склад",
        "endpoints": {
            "принять_данные_робота": "POST /api/robots/data",
            "посмотреть_данные": "GET /api/dashboard/current",
            "статистика": "GET /stats"
        }
    }


@app.post("/api/robots/data")
async def receive_robot_data(data: RobotData):

    # Сохраняем данные
    db.send_robot_data(data)

    # # Обновляем статистику
    # statistics["total_scans"] += len(data.scan_results)
    # statistics["critical_items"] = sum(
    #     1 for item in all_robot_data
    #     for scan in item["scan_results"]
    #     if scan["status"] == "CRITICAL"
    # )

    # # Определяем активных роботов (последние 2 минуты)
    # recent_robots = set()
    # for item in all_robot_data[-20:]:  # Последние 20 сообщений
    #     recent_robots.add(item["robot_id"])

    # statistics["active_robots"] = len(recent_robots)
    # statistics["total_robots"] = max(statistics["total_robots"], len(recent_robots))

    # # Оставляем только последние 50 сообщений
    # if len(all_robot_data) > 50:
    #     all_robot_data.pop(0)

    return {"status": "success", "message": "Data received"}


@app.get("/api/dashboard/current")
async def get_current_data():

    # # Последние 10 сканирований
    # recent_scans = []
    # for item in all_robot_data[-10:]:
    #     for scan in item["scan_results"]:
    #         recent_scans.append({
    #             "time": item["received_at"],
    #             "robot_id": item["robot_id"],
    #             "zone": f"{item['location']['zone']}-{item['location']['row']}-{item['location']['shelf']}",
    #             "product_name": scan["product_name"],
    #             "quantity": scan["quantity"],
    #             "status": scan["status"]
    #         })
    #
    # # Активные роботы
    # active_robots = []
    # robot_ids = set(item["robot_id"] for item in all_robot_data[-20:])
    #
    # for robot_id in robot_ids:
    #     # Берем последние данные робота
    #     robot_data = next((item for item in reversed(all_robot_data) if item["robot_id"] == robot_id), None)
    #     if robot_data:
    #         active_robots.append({
    #             "robot_id": robot_id,
    #             "battery_level": robot_data["battery_level"],
    #             "location": robot_data["location"],
    #             "last_update": robot_data["received_at"]
    #         })
    data = db.get_current_state()

    return data
    # {
    #     "robots": active_robots,
    #     "recent_scans": recent_scans[-20:],  # Последние 20 сканирований
    #     "statistics": statistics
     # }



@app.get("/api/inventory/history")
async def get_history():
    history = db.get_history()

    return history
    #  {
    #
    #     "total": len(all_robot_data),
    #     "items": all_robot_data[-20:]  # Последние 20 записей
    #  }


if __name__ == "__main__":
    print("Запускаем минимальную версию Умного склада...")
    print("Откройте: http://localhost:8000")
    print("Данные: http://localhost:8000/api/dashboard/current")
    print("Статистика: http://localhost:8000/stats")
    uvicorn.run(app, host="0.0.0.0", port=8000)