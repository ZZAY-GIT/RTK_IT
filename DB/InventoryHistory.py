from sqlalchemy import Column, Integer, String, DateTime, Date, DECIMAL, ForeignKey
from DB.Models.Base_model import BaseModel
from datetime import datetime
from sqlalchemy.orm import relationship


class InventoryHistory(BaseModel):
    __tablename__ = 'inventory_history'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    robot_id = Column(String(50), ForeignKey('robots.id'))
    product_id = Column(String(50), ForeignKey('products.id'))
    quantity = Column(Integer, nullable=False)
    zone = Column(String(10), nullable=False)
    row_number = Column(Integer)
    shelf_number = Column(Integer)
    status = Column(String(50))
    scanned_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    robot = relationship("Robot", backref="inventory_scans")
    product = relationship("Product", backref="inventory_history")
    
    @classmethod
    def create_inventory_record(cls, session, robot_id, product_id, quantity, 
                               zone, row_number=None, shelf_number=None, status=None):
        """Создает запись инвентаризации"""
        return cls.create(
            session=session,
            robot_id=robot_id,
            product_id=product_id,
            quantity=quantity,
            zone=zone,
            row_number=row_number,
            shelf_number=shelf_number,
            status=status,
            scanned_at=datetime.utcnow()
        )
    
    @classmethod
    def get_by_product(cls, session, product_id):
        """Получает записи инвентаризации по товару"""
        return session.query(cls).filter_by(product_id=product_id).all()
    
    @classmethod
    def get_by_robot(cls, session, robot_id):
        """Получает записи инвентаризации по роботу"""
        return session.query(cls).filter_by(robot_id=robot_id).all()
    
    @classmethod
    def get_low_stock_records(cls, session):
        """Получает записи с низким запасом"""
        return session.query(cls).filter(cls.status.in_(['LOW_STOCK', 'CRITICAL'])).all()
    
    def __repr__(self):
        return f"<InventoryHistory(id={self.id}, product='{self.product_id}', quantity={self.quantity})>"