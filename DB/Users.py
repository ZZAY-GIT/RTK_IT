import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


from sqlalchemy import Column, Integer, String, DateTime, Date, DECIMAL, ForeignKey
from Base_model import BaseModel
from datetime import datetime
from Connection import SessionLocal

db = SessionLocal()

class User(BaseModel):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    #работает
    @classmethod
    def create(cls, email, password_hash, name, role="User"):
        db = SessionLocal()
        if not User.user_exists(email):
            new_user = User(
                name=name,
                email=email,
                password_hash=password_hash,
                role=role
        )
            db.add(new_user)
            db.commit()
            db.refresh(new_user)

            print("Пользователь успешно добавлен")
        else:
            print("Пользователь с таким email уже существует") 
    
    # Проверяет занят ли email, True если занят
    @classmethod
    def user_exists(cls, email: str) -> bool:
        """
        Проверяет, существует ли пользователь с указанным email.
        Возвращает True, если найден, иначе False.
        """
        db = SessionLocal()
        try:
            user = db.query(cls).filter(cls.email == email).first()
            return user is not None
        except Exception as e:
            print(f"Ошибка при проверке пользователя: {e}")
            return False
        finally:
            db.close()
    
    @classmethod
    def user_exists(cls, email: str) -> bool:
        """
        Проверяет, существует ли пользователь с указанным email.
        Возвращает True, если найден, иначе False.
        """
        db = SessionLocal()
        try:
            user = db.query(cls).filter(cls.email == email).first()
            return user is not None
        except Exception as e:
            print(f"Ошибка при проверке пользователя: {e}")
            return False
        finally:
            db.close()
    
    @classmethod
    def delete(cls, email: str):
        db = SessionLocal()
        try:
            user = db.query(cls).filter(cls.email == email).first()
            if user:
                db.delete(user)
                db.commit()
                return True
            return False
        except Exception as e:
            db.rollback()
            print(f"Ошибка при удалении пользователя: {e}")
            return False
        finally:
            db.close()

    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}', role='{self.role}')>"