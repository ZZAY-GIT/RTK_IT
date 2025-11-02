# app/db/models/product.py
from sqlalchemy import Column, Integer, String
from app.db.base import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(String(50), primary_key=True)
    name = Column(String(255), nullable=False)
    category = Column(String(100))
    min_stock = Column(Integer, default=10)
    optimal_stock = Column(Integer, default=100)
