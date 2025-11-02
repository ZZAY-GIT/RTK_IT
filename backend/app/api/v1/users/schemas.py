from pydantic import BaseModel, EmailStr
from typing import Optional


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    name: Optional[str] = None
    role: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    name: str
    role: str

    class Config:
        from_attributes = True
