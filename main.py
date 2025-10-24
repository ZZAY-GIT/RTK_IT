from DB.DataBaseManager import db, verify_password
from api.api import app
import json

# 1. Добавить пользователя (хеширование происходит внутри add_user)
#db.add_user("ampleenkov.do@gmail.com", "123123123", "Daniil", "operator")

## 2. Проверить пароль через БД
#password = db.get_user_password("ampleenkov.do@gmail.com")
#print(password)
#print(type(password))
#if verify_password("123123123", password):
#    print("Authentication successful!")
#else:
#    print("Authentication failed!")
#
#if __name__ == "__main__":
#    import uvicorn
#    uvicorn.run(app, host="0.0.0.0", port=8000)
with open("C:\\RTK_IT\\api\\invent.json", "r", encoding="utf-8") as file:
    data = json.load(file)
    db.add_robot_data(data)
    print(db.get_last_day_inventory_history())
