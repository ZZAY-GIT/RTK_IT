from db.models import Base, User, Robot, Product, InventoryHistory, AIPrediction
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine, func
import logging
from sqlalchemy.exc import IntegrityError
from settings import settings
from datetime import datetime, timedelta
import bcrypt
from datetime import datetime


class DataBaseManager:
    def __init__(self, conn_str: str):
        self.conn_str = conn_str
        self.engine = create_engine(conn_str, echo=False)
        self.DBSession = sessionmaker(bind=self.engine)
        self.create_tables()

    def create_tables(self):
        Base.metadata.create_all(self.engine)
        self.User = User
        self.Robot = Robot
        self.Product = Product
        self.InventoryHistory = InventoryHistory
        self.AIPrediction = AIPrediction

    # Методы User
    def add_user(self, email: str, password: str, name: str, role: str):
        password_hash = hash_password(password)  # Хешируем пароль
        with self.DBSession() as _s:
            # Проверяем, существует ли пользователь с таким email
            existing_user = _s.query(self.User).filter(self.User.email == email).first()
            if existing_user:
                logging.info(f"User with email {email} already exists")
                return None  # Или можно выбросить исключение

            # Создаем нового пользователя
            new_user = self.User(
                email=email,
                password_hash=password_hash,
                name=name,
                role=role
            )
            _s.add(new_user)
            try:
                _s.commit()
                logging.info(f"Successfully created user with email {email}")
                return new_user
            except IntegrityError:
                _s.rollback()
                logging.error(f"Failed to create user with email {email}: IntegrityError")
                return None
    
    def get_user(self, email: str):
        with self.DBSession() as _s:
            # Проверяем, существует ли пользователь с таким email
            existing_user = _s.query(self.User).filter(self.User.email == email).first()
            if existing_user:
                logging.info(f"User with email {email} found")
                return existing_user
            else:
                logging.info(f"User with email {email} not found")
                return None

    def get_user_by_id(self, user_id: int):
        with self.DBSession() as _s:
            user = _s.query(self.User).filter(self.User.id == user_id).first()
            if user:
                logging.info(f"User with id {user_id} found")
                return user
            else:
                logging.info(f"User with id {user_id} not found")
                return None

    def get_user_password(self, email: str) -> str | None:
        with self.DBSession() as _s:
            record = (
                _s.query(self.User)
                .filter(self.User.email == email)
                .first()
            )
        if not record:
            return None
        record = record.password_hash
        return record
    
    def get_all_users(self):
        with self.DBSession() as _s:
            users = _s.query(self.User).all()
            return users
    
    def update_user(self, user_id: int, **kwargs):
        with self.DBSession() as _s:
            user = _s.query(self.User).filter(self.User.id == user_id).first()
            if not user:
                logging.info(f"User with id {user_id} not found")
                return None
            
            # Обновляем только переданные поля
            for key, value in kwargs.items():
                if hasattr(user, key) and value is not None:
                    if key == 'password':
                        # Хешируем новый пароль
                        user.password_hash = hash_password(value)
                    else:
                        setattr(user, key, value)
            
            try:
                _s.commit()
                logging.info(f"Successfully updated user with id {user_id}")
                return user
            except IntegrityError:
                _s.rollback()
                logging.error(f"Failed to update user with id {user_id}: IntegrityError")
                return None
    
    def delete_user(self, user_id: int):
        with self.DBSession() as _s:
            user = _s.query(self.User).filter(self.User.id == user_id).first()
            if not user:
                logging.info(f"User with id {user_id} not found")
                return False
            
            _s.delete(user)
            try:
                _s.commit()
                logging.info(f"Successfully deleted user with id {user_id}")
                return True
            except IntegrityError:
                _s.rollback()
                logging.error(f"Failed to delete user with id {user_id}: IntegrityError")
                return False

    # Методы Product
    def add_product(self, id, name, category, min_stock, optimal_stock):
        with self.DBSession() as _s:
            new_product = self.Product(
                id=id,
                name=name,
                category=category,
                min_stock=min_stock,
                optimal_stock=optimal_stock
            )
            _s.add(new_product)
            try:
                _s.commit()
                return True
            except IntegrityError:
                _s.rollback()
                return False

    def get_product(self, product_id: str):
        with self.DBSession() as _s:
            product = _s.query(self.Product).filter(self.Product.id == product_id).first()
            if product:
                logging.info(f"Product with id {product_id} found")
                return product
            else:
                logging.info(f"Product with id {product_id} not found")
                return None
    
    def get_all_products(self):
        with self.DBSession() as _s:
            products = _s.query(self.Product).all()
            return products
    
    def update_product(self, product_id: str, **kwargs):
        with self.DBSession() as _s:
            product = _s.query(self.Product).filter(self.Product.id == product_id).first()
            if not product:
                logging.info(f"Product with id {product_id} not found")
                return None
            
            # Обновляем только переданные поля
            for key, value in kwargs.items():
                if hasattr(product, key) and value is not None:
                    setattr(product, key, value)
            
            try:
                _s.commit()
                logging.info(f"Successfully updated product with id {product_id}")
                return product
            except IntegrityError:
                _s.rollback()
                logging.error(f"Failed to update product with id {product_id}: IntegrityError")
                return None
    
    def delete_product(self, product_id: str):
        with self.DBSession() as _s:
            product = _s.query(self.Product).filter(self.Product.id == product_id).first()
            if not product:
                logging.info(f"Product with id {product_id} not found")
                return False
            
            _s.delete(product)
            try:
                _s.commit()
                logging.info(f"Successfully deleted product with id {product_id}")
                return True
            except IntegrityError:
                _s.rollback()
                logging.error(f"Failed to delete product with id {product_id}: IntegrityError")
                return False

    # Методы Robot
    def add_robot(self, robot_id: str, status: str = "active", battery_level: int = 100):
        with self.DBSession() as _s:
            # Проверяем существование робота
            existing_robot = _s.query(self.Robot).filter(self.Robot.id == robot_id).first()

            if existing_robot:
                logging.info(f"Robot with id {robot_id} already exists")
                # Робот существует
                return existing_robot

            # Робот не существует - создаем нового
            new_robot = self.Robot(
                id=robot_id,
                status=status,
                battery_level=battery_level,
                last_update=datetime.now(),
            )
            _s.add(new_robot)
            try:
                _s.commit()
                _s.refresh(new_robot)
                logging.info(f"Successfully created robot with id {robot_id}")
                return new_robot

            except IntegrityError:
                _s.rollback()
                logging.error(f"Failed to create robot with id {robot_id}: IntegrityError")
                return None

    def get_robot(self, robot_id: str):
        with self.DBSession() as _s:
            robot = _s.query(self.Robot).filter(self.Robot.id == robot_id).first()
            if robot:
                logging.info(f"Robot with id {robot_id} found")
                return robot
            else:
                logging.info(f"Robot with id {robot_id} not found")
                return None

    def get_all_robots(self):
        with self.DBSession() as _s:
            robots = _s.query(self.Robot).all()
            return robots
    
    def update_robot(self, robot_id: str, **kwargs):
        with self.DBSession() as _s:
            robot = _s.query(self.Robot).filter(self.Robot.id == robot_id).first()
            if not robot:
                logging.info(f"Robot with id {robot_id} not found")
                return None
            
            # Обновляем только переданные поля
            for key, value in kwargs.items():
                if hasattr(robot, key) and value is not None:
                    setattr(robot, key, value)
            
            # Обновляем время последнего обновления
            robot.last_update = datetime.now()
            
            try:
                _s.commit()
                logging.info(f"Successfully updated robot with id {robot_id}")
                return robot
            except IntegrityError:
                _s.rollback()
                logging.error(f"Failed to update robot with id {robot_id}: IntegrityError")
                return None
    
    def delete_robot(self, robot_id: str):
        with self.DBSession() as _s:
            robot = _s.query(self.Robot).filter(self.Robot.id == robot_id).first()
            if not robot:
                logging.info(f"Robot with id {robot_id} not found")
                return False
            
            _s.delete(robot)
            try:
                _s.commit()
                logging.info(f"Successfully deleted robot with id {robot_id}")
                return True
            except IntegrityError:
                _s.rollback()
                logging.error(f"Failed to delete robot with id {robot_id}: IntegrityError")
                return False

    #Работа робота
    def add_robot_data(self, robot_data):
        with self.DBSession() as _s:
            robot_id = robot_data.get("robot_id", None)
            battery_level = robot_data.get("battery_level", None)
            timestamp_str = robot_data.get("timestamp", None)
            scanned_at = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00')) if timestamp_str else datetime.now()

            # Определяем статус на основе уровня батареи
            robot_status = "active"
            if battery_level is not None:
                if battery_level < 20:
                    robot_status = "low_battery"
                elif battery_level == 0:
                    robot_status = "inactive"

            robot = self.get_robot(robot_id)
            if not robot:
                # Добавляем нового робота
                robot = self.add_robot(robot_id, robot_status, battery_level)
                if not robot:
                    return False
            else:
                # Обновляем существующего робота
                robot.battery_level = battery_level
                robot.status = robot_status
                robot.last_update = datetime.now()
                _s.add(robot)

            # Получаем location (один для всех scan_results)
            robot_location = robot_data.get("location", None)
            zone = None
            row_number = None
            shelf_number = None
            if robot_location:
                zone = robot_location.get("zone", None)
                row_number = robot_location.get("row", None)
                shelf_number = robot_location.get("shelf", None)

            # Обновляем текущую позицию робота
            if zone is not None:
                robot.current_zone = zone
            if row_number is not None:
                robot.current_row = row_number
            if shelf_number is not None:
                robot.current_shelf = shelf_number
            _s.add(robot)

            # Обрабатываем scan_results
            scan_results = robot_data.get("scan_results", [])
            for scan_result in scan_results:
                product_id = scan_result.get("product_id", None)
                product_name = scan_result.get("product_name", None)
                quantity = scan_result.get("quantity", None)
                status = scan_result.get("status", None)

                if product_id and product_name:
                    # Проверяем/добавляем/обновляем продукт
                    product = self.get_product(product_id)
                    if not product:
                        # Добавляем новый продукт с дефолтными значениями
                        self.add_product(
                            id=product_id,
                            name=product_name,
                            category=None,  # Можно задать дефолт или извлечь, если нужно
                            min_stock=10,   # Дефолт из модели
                            optimal_stock=100  # Дефолт из модели
                        )
                    else:
                        # Обновляем имя, если оно отличается (опционально)
                        if product.name != product_name:
                            product.name = product_name
                            _s.add(product)

                # Создаем запись в InventoryHistory
                new_inventory_history = self.InventoryHistory(
                    robot_id=robot_id,
                    zone=zone,
                    row_number=row_number,
                    shelf_number=shelf_number,
                    product_id=product_id,
                    quantity=quantity,
                    status=status,
                    scanned_at=scanned_at
                )
                _s.add(new_inventory_history)

            try:
                _s.commit()
                logging.info(f"Successfully processed robot data for {robot_id}")
                return True
            except IntegrityError as e:
                _s.rollback()
                logging.error(f"Failed to process robot data for {robot_id}: {str(e)}")
                return False

    def get_current_state(self):
        """Получает текущее состояние для dashboard"""
        with self.DBSession() as _s:
            # Активные роботы
            active_robots_count, total_robots = self.get_active_robots()

            # Средний заряд батареи
            avg_battery = self.average_battery_charge() or 0

            # Проверено сегодня
            today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
            scanned_today = _s.query(self.InventoryHistory) \
                .filter(self.InventoryHistory.scanned_at >= today_start) \
                .count()

            # Критические остатки
            critical_stocks = _s.query(self.InventoryHistory) \
                .filter(self.InventoryHistory.status == 'CRITICAL') \
                .filter(self.InventoryHistory.scanned_at >= today_start) \
                .count()

            # Последние сканирования (20 записей)
            recent_scans = _s.query(self.InventoryHistory) \
                .order_by(self.InventoryHistory.scanned_at.desc()) \
                .all()

            # Текущие роботы
            robots = _s.query(self.Robot).all()

            return {
                "statistics": {
                    "active_robots": active_robots_count,
                    "total_robots": total_robots,
                    "scanned_today": scanned_today,
                    "critical_stocks": critical_stocks,
                    "average_battery": round(avg_battery, 1)
                },
                "robots": [
                    {
                        "id": robot.id,
                        "status": robot.status,
                        "battery_level": robot.battery_level,
                        "last_update": robot.last_update.isoformat() if robot.last_update else None,
                        "current_zone": robot.current_zone,
                        "current_row": robot.current_row,
                        "current_shelf": robot.current_shelf
                    }
                    for robot in robots
                ],
                "recent_scans": [
                    {
                        "id": scan.id,
                        "robot_id": scan.robot_id,
                        "product_id": scan.product_id,
                        "quantity": scan.quantity,
                        "zone": scan.zone,
                        "status": scan.status,
                        "scanned_at": scan.scanned_at.isoformat() if scan.scanned_at else None
                    }
                    for scan in recent_scans
                ]
            }

    def add_robot_data_csv(self, robot_data):
        with self.DBSession() as _s:
            new_inventory_history = self.InventoryHistory(
                robot_id=robot_data.get("robot_id", None),
                zone=robot_data.get("zone", None),
                row_number=robot_data.get("row", None),
                shelf_number=robot_data.get("shelf", None),
                product_id=robot_data.get("product_id", None),
                quantity=robot_data.get("quantity", None),
                status=robot_data.get("status", None),
                scanned_at=robot_data.get("date", None)
            )
            _s.add(new_inventory_history)
            try:
                _s.commit()
            except IntegrityError:
                _s.rollback()
        #self._commit_record(new_inventory_history)
        
    # Сводка работы роботов по фильтрам
    def get_filter_inventory_history(self, from_date=None, to_date=None, zone=None, shelf=None, status=None, category=None):
        
        with self.DBSession() as _s:
            # Базовый запрос для inventory_history
            
            query = _s.query(InventoryHistory)
            # Применяем фильтры
            if from_date is not None:
                query = query.filter(InventoryHistory.scanned_at >= from_date)
            if to_date is not None:
                query = query.filter(InventoryHistory.scanned_at <= to_date)
            if zone is not None:
                query = query.filter(InventoryHistory.zone == zone)
            if shelf is not None:
                query = query.filter(InventoryHistory.shelf_number == shelf)
            if status is not None:
                query = query.filter(InventoryHistory.status == status)
            fileter_history = []

            # Получаем все записи inventory_history
            inventory_records = query.all()

            # Собираем все product_id для batch запроса к AI predictions
            product_ids = [inv.product_id for inv in inventory_records if inv.product_id]

            # Получаем все AI predictions для этих product_ids одним запросом
            ai_predictions = {}
            if product_ids:
                predictions_query = _s.query(AIPrediction).filter(
                    AIPrediction.product_id.in_(product_ids)
                )

                # Группируем predictions по product_id, берем последнее по дате
                for pred in predictions_query:
                    if pred.product_id not in ai_predictions:
                        ai_predictions[pred.product_id] = pred
                    else:
                        # Если есть несколько predictions, берем самую свежую
                        existing_pred = ai_predictions[pred.product_id]
                        if pred.prediction_date and existing_pred.prediction_date:
                            if pred.prediction_date > existing_pred.prediction_date:
                                ai_predictions[pred.product_id] = pred

            # Формируем результат
            for inv_his in inventory_records:
                result_json = {
                    'robot_id': inv_his.robot_id,
                    'product_id': inv_his.product_id,
                    'quantity': inv_his.quantity,
                    'zone': inv_his.zone,
                    'status': inv_his.status,
                    'scanned_at': inv_his.scanned_at.isoformat() if inv_his.scanned_at else None,
                }

                # Ищем AI предсказание для этого product_id
                ai_pred = ai_predictions.get(inv_his.product_id)

                if ai_pred:
                    result_json['recommended_order'] = ai_pred.recommended_order
                    result_json['discrepancy'] = abs(inv_his.quantity - ai_pred.recommended_order)
                else:
                    result_json['recommended_order'] = 0
                    result_json['discrepancy'] = inv_his.quantity

                fileter_history.append(result_json)
                
            return fileter_history
        
    # dashboard
    # Blok 2, функуциии распределить потом в удобном порядке
    # Сводка количества активных роботов, возвращает кортеж формата (n активных роботов, m всего роботов)
    def get_active_robots(self): # Не проверено
        with self.DBSession() as _s:
            active_robots_count = _s.query(Robot).filter(Robot.status == 'active').count()
            count_robots = _s.query(Robot).count()
            return (active_robots_count, count_robots)
        
    # Средний заряд батареи роботов, возвращает чило
    def average_battery_charge(self):
        with self.DBSession() as _s:
            avg_battery = _s.query(func.avg(Robot.battery_level)) \
                            .filter(Robot.status == "active") \
                            .scalar()
        return avg_battery

db = DataBaseManager(settings.CONN_STR)

def hash_password(password: str) -> bytes:
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed

def verify_password(password: str, hashed_password: bytes) -> bool:
    password_bytes = password.encode('utf-8')
    return bcrypt.checkpw(password_bytes, hashed_password)