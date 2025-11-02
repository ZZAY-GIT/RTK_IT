from fastapi import APIRouter, Depends, HTTPException, status
import logging
from typing import Annotated  # <-- 1. Добавьте этот импорт
from app.api.v1.users import schemas
from app.dependencies import operator_required, CurrentUser
from app.db.DataBaseManager import db

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/", response_model=schemas.UserResponse)
async def create_user(
    user_in: schemas.UserCreate,
    # 2. ИЗМЕНИТЕ ЭТУ СТРОКУ
    current_user: Annotated[CurrentUser, Depends(operator_required)],
):
    logger.info(f"User {current_user.id} creating new user: {user_in.email}")

    user = await db.add_user(
        email=user_in.email,
        password=user_in.password,
        name=user_in.name,
        role=user_in.role,
    )

    if not user:
        raise HTTPException(status_code=400, detail="Email already exists")
    return user


@router.get("/", response_model=list[schemas.UserResponse])
async def get_users(
    # 2. И И ЭТУ СТРОКУ
    current_user: Annotated[CurrentUser, Depends(operator_required)],
):
    logger.info(f"User {current_user.id} requested all users")

    users = await db.get_all_users()
    return users
