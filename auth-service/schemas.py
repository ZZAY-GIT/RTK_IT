from pydantic import BaseModel, EmailStr
from typing import Literal

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    token: str
    user: dict

class UserOut(BaseModel):
    id: int
    email: EmailStr
    name: str
    role: Literal["operator", "admin", "viewer"]