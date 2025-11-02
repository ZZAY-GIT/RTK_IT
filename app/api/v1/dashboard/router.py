# app/api/v1/dashboard/router.py
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from app.api.v1.dashboard.websocket_manager import ws_handler, ws_manager
from app.db.DataBaseManager import db as async_db
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/current")
async def get_current_dashboard_state():
    """Получить текущее состояние дашборда."""
    try:
        state = await async_db.get_current_state()
        return state
    except Exception as e:
        logger.error(f"Error fetching current dashboard state: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch dashboard data")

@router.get("/activity_history")
async def get_activity_history():
    """Получить историю активности роботов за последний час."""
    try:
        history = await async_db.get_activity_history()
        return {"activityHistory": history}
    except Exception as e:
        logger.error(f"Error fetching activity history: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch activity history")


@router.websocket("/ws/")
async def websocket_dashboard(websocket: WebSocket):
    await ws_handler.handle_connection(websocket)

@router.get("/ws/status")
async def websocket_status():
    """Получить статус WebSocket соединений."""
    return {
        "active_connections": ws_manager.get_connections_count(),
        "status": "operational"
    }