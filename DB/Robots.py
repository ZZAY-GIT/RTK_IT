from sqlalchemy import Column, Integer, String, DateTime, Date, DECIMAL, ForeignKey
from DB.Models.Base_model import BaseModel
from datetime import datetime


class Robot(BaseModel):
    __tablename__ = 'robots'
    
    id = Column(String(50), primary_key=True)
    status = Column(String(50), default='active')
    battery_level = Column(Integer)
    last_update = Column(DateTime)
    current_zone = Column(String(10))
    current_row = Column(Integer)
    current_shelf = Column(Integer)
    
    @classmethod
    def create_robot(cls, session, robot_id, status='active', battery_level=None, 
                    current_zone=None, current_row=None, current_shelf=None):
        """Создает нового робота"""
        return cls.create(
            session=session,
            id=robot_id,
            status=status,
            battery_level=battery_level,
            last_update=datetime.utcnow(),
            current_zone=current_zone,
            current_row=current_row,
            current_shelf=current_shelf
        )
    
    def update_battery(self, session, battery_level):
        """Обновляет уровень заряда батареи"""
        self.battery_level = battery_level
        self.last_update = datetime.utcnow()
        session.commit()
    
    def update_location(self, session, zone, row, shelf):
        """Обновляет местоположение робота"""
        self.current_zone = zone
        self.current_row = row
        self.current_shelf = shelf
        self.last_update = datetime.utcnow()
        session.commit()
    
    @classmethod
    def get_low_battery(cls, session, threshold=20):
        """Получает роботов с низким зарядом батареи"""
        return session.query(cls).filter(cls.battery_level < threshold).all()
    
    def __repr__(self):
        return f"<Robot(id='{self.id}', status='{self.status}', battery={self.battery_level}%)>"