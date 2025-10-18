from sqlalchemy import Column, Integer, String, DateTime, Date, DECIMAL, ForeignKey
from DB.Models.Base_model import BaseModel
from datetime import datetime
from sqlalchemy.orm import relationship


class AIPrediction(BaseModel):
    __tablename__ = 'ai_predictions'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(String(50), ForeignKey('products.id'))
    prediction_date = Column(Date, nullable=False)
    days_until_stockout = Column(Integer)
    recommended_order = Column(Integer)
    confidence_score = Column(DECIMAL(3, 2))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    product = relationship("Product", backref="ai_predictions")
    
    @classmethod
    def create_prediction(cls, session, product_id, prediction_date, 
                         days_until_stockout, recommended_order, confidence_score):
        """Создает прогноз ИИ"""
        return cls.create(
            session=session,
            product_id=product_id,
            prediction_date=prediction_date,
            days_until_stockout=days_until_stockout,
            recommended_order=recommended_order,
            confidence_score=confidence_score
        )
    
    @classmethod
    def get_by_product_and_date(cls, session, product_id, prediction_date):
        """Получает прогнозы по товару и дате"""
        return session.query(cls).filter_by(
            product_id=product_id, 
            prediction_date=prediction_date
        ).first()
    
    @classmethod
    def get_critical_predictions(cls, session, days_threshold=7):
        """Получает критические прогнозы (скоро закончится запас)"""
        return session.query(cls).filter(
            cls.days_until_stockout <= days_threshold
        ).all()
    
    def __repr__(self):
        return f"<AIPrediction(id={self.id}, product='{self.product_id}', days_until_stockout={self.days_until_stockout})>"