import uvicorn
from app.db.DataBaseManager import db
import asyncio
if __name__ == "__main__":
    asyncio.run(db.add_user("ampleenkov.do@gmail.com", "123123123", "Daniil", "operator"))
    
    uvicorn.run(
        "app.main:app",      # модуль:приложение
        host="0.0.0.0",
        port=8000,
        reload=True,         # авто‑перезапуск в dev
        log_level="info"
    )