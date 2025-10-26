from db.DataBaseManager import db
from random import choice, randint
from datetime import datetime, timedelta
from db.models import Robot, Product, InventoryHistory

def generate_inventory_history_data(count: int):
    """
    Генерирует тестовые данные для таблицы inventory_history
    """
    # Используем DBSession вместо session
    session = db.DBSession()
    
    try:
        # Получаем всех роботов и продукты напрямую из базы
        robots = session.query(Robot).all()
        products = session.query(Product).all()
        
        if not robots:
            raise ValueError("Нет роботов в базе данных. Сначала запустите generate_test_data()")
        if not products:
            raise ValueError("Нет продуктов в базе данных. Сначала запустите generate_test_data()")
        
        print(f"Найдено роботов: {len(robots)}, продуктов: {len(products)}")
        
        zones = ["A", "B", "C", "D", "E"]
        statuses = ["OK", "LOW_STOCK", "CRITICAL"]
        
        for i in range(count):
            # Выбираем случайного робота и продукт
            robot = choice(robots)
            product = choice(products)
            
            # Создаем запись инвентаризации
            inventory_record = InventoryHistory(
                robot_id=robot.id,  # используем id как внешний ключ
                product_id=product.id,  # используем id как внешний ключ
                quantity=randint(0, 1000),
                zone=choice(zones),
                row_number=randint(1, 10),
                shelf_number=randint(1, 5),
                status=choice(statuses),
                scanned_at=datetime.now() - timedelta(
                    days=randint(0, 365), 
                    hours=randint(0, 23),
                    minutes=randint(0, 59)
                )
            )
            
            # Добавляем запись в сессию
            session.add(inventory_record)
            
            # Выводим прогресс для небольших количеств
            if count <= 100 and (i + 1) % 10 == 0:
                print(f"Создано {i + 1} записей...")
            elif (i + 1) % 100 == 0:
                print(f"Создано {i + 1} записей...")
        
        # Сохраняем все изменения в базе
        session.commit()
        print(f"Успешно добавлено {count} записей в inventory_history")
        
    except Exception as e:
        session.rollback()
        print(f"Ошибка при добавлении записей: {e}")
        raise
    finally:
        session.close()

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