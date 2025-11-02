# app/api/v1/admin/users/router.py

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Annotated
from app.api.v1.schemas import UserCreate, UserUpdate, UserResponse
from app.dependencies import operator_required, CurrentUser
from app.db.DataBaseManager import db as async_db
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(user_in: UserCreate, _: Annotated[CurrentUser, Depends(operator_required)]):
    """Создать нового пользователя."""
    logger.info(f"Attempting to create user with email: {user_in.email}")
    user = await async_db.add_user(user_in.email, user_in.password, user_in.name, user_in.role)
    if not user:
        logger.warning(f"Failed to create user. Email {user_in.email} might already exist.")
        raise HTTPException(status_code=400, detail="User with this email already exists")
    logger.info(f"Successfully created user with ID: {user.id}")
    return user

@router.get("/", response_model=List[UserResponse])
async def get_all_users(_: Annotated[CurrentUser, Depends(operator_required)]):
    """Получить список всех пользователей."""
    logger.info("Fetching all users.")
    users = await async_db.get_all_users()
    logger.info(f"Found {len(users)} users.")
    return users

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: int, _: Annotated[CurrentUser, Depends(operator_required)]):
    """Получить пользователя по ID."""
    logger.info(f"Fetching user with ID: {user_id}")
    user = await async_db.get_user_by_id(user_id)
    if not user:
        logger.warning(f"User with ID {user_id} not found.")
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int, 
    user_update: UserUpdate, 
    current_user: Annotated[CurrentUser, Depends(operator_required)]
):
    """Обновить данные пользователя."""
    if user_id == current_user.id:
        logger.warning(f"User {current_user.id} attempted to modify their own account.")
        raise HTTPException(status_code=400, detail="You cannot modify your own user account")
    
    logger.info(f"Updating user with ID: {user_id}")
    update_data = user_update.model_dump(exclude_unset=True)
    user = await async_db.update_user(user_id, **update_data)
    if not user:
        logger.warning(f"Failed to update user with ID {user_id}. User not found.")
        raise HTTPException(status_code=404, detail="User not found")
    logger.info(f"Successfully updated user with ID: {user_id}")
    return user

@router.delete("/{user_id}")
async def delete_user(user_id: int, current_user: Annotated[CurrentUser, Depends(operator_required)]):
    """Удалить пользователя."""
    if user_id == current_user.id:
        logger.warning(f"User {current_user.id} attempted to delete their own account.")
        raise HTTPException(status_code=400, detail="You cannot delete your own user account")
    
    logger.info(f"Deleting user with ID: {user_id}")
    success = await async_db.delete_user(user_id)
    if not success:
        logger.warning(f"Failed to delete user with ID {user_id}. User not found.")
        raise HTTPException(status_code=404, detail="User not found")
    logger.info(f"Successfully deleted user with ID: {user_id}")
    return {"status": "success", "message": "User deleted successfully"}