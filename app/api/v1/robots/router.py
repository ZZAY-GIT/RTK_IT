from fastapi import APIRouter, HTTPException
from app.db.DataBaseManager import db


router = APIRouter()

@router.post("/data")
async def add_robot_data(data: dict):
    try:
        state = await db.add_robot_data(data)
        return state 
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
