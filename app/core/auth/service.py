# app/api/v1/auth/service.py
from fastapi import HTTPException, status
import jwt
from datetime import datetime, timedelta
from app.core.settings import settings
from app.db.DataBaseManager import db
from app.core.security import verify_password
from app.api.v1.schemas import UserResponse
from sqlalchemy.ext.asyncio import AsyncSession
import logging

logger = logging.getLogger(__name__)

class AuthService:
    def __init__(self):
        self.JWT_SECRET = settings.JWT_SECRET
        self.ALGORITHM = "HS256"
        self.TOKEN_EXPIRE_MINUTES = 1440

    def create_jwt_token(self, data: dict) -> str:
        expire = datetime.utcnow() + timedelta(minutes=self.TOKEN_EXPIRE_MINUTES)
        to_encode = {**data, "exp": expire}
        return jwt.encode(to_encode, self.JWT_SECRET, algorithm=self.ALGORITHM)

    async def login(self, email: str, password: str) -> dict:
        user = await db.get_user(email)
        if not user or not verify_password(password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
                headers={"WWW-Authenticate": "Bearer"}
            )

        token = self.create_jwt_token({
            "sub": str(user.id),
            "email": user.email,
            "name": user.name,
            "role": user.role
        })

        return {
            "token": token,
            "user": UserResponse.from_orm(user).dict()
        }

auth_service = AuthService()