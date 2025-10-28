# schemas.py
from pydantic import BaseModel
from typing import List, Dict, Optional

class UserCreate(BaseModel):
    email: str
    password: str
    name: str
    role: str

class UserUpdate(BaseModel):
    email: Optional[str] = None
    password: Optional[str] = None
    name: Optional[str] = None
    role: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    role: str
    
    class Config:
        from_attributes = True

class ProductCreate(BaseModel):
    name: str
    category: Optional[str] = ""
    min_stock: Optional[int] = 0
    optimal_stock: Optional[int] = 0

class ProductResponse(ProductCreate):
    id: str  # ID теперь генерируется на сервере
    
    class Config:
        from_attributes = True

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

from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class RobotCreate(BaseModel):
    status: str
    battery_level: int
    current_zone: Optional[str] = ""
    current_row: Optional[int] = 0
    current_shelf: Optional[int] = 0

class RobotResponse(RobotCreate):
    id: str
    last_update: str
    
    class Config:
        from_attributes = True

class RobotUpdate(BaseModel):
    status: Optional[str] = None
    battery_level: Optional[int] = None
    current_zone: Optional[str] = None
    current_row: Optional[int] = None
    current_shelf: Optional[int] = None

class Location(BaseModel):
    zone: str
    row: int
    shelf: int

class ScanResult(BaseModel):
    product_id: str
    product_name: str
    quantity: int
    status: str

class RobotData(BaseModel):
    robot_id: str
    timestamp: str
    location: Location
    scan_results: List[ScanResult]
    battery_level: float
    next_checkpoint: str

class PredictRequest(BaseModel):
    period_days: int
    categories: List[Dict]

class PredictResponse(BaseModel):
    predictions: List[Dict]
    confidence: float

class LoginRequest(BaseModel):
    email: str
    password: str