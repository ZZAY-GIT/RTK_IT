import uvicorn
from app.db.DataBaseManager import db
import asyncio

if __name__ == "__main__":
    # Закомментируем добавление пользователя в production
    # asyncio.run(db.add_user("ampleenkov.do@gmail.com", "123123123", "Daniil", "operator"))
    
    uvicorn.run(
        "backend.app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=False,  # False для production
        log_level="info"
    )