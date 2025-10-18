from sqlalchemy import create_engine, MetaData, Table, Column, Integer, String, DateTime, DECIMAL
from sqlalchemy.orm import sessionmaker
from datetime import datetime

# Подключение к базе данных
DATABASE_URL = "postgresql://warehouse_user:secure_password@localhost:5432/warehouse_db"

# Создаем движок
engine = create_engine(DATABASE_URL)

# Создаем сессию
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Получаем метаданные
metadata = MetaData()

# Пример использования
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Простой тест подключения
try:
    with engine.connect() as conn:
        print("Успешное подключение к базе данных!")
except Exception as e:
    print(f"Ошибка подключения: {e}")