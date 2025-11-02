# app/db/models/robot.py
from sqlalchemy import Column, Integer, String, DateTime
from app.db.base import Base

class Robot(Base):
    __tablename__ = 'robots'
    
    id = Column(String(50), primary_key=True)
    status = Column(String(50), default='active')
    battery_level = Column(Integer)
    last_update = Column(DateTime(timezone=True))
    current_zone = Column(String(10))
    current_row = Column(Integer)
    current_shelf = Column(Integer)