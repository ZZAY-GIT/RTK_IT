# app/api/v1/admin/robots/router.py

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Body, Query
from typing import List, Dict, Any, Annotated, Optional
from datetime import datetime
from app.api.v1.schemas import RobotCreate, RobotUpdate, RobotResponse
from app.dependencies import access_level, CurrentUser
from app.db.DataBaseManager import db as async_db
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/", response_model=RobotResponse, status_code=status.HTTP_201_CREATED)
async def create_robot(robot: RobotCreate, _: Annotated[CurrentUser, Depends(access_level)]):
    """Создать нового робота."""
    logger.info(f"Creating robot with ID: {robot.id}")
    robot_id = await async_db.add_robot(
        id=robot.id, status=robot.status, battery_level=robot.battery_level,
        current_zone=robot.current_zone, current_row=robot.current_row, current_shelf=robot.current_shelf
    )
    if not robot_id:
        logger.warning(f"Failed to create robot with ID: {robot.id}")
        raise HTTPException(status_code=400, detail="Failed to create robot")
    
    created_robot = await async_db.get_robot(robot_id)
    return RobotResponse.model_validate(created_robot)

@router.get("/", response_model=List[RobotResponse])
async def get_all_robots(_: Annotated[CurrentUser, Depends(access_level)]):
    """Получить список всех роботов."""
    logger.info("Fetching all robots.")
    robots = await async_db.get_all_robots()
    logger.info(f"Found {len(robots)} robots.")
    return robots

@router.get("/{robot_id}", response_model=RobotResponse)
async def get_robot(robot_id: str, _: Annotated[CurrentUser, Depends(access_level)]):
    """Получить робота по ID."""
    logger.info(f"Fetching robot with ID: {robot_id}")
    robot = await async_db.get_robot(robot_id)
    if not robot:
        logger.warning(f"Robot with ID {robot_id} not found.")
        raise HTTPException(status_code=404, detail="Robot not found")
    # ИСПРАВЛЕНО: Заменяем from_attributes на model_validate
    return RobotResponse.model_validate(robot)

@router.put("/{robot_id}", response_model=RobotResponse)
async def update_robot(robot_id: str, robot_update: RobotUpdate, _: Annotated[CurrentUser, Depends(access_level)]):
    """Обновить данные робота."""
    logger.info(f"Updating robot with ID: {robot_id}")
    update_data = robot_update.model_dump(exclude_unset=True)
    robot = await async_db.update_robot(robot_id, **update_data)
    if not robot:
        logger.warning(f"Failed to update robot with ID {robot_id}. Robot not found.")
        raise HTTPException(status_code=404, detail="Robot not found")
    # ИСПРАВЛЕНО: Заменяем from_attributes на model_validate
    return RobotResponse.model_validate(robot)

@router.delete("/{robot_id}")
async def delete_robot(robot_id: str, _: Annotated[CurrentUser, Depends(access_level)]):
    """Удалить робота."""
    logger.info(f"Deleting robot with ID: {robot_id}")
    success = await async_db.delete_robot(robot_id)
    if not success:
        logger.warning(f"Failed to delete robot with ID {robot_id}. Robot not found.")
        raise HTTPException(status_code=404, detail="Robot not found")
    logger.info(f"Successfully deleted robot with ID: {robot_id}")
    return {"status": "success", "message": "Robot deleted successfully"}

@router.post("/inventory/import")
async def import_inventory_csv(
    _: Annotated[CurrentUser, Depends(access_level)], 
    file: UploadFile = File(...)
):
    """Импорт инвентарных данных из CSV файла."""
    if not file.filename.lower().endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed")
    
    try:
        logger.info(f"Importing inventory from file: {file.filename}")
        contents = await file.read()
        csv_content = contents.decode('utf-8')
        result = await async_db.process_csv_inventory_import(csv_content)
        
        if result["status"] == "error":
            logger.error(f"CSV import failed: {result['error']}")
            raise HTTPException(status_code=400, detail=result["error"])
        
        logger.info(f"CSV import successful: {result.get('message', 'No message')}")
        return result
    except Exception as e:
        logger.error(f"File processing error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error during file processing")

@router.get("/inventory/history")
async def get_inventory_history(
    _: Annotated[CurrentUser, Depends(access_level)],
    from_date: Optional[str] = Query(None), 
    to_date: Optional[str] = Query(None), 
    zone: Optional[str] = Query(None), 
    status: Optional[str] = Query(None)
):
    """Получить отфильтрованную историю инвентаризации."""
    logger.info(f"Fetching inventory history with filters: from_date={from_date}, to_date={to_date}, zone={zone}, status={status}")
    try:
        from_dt = datetime.fromisoformat(from_date) if from_date else None
        to_dt = datetime.fromisoformat(to_date) if to_date else None
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use ISO format (YYYY-MM-DD).")
    
    items = await async_db.get_filter_inventory_history(
        from_date=from_dt, to_date=to_dt, zone=zone, status=status
    )
    
    logger.info(f"Found {len(items)} items in inventory history.")
    return {
        "total": len(items),
        "items": items,
        "pagination": {}
    }