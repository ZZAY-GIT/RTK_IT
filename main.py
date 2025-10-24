from db.DataBaseManager import db, verify_password
from api.api import app
from ai.yandex_gpt_client import yandex_client
import json

# 1. Добавить пользователя (хеширование происходит внутри add_user)

# predict = '[{"product_id": "avc", "days_until_stockout":123, "recommended_order":321}, {"product_id": "avc", "days_until_stockout":456, "recommended_order":654}]'
# predict = yandex_client.safe_parse_json(predict)
prediction = db.get_ai_predictions()
print(prediction)
# if prediction:
#     print(f"Latest prediction: Product: {prediction.product_id}, "
#           f"Date: {prediction.prediction_date}, "
#           f"Days until stockout: {prediction.days_until_stockout}, "
#           f"Recommended order: {prediction.recommended_order}")
# else:
#     print("No predictions found")
# print(db.get_ai_predictions())
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