from sqlalchemy import Column, Integer, String, DateTime, Date, DECIMAL, ForeignKey, LargeBinary
from sqlalchemy.orm import relationship, declarative_base
from datetime import datetime


Base = declarative_base()

class User(Base):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(LargeBinary, nullable=False)
    name = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Robot(Base):
    __tablename__ = 'robots'
    
    id = Column(String(50), primary_key=True)
    status = Column(String(50), default='active')
    battery_level = Column(Integer)
    last_update = Column(DateTime)
    current_zone = Column(String(10))
    current_row = Column(Integer)
    current_shelf = Column(Integer)


class Product(Base):
    __tablename__ = 'products'
    
    id = Column(String(50), primary_key=True)
    name = Column(String(255), nullable=False)
    category = Column(String(100))
    min_stock = Column(Integer, default=10)
    optimal_stock = Column(Integer, default=100)


class InventoryHistory(Base):
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


class AIPrediction(Base):
    __tablename__ = 'ai_predictions'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(String(50), ForeignKey('products.id'))
    prediction_date = Column(Date, nullable=False)
    days_until_stockout = Column(Integer)
    recommended_order = Column(Integer)
    confidence_score = Column(DECIMAL(3, 2))
    created_at = Column(DateTime, default=datetime.utcnow)
    product = relationship("Product", backref="ai_predictions")