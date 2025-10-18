from sqlalchemy import Column, Integer, String, DateTime, Date, DECIMAL, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker

Base = declarative_base()

class BaseModel(Base):
    __abstract__ = True
    
    @classmethod
    def create(cls, session, **kwargs):
        """Создает новый объект и сохраняет в БД"""
        obj = cls(**kwargs)
        session.add(obj)
        session.commit()
        return obj
    
    def delete(self, session):
        """Удаляет объект из БД"""
        session.delete(self)
        session.commit()
    
    @classmethod
    def get(cls, session, id):
        """Получает объект по ID"""
        return session.query(cls).get(id)
    
    @classmethod
    def get_all(cls, session):
        """Получает все объекты"""
        return session.query(cls).all()