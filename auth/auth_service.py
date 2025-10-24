from fastapi import HTTPException, status
import jwt
from datetime import datetime, timedelta
from settings import settings
from DB.DataBaseManager import db, verify_password

class AuthService:
    def __init__(self):
        self.JWT_SECRET = settings.JWT_SECRET
        self.ALGORITHM = "HS256"
        self.TOKEN_EXPIRE_MINUTES = 1440

    def get_user_password(self, email: str) -> str | None:
        return db.get_user_password(email)

    def create_jwt_token(self, data: dict) -> str:
        expire = datetime.utcnow() + timedelta(minutes=self.TOKEN_EXPIRE_MINUTES)
        to_encode = {**data, "exp": expire}
        return jwt.encode(to_encode, self.JWT_SECRET, algorithm=self.ALGORITHM)

    def login(self, email: str, password: str) -> dict:
        # 1. Get hashed password
        hashed = self.get_user_password(email)
        if not hashed or not verify_password(password, hashed):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid email or passord {hashed}",
                headers={"WWW-Authenticate": "Bearer"}
            )

        # 2. Get user
        user = db.get_user(email)
        
        # 3. Create JWT
        token = self.create_jwt_token({
            "sub": str(user.id),
            "email": user.email,
            "name": user.name,
            "role": user.role
        })

        user_response = {
            "token": token,
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "role": user.role
            }
        }
        
        return user_response
    

auth_service = AuthService()
