from DB.DataBaseManager import db, verify_password, hash_password

# 1. Добавить пользователя (хеширование происходит внутри add_user)
db.add_user("ampleenkov.do@gmail.com", "123123123", "Daniil", "operator")

# 2. Проверить пароль через БД
password = db.get_user_password("ampleenkov.do@gmail.com")
print(password)
print(type(password))
if verify_password("123123123", password):
    print("Authentication successful!")
else:
    print("Authentication failed!")