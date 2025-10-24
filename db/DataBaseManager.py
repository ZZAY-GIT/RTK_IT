from db.models import Base, User, Robot, Product, InventoryHistory, AIPrediction
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine, func
import logging
from sqlalchemy.exc import IntegrityError
from settings import settings
from datetime import datetime, timedelta
import bcrypt
from datetime import datetime
from typing import List, Dict


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

    def _commit_record(self, record):
        try:
            with self.DBSession() as _s:
                _s.add(record)
                _s.commit()
                logging.debug("Record added")
        except Exception as e:
            logging.error(f"Error adding record {e}")

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

    #Работа робота
    def add_robot_data(self, robot_data):
        with self.DBSession() as _s:
            n = len(robot_data.get("scan_results"))
            for i in range(n):
                new_inventory_history = self.InventoryHistory(
                    robot_id=robot_data.get("robot_id", None),
                    zone=robot_data.get("location", None).get("zone", None),
                    row_number=robot_data.get("location", None).get("row", None),
                    shelf_number=robot_data.get("location", None).get("shelf", None),
                    product_id=robot_data.get("scan_results", None)[i].get("product_id", None),
                    quantity=robot_data.get("scan_results", None)[i].get("quantity", None),
                    status=robot_data.get("scan_results", None)[i].get("status", None),
                    scanned_at=robot_data.get("timestamp", None)
                )
                _s.add(new_inventory_history)
            try:
                _s.commit()
                return True
            except IntegrityError:
                _s.rollback()
                return False
        #self._commit_record(new_inventory_history)
    
    # Сводка работы роботов за последние 24 часа
    def get_last_day_inventory_history(self, from_date, to_date, zone, row, shelf, product_id, status):
        """
        Возвращает историю инвентаризации:
        - Если today=True: с 00:00 текущего дня (UTC)
        - Если today=False: за последние 24 часа
        """
        with self.DBSession() as _s:
            existing_inventory_history = _s.query(self.InventoryHistory) \
                .filter(self.InventoryHistory.scanned_at >= 24).all()
            return existing_inventory_history
        
    # dashboard
    # Blok 2, функуциии распределить потом в удобном порядке
    # Сводка количества активных роботов, возвращает кортеж формата (n активных роботов, m всего роботов)
    def get_active_robots(self): # Не проверено
        with self.DBSession() as _s:
            active_robots_count = _s.query(Robot).filter(Robot.status == 'active').count()
            count_robots = _s.query(Robot).count()
            return (active_robots_count, count_robots)
        
    # Средний заряд батареи роботов, возвращает чило
    def average_battery_charge(self): # Не проверено
        with self.DBSession() as _s:
            avg_battery = _s.query(func.avg(Robot.battery_level)).scalar()
            return avg_battery
    

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
    
    def add_ai_prediction(self, predictions: List[Dict], confidence_score: float):
        """
        Добавляет предсказания AI в таблицу ai_predictions.
        predictions: список словарей с полями product_id, days_until_stockout, recommended_order
        confidence_score: уровень достоверности предсказания
        """
        with self.DBSession() as _s:
            prediction_date = predictions[-1].get("created_at", None)
            predictions = predictions[:-1]
            for prediction in predictions:
                product_id = prediction.get("product_id", None)
                days_until_stockout = prediction.get("days_until_stockout", None)
                recommended_order = prediction.get("recommended_order", None)
                # Создание новой записи
                new_prediction = self.AIPrediction(
                    product_id=product_id,
                    days_until_stockout=days_until_stockout,
                    recommended_order=recommended_order,
                    confidence_score=confidence_score,
                    prediction_date=prediction_date
                )
                _s.add(new_prediction)
                logging.info(f"Added AI prediction for product {product_id}")

            try:
                _s.commit()
                logging.info(f"Successfull")

            except IntegrityError:
                _s.rollback()
                logging.error("Failed to add AI predictions: IntegrityError")

    def get_ai_predictions(self):
        with self.DBSession() as _s:
            prediction = _s.query(self.AIPrediction).order_by(self.AIPrediction.prediction_date.desc()).first()
            if prediction:
                logging.info(f"Found latest prediction for product_id: {prediction.product_id}, date: {prediction.prediction_date}")
                return {
                    "id": prediction.id,
                    "product_id": prediction.product_id,
                    "prediction_date": prediction.prediction_date.isoformat() if prediction.prediction_date else None,
                    "days_until_stockout": prediction.days_until_stockout,
                    "recommended_order": prediction.recommended_order,
                    "confidence_score": float(prediction.confidence_score) if prediction.confidence_score else None,
                    "created_at": prediction.created_at.isoformat() if prediction.created_at else None
                }
            else:
                logging.info(f"Entry not found")
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

db = DataBaseManager(settings.CONN_STR)

def hash_password(password: str) -> bytes:
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed

def verify_password(password: str, hashed_password: bytes) -> bool:
    password_bytes = password.encode('utf-8')
    return bcrypt.checkpw(password_bytes, hashed_password)
