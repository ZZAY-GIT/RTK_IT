from fastapi import FastAPI, Depends, HTTPException
from typing import List

# from DB.DataBaseManager import DataBaseManager
# from settings import settings

# db = DataBaseManager(settings.CONN_STR)

app = FastAPI(title="Simple FastAPI Service", version="1.0.0")
@app.get("/test")
def read_user(user_id: int | None = None):
    """Получить пользователя по ID"""
    state = {"robots": [123, 332, 12], "recent_scans": [543], "statistics": {123: {"battary": 98, "coords": (123, 322)}}}
    return state

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
