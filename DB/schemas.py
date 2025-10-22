from pydantic import BaseModel
from datetime import datetime
from typing import Dict, Any

class RobotDataCreate(BaseModel):
    robot_id: str
    timestamp: datetime
    location: Dict[str, Any]
    scan_results: Dict[str, Any]
    battery_level: float

class RobotDataResponse(BaseModel):
    status: str
    message_id: str