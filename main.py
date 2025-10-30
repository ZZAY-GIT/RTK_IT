from db.DataBaseManager import db
from api.api import app


# 1. Добавить пользователя (хеширование происходит внутри add_user)
db.add_user("ampleenkov.do@gmail.com", "123123123", "Daniil", "operator")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
