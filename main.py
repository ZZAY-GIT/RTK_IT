from DB.DataBaseManager import db, verify_password, hash_password
from api.api import app
# # 1. Добавить пользователя (хеширование происходит внутри add_user)
# db.add_user("ampleenkov.do@gmail.com", "123123123", "Daniil", "operator")

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)