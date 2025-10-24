# websocket_manager.py
from fastapi import WebSocket
from typing import List, Dict
import json
from datetime import datetime


class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"WebSocket connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        print(f"WebSocket disconnected. Total connections: {len(self.active_connections)}")

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        await websocket.send_json(message)

    async def broadcast(self, message: dict):
        disconnected_connections = []

        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                disconnected_connections.append(connection)

        # Удаляем отключенные соединения
        for connection in disconnected_connections:
            self.disconnect(connection)


# Глобальный экземпляр менеджера
manager = ConnectionManager()


# Функции для отправки конкретных типов сообщений
async def send_robot_update(robot_data: Dict):
    message = {
        "type": "robot_update",
        "data": robot_data,
        "timestamp": datetime.now().isoformat() + "Z"
    }
    await manager.broadcast(message)


async def send_inventory_alert(alert_data: Dict):
    message = {
        "type": "inventory_alert",
        "data": alert_data,
        "timestamp": datetime.now().isoformat() + "Z"
    }
    await manager.broadcast(message)