from sqlalchemy import Column, ForeignKey, Integer, String, Date, DECIMAL, DateTime
from datetime import datetime 
from app.db.base import Base

class AIPrediction(Base):
    __tablename__ = 'ai_predictions'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(String(50), ForeignKey('products.id'))
    prediction_date = Column(Date, nullable=False)
    days_until_stockout = Column(Integer)
    recommended_order = Column(Integer)
    confidence_score = Column(DECIMAL(3, 2))
    created_at = Column(DateTime, default=datetime.utcnow)