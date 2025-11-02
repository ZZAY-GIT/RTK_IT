from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime # <-- Добавьте этот импорт

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

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

class ProductCreate(BaseModel):
    id: Optional[str] = None
    name: str
    category: str
    min_stock: int
    optimal_stock: int

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    min_stock: Optional[int] = None
    optimal_stock: Optional[int] = None

class ProductResponse(BaseModel):
    id: str
    name: str
    category: str
    min_stock: int
    optimal_stock: int

    class Config:
        from_attributes = True

class RobotCreate(BaseModel):
    id: Optional[str] = None
    status: str
    battery_level: int
    current_zone: str
    current_row: int
    current_shelf: int

class RobotUpdate(BaseModel):
    status: Optional[str] = None
    battery_level: Optional[int] = None
    current_zone: Optional[str] = None
    current_row: Optional[int] = None
    current_shelf: Optional[int] = None

class RobotResponse(BaseModel):
    id: str
    status: str
    battery_level: int
    current_zone: str
    current_row: int
    current_shelf: int
    last_update: datetime

    class Config:
        from_attributes = True

class PredictRequest(BaseModel):
    period_days: int
    categories: List[str]

class PredictResponse(BaseModel):
    predictions: List[Dict[str, Any]]
    confidence: float