from sqlalchemy import Column, Integer, String, DateTime, Date, DECIMAL, ForeignKey
from DB.Models.Base_model import BaseModel
from datetime import datetime


class Product(BaseModel):
    __tablename__ = 'products'
    
    id = Column(String(50), primary_key=True)
    name = Column(String(255), nullable=False)
    category = Column(String(100))
    min_stock = Column(Integer, default=10)
    optimal_stock = Column(Integer, default=100)
    
    @classmethod
    def create_product(cls, session, product_id, name, category=None, 
                      min_stock=10, optimal_stock=100):
        """Создает новый товар"""
        return cls.create(
            session=session,
            id=product_id,
            name=name,
            category=category,
            min_stock=min_stock,
            optimal_stock=optimal_stock
        )
    
    @classmethod
    def get_by_category(cls, session, category):
        """Получает товары по категории"""
        return session.query(cls).filter_by(category=category).all()
    
    def __repr__(self):
        return f"<Product(id='{self.id}', name='{self.name}', category='{self.category}')>"