# app/api/v1/auth/router.py
from fastapi import APIRouter
from app.api.v1.schemas import LoginRequest
from app.core.auth.service import auth_service

router = APIRouter()

@router.post("/login")
async def login(
    form_data: LoginRequest,
):
    return await auth_service.login(form_data.email, form_data.password)