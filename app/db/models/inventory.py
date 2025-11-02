from sqlalchemy import Column, Integer, DateTime, ForeignKey, String, func
from sqlalchemy.orm import relationship
from app.db.base import Base

class InventoryHistory(Base):
    __tablename__ = 'inventory_history'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    robot_id = Column(String(50), ForeignKey('robots.id'))
    product_id = Column(String(50), ForeignKey('products.id'), nullable=True)
    quantity = Column(Integer, nullable=False)
    zone = Column(String(10), nullable=False)
    row_number = Column(Integer)
    shelf_number = Column(Integer, nullable=True)
    status = Column(String(50))
    scanned_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    product = relationship("Product", backref="inventory_history")

    def convert_json(self):
        data = {
            'robot_id': self.robot_id,
            'product_id': self.product_id,
            'quantity': self.quantity,
            'zone': self.zone,
            'status': self.status,
            'scanned_at': self.scanned_at.isoformat() if self.scanned_at else None
        }
        return data
    robot = relationship("Robot", backref="inventory_history")
