# app/dependencies.py
from fastapi import Depends, HTTPException, status, Header
from typing import Annotated
import json
from app.api.v1.schemas import UserResponse
import logging

logger = logging.getLogger(__name__)

def get_current_user_from_client(
    x_user_data: Annotated[str, Header(alias="X-User-Data")]
):
    try:
        first_parse = json.loads(x_user_data)
        if isinstance(first_parse, str):
            user_dict = json.loads(first_parse)
        else:
            user_dict = first_parse
        return UserResponse(**user_dict)
    except (json.JSONDecodeError, KeyError) as e:
        logger.error(f"Invalid X-User-Data: {e}")
        raise HTTPException(status_code=400, detail="Invalid user data in header")

CurrentUser = Annotated[UserResponse, Depends(get_current_user_from_client)]

def access_level(user: CurrentUser):
    if user.role not in ["operator", "admin"]:
        raise HTTPException(status_code=403, detail="Operator or admin access required")
    return user

def operator_required(user: CurrentUser):
    if user.role != "operator":
        raise HTTPException(status_code=403, detail="Operator access required")
    return user

def admin_required(current_user: UserResponse = Depends(get_current_user_from_client)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user