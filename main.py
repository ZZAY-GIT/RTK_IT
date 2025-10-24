from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from datetime import datetime
import asyncio
import json

# Импорт менеджера из твоего websocket_manager.py
from api.websocket_manager import manager, send_robot_update, send_inventory_alert

app = FastAPI(title="WebSocket Test API")

# Фоновая задача для теста (без базы)
async def periodic_test_updates():
    while True:
        message = {
            "type": "robot_update",
            "data": {
                "robot_id": "R2D2",
                "battery_level": 90,
                "location": {"zone": "A", "row": 1, "shelf": 2},
                "status": "active",
                "last_update": datetime.now().isoformat() + "Z"
            },
            "timestamp": datetime.now().isoformat() + "Z"
        }
        await manager.broadcast(message)
        await asyncio.sleep(5)

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(periodic_test_updates())

# WebSocket эндпоинт
@app.websocket("/api/ws/dashboard")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                command = json.loads(data)
                if command.get("type") == "ping":
                    await manager.send_personal_message({"type": "pong"}, websocket)
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# Заглушки для остальных эндпоинтов (чтобы не падал import)
@app.get("/api/dashboard/current")
async def get_current_data():
    return {"status": "ok", "message": "Test dashboard endpoint"}

@app.get("/api/inventory/history")
async def get_history():
    return {"status": "ok", "message": "Test inventory endpoint"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
