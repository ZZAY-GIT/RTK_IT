from db.DataBaseManager import db, verify_password
from db.test_data import generate_test_data
import io
import pandas as pd
from api.api import app
from random import choice

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)