# app/api/v1/dashboard/websocket_manager.py
from fastapi import WebSocket, WebSocketDisconnect
from typing import List
from datetime import datetime
import json
import logging
import asyncio
from app.db.DataBaseManager import db as async_db  # ← Асинхронный менеджер

logger = logging.getLogger(__name__)


class WebSocketConnectionManager:
    """Менеджер для управления WebSocket соединениями"""

    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self._broadcast_task = None

    async def connect(self, websocket: WebSocket):
        """Принять новое WebSocket соединение"""
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(
            f"Client connected. Total connections: {len(self.active_connections)}"
        )

    def disconnect(self, websocket: WebSocket):
        """Отключить WebSocket соединение"""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(
                f"WebSocket disconnected. Total connections: {len(self.active_connections)}"
            )

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        """Отправить сообщение конкретному клиенту"""
        try:
            await websocket.send_text(json.dumps(message, default=str))
        except Exception as e:
            logger.error(f"Error sending message to client: {e}")
            self.disconnect(websocket)

    async def broadcast(self, message: dict):
        """Отправить сообщение всем подключенным клиентам"""
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_text(json.dumps(message, default=str))
            except Exception as e:
                logger.error(f"Error broadcasting to client: {e}")
                disconnected.append(connection)
        for conn in disconnected:
            self.disconnect(conn)

    def get_connections_count(self) -> int:
        """Получить количество активных соединений"""
        return len(self.active_connections)

    async def broadcast_dashboard_updates(self, interval: int = 5):
        """
        Фоновая задача для периодической отправки обновлений дашборда
        """
        await asyncio.sleep(2)
        logger.info(f"Starting dashboard broadcast task (interval: {interval}s)")

        while True:
            try:
                if self.active_connections:
                    # ИСПРАВЛЕНО: Просто вызываем метод, без создания сессии
                    current_data = await async_db.get_current_state()

                    message = {
                        "type": "dashboard_update",
                        "data": current_data,
                        "timestamp": datetime.now().isoformat(),
                    }
                    await self.broadcast(message)
                    logger.info(
                        f"Broadcasted update to {len(self.active_connections)} clients"
                    )

                await asyncio.sleep(interval)

            except Exception as e:
                logger.error(f"Error in broadcast task: {e}")
                await asyncio.sleep(interval)


class WebSocketHandler:
    """Обработчик WebSocket соединений"""

    def __init__(self, manager: WebSocketConnectionManager):
        self.manager = manager

    async def handle_connection(self, websocket: WebSocket):
        """
        Обработать WebSocket соединение
        """
        await self.manager.connect(websocket)
        try:
            initial_data = await async_db.get_current_state()

            await self.manager.send_personal_message(
                {
                    "type": "initial_data",
                    "data": initial_data,
                    "timestamp": datetime.now().isoformat(),
                },
                websocket,
            )

            # Обрабатываем входящие сообщения от клиента
            while True:
                try:
                    data = await asyncio.wait_for(
                        websocket.receive_text(), timeout=30.0
                    )
                    await self._handle_message(data, websocket)

                except asyncio.TimeoutError:
                    await self.manager.send_personal_message(
                        {"type": "ping"}, websocket
                    )

        except WebSocketDisconnect:
            logger.info("Client disconnected normally")
            self.manager.disconnect(websocket)

        except Exception as e:
            logger.error(f"WebSocket error: {e}")
            self.manager.disconnect(websocket)

    async def _handle_message(self, data: str, websocket: WebSocket):
        """Обработать входящее сообщение от клиента"""
        try:
            if data == "ping":
                await self.manager.send_personal_message({"type": "pong"}, websocket)
            elif data == "pong":
                pass
            elif data.startswith("{"):
                message = json.loads(data)
                await self._handle_json_message(message, websocket)
            else:
                logger.warning(f"Unknown message format: {data}")

        except json.JSONDecodeError:
            logger.warning(f"Invalid JSON received: {data}")
        except Exception as e:
            logger.error(f"Error handling message: {e}")

    async def _handle_json_message(self, message: dict, websocket: WebSocket):
        """Обработать JSON сообщение"""
        message_type = message.get("type")

        if message_type == "refresh":
            current_data = await async_db.get_current_state()
            await self.manager.send_personal_message(
                {
                    "type": "dashboard_update",
                    "data": current_data,
                    "timestamp": datetime.now().isoformat(),
                },
                websocket,
            )
        elif message_type == "subscribe":
            await self.manager.send_personal_message(
                {"type": "subscribed", "status": "success"}, websocket
            )
        else:
            logger.warning(f"Unknown message type: {message_type}")


# Глобальные экземпляры
ws_manager = WebSocketConnectionManager()
ws_handler = WebSocketHandler(ws_manager)
