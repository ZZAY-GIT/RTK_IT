import logging
from datetime import datetime
from db.DataBaseManager import db, verify_password
from db.test_data import generate_test_data, generate_inventory_history_data
from ai.yandex_gpt_client import yandex_client
import io
#import pandas as pd
from api.api import app

from random import choice

# 1. Добавить пользователя (хеширование происходит внутри add_user)
db.add_user("ampleenkov.do@gmail.com", "123123123", "Daniil", "operator")
#users = db.get_all_users()
#print(users)

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
# with open("C:\\RTK_IT\\api\\invent.json", "r", encoding="utf-8") as file:
#     data = json.load(file)
#     db.add_robot_data(data)
#     print(db.get_last_day_inventory_history())


# # 2. Проверить пароль через БД
# password = db.get_user_password("ampleenkov.do@gmail.com")
# print(password)
# print(type(password))
# if verify_password("123123123", password):
#     print("Authentication successful!")
# else:
#     print("Authentication failed!")

# from auth.auth_service import AuthService
    
# if __name__ == "__main__":
#     db.add_user("ampleenkov.do@gmail.com", "123123123", "Daniil", "operator")
#     auth = AuthService()
#     s = auth.login("ampleenkov.do@gmail.com", "123123123")
#     print(s)

# from AI.yandex_gpt_client import YandexGPTClient
# import json
# with open("AI/historicalData.json", "r", encoding="utf-8") as f:
#     his = json.load(f)
# with open("AI/inventoryData.json", "r", encoding="utf-8") as f:
#     inv = json.load(f)
# s = YandexGPTClient()
# result = s.send_to_api(inv, his)
# print(result)

if __name__ == "__main__":
    # generate_test_data()
    # generate_test_data()
    # generate_test_data()
    # generate_test_data()
    # generate_test_data()
    # generate_test_data()
    # generate_inventory_history_data(100)
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
    # print("123")
    # logging.info("321")
# a = [{"product_id": "TEL-4567", "days_until_stockout": 9, "recommended_order": 100}, {"product_id": "TEL-8901", "days_until_stockout": 4, "recommended_order": 50}]
# db.add_ai_prediction(a)
# a = {
#     "historicalData": [
#     {
#       "date": "2024-03-01",
#       "product_id": "TEL-4567",
#       "quantity": 100
#     },
#     {
#       "date": "2024-03-02",
#       "product_id": "TEL-4567",
#       "quantity": 95
#     },
#     {
#       "date": "2024-03-03",
#       "product_id": "TEL-4567",
#       "quantity": 90
#     },
#     {
#       "date": "2024-03-04",
#       "product_id": "TEL-4567",
#       "quantity": 85
#     },
#     {
#       "date": "2024-03-05",
#       "product_id": "TEL-4567",
#       "quantity": 80
#     },
#     {
#       "date": "2024-03-06",
#       "product_id": "TEL-4567",
#       "quantity": 75
#     },
#     {
#       "date": "2024-03-07",
#       "product_id": "TEL-4567",
#       "quantity": 70
#     },
#     {
#       "date": "2024-03-08",
#       "product_id": "TEL-4567",
#       "quantity": 65
#     },
#     {
#       "date": "2024-03-09",
#       "product_id": "TEL-4567",
#       "quantity": 60
#     },
#     {
#       "date": "2024-03-10",
#       "product_id": "TEL-4567",
#       "quantity": 55
#     },
#     {
#       "date": "2024-03-11",
#       "product_id": "TEL-4567",
#       "quantity": 50
#     },
#     {
#       "date": "2024-03-12",
#       "product_id": "TEL-4567",
#       "quantity": 48
#     },
#     {
#       "date": "2024-03-13",
#       "product_id": "TEL-4567",
#       "quantity": 47
#     },
#     {
#       "date": "2024-03-14",
#       "product_id": "TEL-4567",
#       "quantity": 45
#     },
#     {
#       "date": "2024-03-01",
#       "product_id": "TEL-8901",
#       "quantity": 50
#     },
#     {
#       "date": "2024-03-02",
#       "product_id": "TEL-8901",
#       "quantity": 48
#     },
#     {
#       "date": "2024-03-03",
#       "product_id": "TEL-8901",
#       "quantity": 45
#     },
#     {
#       "date": "2024-03-04",
#       "product_id": "TEL-8901",
#       "quantity": 42
#     },
#     {
#       "date": "2024-03-05",
#       "product_id": "TEL-8901",
#       "quantity": 38
#     },
#     {
#       "date": "2024-03-06",
#       "product_id": "TEL-8901",
#       "quantity": 35
#     },
#     {
#       "date": "2024-03-07",
#       "product_id": "TEL-8901",
#       "quantity": 32
#     },
#     {
#       "date": "2024-03-08",
#       "product_id": "TEL-8901",
#       "quantity": 28
#     },
#     {
#       "date": "2024-03-09",
#       "product_id": "TEL-8901",
#       "quantity": 25
#     },
#     {
#       "date": "2024-03-10",
#       "product_id": "TEL-8901",
#       "quantity": 22
#     },
#     {
#       "date": "2024-03-11",
#       "product_id": "TEL-8901",
#       "quantity": 18
#     },
#     {
#       "date": "2024-03-12",
#       "product_id": "TEL-8901",
#       "quantity": 15
#     },
#     {
#       "date": "2024-03-13",
#       "product_id": "TEL-8901",
#       "quantity": 13
#     },
#     {
#       "date": "2024-03-14",
#       "product_id": "TEL-8901",
#       "quantity": 12
#     },
#     {
#       "date": "2024-03-01",
#       "product_id": "TEL-2345",
#       "quantity": 60
#     },
#     {
#       "date": "2024-03-02",
#       "product_id": "TEL-2345",
#       "quantity": 58
#     },
#     {
#       "date": "2024-03-03",
#       "product_id": "TEL-2345",
#       "quantity": 55
#     },
#     {
#       "date": "2024-03-04",
#       "product_id": "TEL-2345",
#       "quantity": 52
#     },
#     {
#       "date": "2024-03-05",
#       "product_id": "TEL-2345",
#       "quantity": 50
#     },
#     {
#       "date": "2024-03-06",
#       "product_id": "TEL-2345",
#       "quantity": 47
#     },
#     {
#       "date": "2024-03-07",
#       "product_id": "TEL-2345",
#       "quantity": 45
#     },
#     {
#       "date": "2024-03-08",
#       "product_id": "TEL-2345",
#       "quantity": 42
#     },
#     {
#       "date": "2024-03-09",
#       "product_id": "TEL-2345",
#       "quantity": 40
#     },
#     {
#       "date": "2024-03-10",
#       "product_id": "TEL-2345",
#       "quantity": 37
#     },
#     {
#       "date": "2024-03-11",
#       "product_id": "TEL-2345",
#       "quantity": 35
#     },
#     {
#       "date": "2024-03-12",
#       "product_id": "TEL-2345",
#       "quantity": 33
#     },
#     {
#       "date": "2024-03-13",
#       "product_id": "TEL-2345",
#       "quantity": 31
#     },
#     {
#       "date": "2024-03-14",
#       "product_id": "TEL-2345",
#       "quantity": 30
#     },
#     {
#       "date": "2024-03-01",
#       "product_id": "TEL-6789",
#       "quantity": 120
#     },
#     {
#       "date": "2024-03-02",
#       "product_id": "TEL-6789",
#       "quantity": 118
#     },
#     {
#       "date": "2024-03-03",
#       "product_id": "TEL-6789",
#       "quantity": 115
#     },
#     {
#       "date": "2024-03-04",
#       "product_id": "TEL-6789",
#       "quantity": 112
#     },
#     {
#       "date": "2024-03-05",
#       "product_id": "TEL-6789",
#       "quantity": 110
#     },
#     {
#       "date": "2024-03-06",
#       "product_id": "TEL-6789",
#       "quantity": 107
#     },
#     {
#       "date": "2024-03-07",
#       "product_id": "TEL-6789",
#       "quantity": 105
#     },
#     {
#       "date": "2024-03-08",
#       "product_id": "TEL-6789",
#       "quantity": 102
#     },
#     {
#       "date": "2024-03-09",
#       "product_id": "TEL-6789",
#       "quantity": 100
#     },
#     {
#       "date": "2024-03-10",
#       "product_id": "TEL-6789",
#       "quantity": 97
#     },
#     {
#       "date": "2024-03-11",
#       "product_id": "TEL-6789",
#       "quantity": 95
#     },
#     {
#       "date": "2024-03-12",
#       "product_id": "TEL-6789",
#       "quantity": 92
#     },
#     {
#       "date": "2024-03-13",
#       "product_id": "TEL-6789",
#       "quantity": 85
#     },
#     {
#       "date": "2024-03-14",
#       "product_id": "TEL-6789",
#       "quantity": 80
#     },
#     {
#       "date": "2024-03-01",
#       "product_id": "TEL-3456",
#       "quantity": 200
#     },
#     {
#       "date": "2024-03-02",
#       "product_id": "TEL-3456",
#       "quantity": 195
#     },
#     {
#       "date": "2024-03-03",
#       "product_id": "TEL-3456",
#       "quantity": 190
#     },
#     {
#       "date": "2024-03-04",
#       "product_id": "TEL-3456",
#       "quantity": 185
#     },
#     {
#       "date": "2024-03-05",
#       "product_id": "TEL-3456",
#       "quantity": 180
#     },
#     {
#       "date": "2024-03-06",
#       "product_id": "TEL-3456",
#       "quantity": 175
#     },
#     {
#       "date": "2024-03-07",
#       "product_id": "TEL-3456",
#       "quantity": 170
#     },
#     {
#       "date": "2024-03-08",
#       "product_id": "TEL-3456",
#       "quantity": 165
#     },
#     {
#       "date": "2024-03-09",
#       "product_id": "TEL-3456",
#       "quantity": 160
#     },
#     {
#       "date": "2024-03-10",
#       "product_id": "TEL-3456",
#       "quantity": 158
#     },
#     {
#       "date": "2024-03-11",
#       "product_id": "TEL-3456",
#       "quantity": 155
#     },
#     {
#       "date": "2024-03-12",
#       "product_id": "TEL-3456",
#       "quantity": 153
#     },
#     {
#       "date": "2024-03-13",
#       "product_id": "TEL-3456",
#       "quantity": 152
#     },
#     {
#       "date": "2024-03-14",
#       "product_id": "TEL-3456",
#       "quantity": 150
#     }
#   ]
# }

# c = {
#   "inventoryData": {
#     "TEL-4567": 45,
#     "TEL-8901": 12,
#     "TEL-2345": 30,
#     "TEL-6789": 80,
#     "TEL-3456": 150
#   }
# }
# print(yandex_client.safe_parse_json(yandex_client.send_to_ai(c, a)))
# t = [{'product_id': 'TEL-4567', 'days_until_stockout': 7, 'recommended_order': 75}, {'product_id': 'TEL-8901', 'days_until_stockout': 6, 'recommended_order': 30}, {'product_id': 'TEL-2345', 'days_until_stockout': 7, 'recommended_order': 40}, {'product_id': 'TEL-6789', 'days_until_stockout': 7, 'recommended_order': 100}, {'product_id': 'TEL-3456', 'days_until_stockout': 7, 'recommended_order': 150}, {'created_at': datetime.datetime(2025, 10, 28, 3, 4, 50, 792435)}]
# db.add_ai_prediction(t)