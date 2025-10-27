# websocket_manager.py
from fastapi import WebSocket, WebSocketDisconnect
from typing import List, Dict
from datetime import datetime
from db.DataBaseManager import db
import json
import logging
import asyncio


class WebSocketConnectionManager:
    """Менеджер для управления WebSocket соединениями"""
    
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self._broadcast_task = None

    async def connect(self, websocket: WebSocket):
        """Принять новое WebSocket соединение"""
        await websocket.accept()
        self.active_connections.append(websocket)
        logging.info(f"Client connected. Total connections: {len(self.active_connections)}")


    def disconnect(self, websocket: WebSocket):
        """Отключить WebSocket соединение"""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logging.info(f"WebSocket disconnected. Total connections: {len(self.active_connections)}")

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        """Отправить сообщение конкретному клиенту"""
        try:
            await websocket.send_text(json.dumps(message,default=float))
        except Exception as e:
            logging.error(f"Error sending message to client: {e}")
            self.disconnect(websocket)


    async def broadcast(self, message: dict):
        """Отправить сообщение всем подключенным клиентам"""
        disconnected = []
        
        for connection in self.active_connections:
            try:
                await connection.send_text(json.dumps(message,default=float))
            except Exception as e:
                logging.error(f"Error broadcasting to client: {e}")
                disconnected.append(connection)
        
        # Удаляем отключенные соединения
        for conn in disconnected:
            self.disconnect(conn)
        

    def get_connections_count(self) -> int:
        """Получить количество активных соединений"""
        return len(self.active_connections)
    
    async def broadcast_dashboard_updates(self, interval: int = 5):
        """
        Фоновая задача для периодической отправки обновлений дашборда
        
        Args:
            db: Экземпляр DataBaseManager для получения данных
            interval: Интервал обновления в секундах (по умолчанию 5)
        """
        await asyncio.sleep(2)  # Ждем инициализации приложения
        logging.info(f"Starting dashboard broadcast task (interval: {interval}s)")
        
        while True:
            try:
                if self.active_connections:
                    # Получаем актуальные данные из БД
                    current_data = db.get_current_state()
                    
                    message = {
                        "type": "dashboard_update",
                        "data": current_data,
                        "timestamp": datetime.now().isoformat()
                    }
                    
                    await self.broadcast(message)
                    logging.info(f"Broadcasted update to {len(self.active_connections)} clients")
                
                await asyncio.sleep(interval)
                
            except Exception as e:
                logging.error(f"Error in broadcast task: {e}")
                await asyncio.sleep(interval)


class WebSocketHandler:
    """Обработчик WebSocket соединений"""
    
    def __init__(self, manager: WebSocketConnectionManager):
        self.manager = manager

    async def handle_connection(self, websocket: WebSocket):
        """
        Обработать WebSocket соединение
        
        Args:
            websocket: WebSocket соединение
            db: Экземпляр DataBaseManager для получения начальных данных
        """
        await self.manager.connect(websocket)
        try:
            # Отправляем начальные данные сразу после подключения
            initial_data = db.get_current_state()
            await self.manager.send_personal_message(
                {
                    "type": "initial_data",
                    "data": initial_data,
                    "timestamp": datetime.now().isoformat()
                },
                websocket
            )
            # Обрабатываем входящие сообщения от клиента
            while True:
                try:
                    # Ждем сообщения с таймаутом 30 секунд
                    data = await asyncio.wait_for(
                        websocket.receive_text(),
                        timeout=30.0
                    )
                    # Обработка различных типов сообщений
                    await self._handle_message(data, websocket, db)
                    
                except asyncio.TimeoutError:
                    # Отправляем ping клиенту для проверки соединения
                    await self.manager.send_personal_message(
                        {"type": "ping"},
                        websocket
                    )
                    
        except WebSocketDisconnect:
            logging.info("Client disconnected normally")
            self.manager.disconnect(websocket)
            
        except Exception as e:
            logging.error(f"WebSocket error: {e}")
            self.manager.disconnect(websocket)

    async def _handle_message(self, data: str, websocket: WebSocket, db):
        """Обработать входящее сообщение от клиента"""
        try:
            if data == "ping":
                # Отвечаем на ping
                await self.manager.send_personal_message(
                    {"type": "pong"},
                    websocket
                )
            elif data == "pong":
                # Клиент ответил на наш ping
                pass
            elif data.startswith("{"):
                # JSON сообщение
                message = json.loads(data)
                await self._handle_json_message(message, websocket, db)
            else:
                logging.error(f"Unknown message format: {data}")
                
        except json.JSONDecodeError:
            logging.error(f"Invalid JSON received: {data}")
        except Exception as e:
            logging.error(f"Error handling message: {e}")

    async def _handle_json_message(self, message: dict, websocket: WebSocket, db):
        """Обработать JSON сообщение"""
        message_type = message.get("type")
        
        if message_type == "refresh":
            # Клиент запросил обновление данных
            current_data = db.get_current_state()
            print(current_data)
            await self.manager.send_personal_message(
                {
                    "type": "dashboard_update",
                    "data": current_data,
                    "timestamp": datetime.now().isoformat()
                },
                websocket
            )
        elif message_type == "subscribe":
            # Клиент подписался на обновления (уже подписан по умолчанию)
            await self.manager.send_personal_message(
                {"type": "subscribed", "status": "success"},
                websocket
            )
        else:
            logging.error(f"Unknown message type: {message_type}")


# Глобальные экземпляры
ws_manager = WebSocketConnectionManager()
ws_handler = WebSocketHandler(ws_manager)