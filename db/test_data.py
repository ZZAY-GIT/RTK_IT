from db.DataBaseManager import db
from random import choice

def generate_test_data(): # Только когда база данных пустая, иначе может вызвать ошибку
    user = dict(emil = ''.join([chr(choice(range(97, 123))) for len in range(choice(range(10, 20)))]) + choice(["gmail.com", "yandex.ru", "mail.ru"]),
                name = choice(["Kirill", "Anton", "Petya", "Sasha"]),
                password = ''.join([chr(choice(range(97, 123))) for len in range(choice(range(10, 20)))]),
                role = choice(["admin", "user"]))
    
    robot = dict(robot_id = "RB-00" + str(choice(range(1, 10))),
                 battery_level = choice(range(101)),
                 status = choice(["active", "low_battery", "unactive"]))
    
    product = dict(product_id = "TEL-" + str(choice(range(1000, 10000))),
                   name = ''.join([chr(choice(range(97, 123))) for len in range(choice(range(10, 20)))]),
                   category = choice(["fuits", "vegetables", "milk"]),
                   min_stock = choice(range(1, 20)),
                   optimal = choice(range(50, 100))
    )
    db.add_user(user["emil"], user["password"], user['name'], user["role"])
    db.add_robot(robot_id=robot["robot_id"], battery_level=robot["battery_level"], status=robot["status"])
    db.add_product(id=product["product_id"], name=product["name"], category=product["category"], min_stock=product["min_stock"], optimal_stock=product["optimal"])