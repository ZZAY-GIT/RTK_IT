# app/api/v1/dashboard/router.py

from fastapi import APIRouter, WebSocket, HTTPException, Query
from typing import List, Optional
from datetime import datetime
from app.api.v1.dashboard.websocket_manager import ws_handler
from app.db.DataBaseManager import db as async_db
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/history") # Путь будет /api/dashboard/history
async def get_inventory_history(
    # Явно объявляем каждый параметр с помощью Query
    from_date: Optional[str] = Query(None, description="Начальная дата в формате YYYY-MM-DD"),
    to_date: Optional[str] = Query(None, description="Конечная дата в формате YYYY-MM-DD"),
    zone: Optional[str] = Query(None, description="Фильтр по зоне"),
    status: Optional[str] = Query(None, description="Фильтр по статусу")
):
    """
    Получить отфильтрованную историю инвентаризации.
    """
    try:
        # Конвертируем строки в datetime, если они были переданы
        from_dt = None
        to_dt = None
        if from_date:
            try:
                from_dt = datetime.fromisoformat(from_date)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid 'from_date' format. Use YYYY-MM-DD.")
        
        if to_date:
            try:
                to_dt = datetime.fromisoformat(to_date)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid 'to_date' format. Use YYYY-MM-DD.")

        logger.info(f"Fetching inventory history with filters: from_date={from_dt}, to_date={to_dt}, zone={zone}, status={status}")
        
        # Вызываем асинхронный метод из DataBaseManager
        items = await async_db.get_filter_inventory_history(
            from_date=from_dt, 
            to_date=to_dt, 
            zone=zone, 
            status=status
        )
        
        logger.info(f"Found {len(items)} records in inventory history.")
        
        # Возвращаем ответ в том же формате, что и в вашем примере
        return {
            "total": len(items),
            "items": items,
            "pagination": {}  # пустой объект, как в требовании
        }
        
    except HTTPException:
        # Пробрасываем HTTPException дальше, чтобы клиент получил правильный статус и сообщение
        raise
    except Exception as e:
        logger.error(f"Error fetching inventory history: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")