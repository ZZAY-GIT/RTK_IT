from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Dict, Any, Literal

class RobotDataCreate(BaseModel):
    robot_id: str
    timestamp: datetime
    location: Dict[str, Any]
    scan_results: Dict[str, Any]
    battery_level: float

class RobotDataResponse(BaseModel):
    status: str
    message_id: str

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