from db.models import Base, User, Robot, Product, InventoryHistory, AIPrediction
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine, func, desc
import logging
from sqlalchemy.exc import IntegrityError
from settings import settings
from datetime import datetime, timedelta, timezone
import bcrypt
from datetime import datetime
from typing import List, Dict
import pandas as pd
import io
from api.schemas import (
    UserResponse,
    ProductResponse,
    RobotResponse,
    PredictResponse,
)
import pandas as pd
import io


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
        password_hash = hash_password(password)
        with self.DBSession() as _s:
            existing_user = _s.query(self.User).filter(self.User.email == email).first()
            if existing_user:
                logging.info(f"User with email {email} already exists")
                return None

            new_user = self.User(
                email=email,
                password_hash=password_hash,
                name=name,
                role=role
            )
            _s.add(new_user)
            try:
                _s.commit()
                _s.refresh(new_user)  # Важно!

                logging.info(f"Successfully created user with email {email}")
                
                return UserResponse(id=new_user.id,
                    email=new_user.email,
                    name=new_user.name,
                    role=new_user.role,
                )
            except Exception as e:
                _s.rollback()
                print(f"Failed to create user: {e}")
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
            return [
                UserResponse(
                    id=user.id,
                    email=user.email,
                    name=user.name,
                    role=user.role,
                    created_at=user.created_at.isoformat()
                )
                for user in users
            ]
    
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
                _s.refresh(user)  # Обновляем объект из базы
                logging.info(f"Successfully updated user with id {user_id}")

                # Возвращаем UserResponse вместо SQLAlchemy объекта
                return UserResponse(
                    id=user.id,
                    email=user.email,
                    name=user.name,
                    role=user.role
                )
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
            # Ищем максимальный существующий ID с префиксом TEL-
            max_id_product = _s.query(self.Product).filter(
                self.Product.id.like('TEL-%')
            ).order_by(
                self.Product.id.desc()
            ).first()

            # Генерируем новый ID
            if max_id_product:
                # Извлекаем числовую часть из последнего ID
                last_number = int(max_id_product.id.split('-')[1])
                new_number = last_number + 1
            else:
                # Если нет существующих продуктов с TEL-, начинаем с 1
                new_number = 1

            # Форматируем новый ID с ведущими нулями (минимум 4 цифры)
            new_id = f"TEL-{new_number:04d}"

            # Проверяем, не существует ли уже продукт с таким ID (на всякий случай)
            existing_product = _s.query(self.Product).filter(self.Product.id == new_id).first()
            if existing_product:
                # Если существует, ищем следующий доступный номер
                while existing_product:
                    new_number += 1
                    new_id = f"TEL-{new_number:04d}"
                    existing_product = _s.query(self.Product).filter(self.Product.id == new_id).first()

            new_product = self.Product(
                id=id if id else new_id,
                name=name,
                category=category,
                min_stock=min_stock,
                optimal_stock=optimal_stock
            )
            _s.add(new_product)
            try:
                _s.commit()
                return id if id else new_id  # Возвращаем сгенерированный ID
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
            return [
                ProductResponse(
                    id=product.id,
                    name=product.name,
                    category=product.category if product.category is not None else "",
                    min_stock=product.min_stock if product.min_stock is not None else 0,
                    optimal_stock=product.optimal_stock if product.optimal_stock is not None else 0
                )
                for product in products
            ]
    
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
                _s.refresh(product)  # Обновляем объект из БД
                logging.info(f"Successfully updated product with id {product_id}")

                # Возвращаем объект ProductResponse
                return ProductResponse(
                    id=product.id,
                    name=product.name,
                    category=product.category if product.category is not None else "",
                    min_stock=product.min_stock if product.min_stock is not None else 0,
                    optimal_stock=product.optimal_stock if product.optimal_stock is not None else 0
                )
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
    def get_robot(self, robot_id: str):
        with self.DBSession() as _s:
            robot = _s.query(self.Robot).filter(self.Robot.id == robot_id).first()
            if robot:
                logging.info(f"Robot with id {robot_id} found")
                # Возвращаем RobotResponse с правильными полями
                return robot
            else:
                logging.info(f"Robot with id {robot_id} not found")
                return None
            
    def get_robot_response(self, robot_id: str):
        robot = self.get_robot(robot_id)
        if robot:
            return RobotResponse(
                id=robot.id,
                status=robot.status,
                battery_level=robot.battery_level,
                current_zone=robot.current_zone if robot.current_zone is not None else "",
                current_row=robot.current_row if robot.current_row is not None else 0,
                current_shelf=robot.current_shelf if robot.current_shelf is not None else 0,
                last_update=robot.last_update.isoformat() if robot.last_update else ""
            )
        return None

    def add_robot(self, id: str, status: str, battery_level: int, current_zone: str = "", current_row: int = 0, current_shelf: int = 0):
        with self.DBSession() as _s:
            # Ищем максимальный существующий ID с префиксом RB-
            max_id_robot = _s.query(self.Robot).filter(
                self.Robot.id.like('RB-%')
            ).order_by(
                self.Robot.id.desc()
            ).first()

            # Генерируем новый ID
            if max_id_robot:
                last_number = int(max_id_robot.id.split('-')[1])
                new_number = last_number + 1
            else:
                new_number = 1

            new_id = f"RB-{new_number:04d}"

            # Проверяем существование (на всякий случай)
            existing_robot = _s.query(self.Robot).filter(self.Robot.id == new_id).first()
            if existing_robot:
                while existing_robot:
                    new_number += 1
                    new_id = f"RB-{new_number:04d}"
                    existing_robot = _s.query(self.Robot).filter(self.Robot.id == new_id).first()
            new_robot = self.Robot(
                id=id if id else new_id,
                status=status,
                battery_level=battery_level,
                current_zone=current_zone,
                current_row=current_row,
                current_shelf=current_shelf,
                last_update=datetime.now()
            )
            _s.add(new_robot)
            try:
                _s.commit()
                return id if id else new_id
            except IntegrityError:
                _s.rollback()
                return False

    def get_all_robots(self):
        with self.DBSession() as _s:
            robots = _s.query(self.Robot).all()
            return [
                RobotResponse(
                    id=robot.id,
                    status=robot.status,
                    battery_level=robot.battery_level,
                    current_zone=robot.current_zone if robot.current_zone is not None else "",
                    current_row=robot.current_row if robot.current_row is not None else 0,
                    current_shelf=robot.current_shelf if robot.current_shelf is not None else 0,
                    last_update=robot.last_update.isoformat() if robot.last_update else ""
                )
                for robot in robots
            ]

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
                _s.refresh(robot)
                logging.info(f"Successfully updated robot with id {robot_id}")

                return RobotResponse(
                    id=robot.id,
                    status=robot.status,
                    battery_level=robot.battery_level,
                    current_zone=robot.current_zone if robot.current_zone is not None else "",
                    current_row=robot.current_row if robot.current_row is not None else 0,
                    current_shelf=robot.current_shelf if robot.current_shelf is not None else 0,
                    last_update=robot.last_update.isoformat() if robot.last_update else ""
                )
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
            print(robot)
            if not robot:
                # Добавляем нового робота
                new_robot = self.add_robot(robot_id, robot_status, battery_level)
                if not new_robot:
                    return False

                #перезагружаем робота из базы
                robot = _s.query(self.Robot).filter(self.Robot.id == robot_id).first()

                if not robot:
                    return False

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
    
            # Последние сканирования (20 записей) с JOIN к продуктам
            recent_scans = _s.query(self.InventoryHistory, self.Product.name.label('product_name')) \
                .join(self.Product, self.InventoryHistory.product_id == self.Product.id) \
                .order_by(self.InventoryHistory.scanned_at.desc()) \
                .limit(20) \
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
                        "product_name": product_name,  # Добавлено имя продукта
                        "quantity": scan.quantity,
                        "zone": scan.zone,
                        "shelf_number": scan.shelf_number,
                        "status": scan.status,
                        "scanned_at": scan.scanned_at.isoformat() if scan.scanned_at else None
                    }
                    for scan, product_name in recent_scans  # Распаковываем кортеж
                ]
            }
        
    def process_csv_inventory_import(self, csv_content: str) -> Dict[str, any]:
        """
        Обрабатывает CSV данные для импорта инвентаря
        """
        try:
            import pandas as pd
            import io
            
            # Парсим CSV
            df = pd.read_csv(io.StringIO(csv_content), delimiter=';')
            
            # Проверяем обязательные колонки
            required_columns = ['product_id', 'product_name', 'quantity']
            missing_columns = [col for col in required_columns if col not in df.columns]
            if missing_columns:
                return {
                    "status": "error",
                    "error": f"Missing required columns: {', '.join(missing_columns)}"
                }
            
            records = df.where(pd.notnull(df), None).to_dict('records')
            
            success_count = 0
            error_details = []
            
            with self.DBSession() as _s:
                for i, record in enumerate(records, 1):
                    try:
                        product_id = record.get('product_id')
                        product_name = record.get('product_name')
                        quantity = record.get('quantity')
                        zone = record.get('zone')
                        row_number = record.get('row')
                        shelf_number = record.get('shelf')
                        scanned_at_str = record.get('date')
                        
                        # Парсим дату
                        if scanned_at_str:
                            try:
                                scanned_at = datetime.fromisoformat(scanned_at_str.replace('Z', '+00:00'))
                            except ValueError:
                                scanned_at = datetime.now()
                        else:
                            scanned_at = datetime.now()
                        
                        # Проверяем/добавляем продукт
                        product = _s.query(self.Product).filter(self.Product.id == product_id).first()
                        if not product:
                            # Создаем продукт напрямую в этой сессии
                            new_product = self.Product(
                                id=product_id,
                                name=product_name,
                                category=None,
                                min_stock=10,
                                optimal_stock=100
                            )
                            _s.add(new_product)
                        
                        # ✅ robot_id оставляем пустым (NULL)
                        new_inventory = self.InventoryHistory(
                            robot_id=None,  # Оставляем пустым
                            zone=zone,
                            row_number=row_number,
                            shelf_number=shelf_number,
                            product_id=product_id,
                            quantity=quantity,
                            status="OK",
                            scanned_at=scanned_at
                        )
                        _s.add(new_inventory)
                        success_count += 1
                        
                    except Exception as e:
                        error_details.append(f"Row {i}: {str(e)}")
                        logging.error(f"Error processing CSV record {record}: {e}")
                        continue
                
                try:
                    _s.commit()
                    logging.info(f"✅ Successfully imported {success_count} records from CSV")
                    
                    return {
                        "status": "success" if success_count > 0 else "partial_success",
                        "records_processed": success_count,
                        "total_records": len(records),
                        "errors_count": len(error_details),
                        "error_details": error_details if error_details else None,
                        "message": f"Imported {success_count} out of {len(records)} records"
                    }
                    
                except Exception as e:
                    _s.rollback()
                    logging.error(f"❌ Failed to import CSV data: {e}")
                    return {
                        "status": "error",
                        "error": f"Database commit failed: {str(e)}"
                    }
                    
        except Exception as e:
            logging.error(f"❌ CSV import error: {e}")
            return {
                "status": "error",
                "error": f"Internal server error: {str(e)}"
            }

    # Работа с CSV файлом
    def process_csv_file(self, file_csv):
        """Обрабатывает CSV файл и добавляет данные в базу"""
        try:
            # Читаем файл
            contents = file_csv.file.read()
            csv_text = contents.decode('utf-8')
            
            # Используем StringIO для pandas
            df = pd.read_csv(io.StringIO(csv_text), delimiter=';')
            
            # ДЕБАГ: Проверяем что получили
            print(f"DataFrame shape: {df.shape}")
            print(f"DataFrame columns: {df.columns.tolist()}")
            print(f"DataFrame head:\n{df.head()}")
            
            # Передаем DataFrame напрямую, а не records
            return self.add_robot_data_csv_from_dataframe(df)
            
        except Exception as e:
            logging.error(f"Error processing CSV file: {e}")
            raise

    def add_robot_data_csv_from_dataframe(self, df):
        """Добавляет записи из DataFrame в базу данных"""
        with self.DBSession() as _s:
            success_count = 0
            total_records = len(df)
            errors = []
            
            # ДИАГНОСТИКА: Какие колонки есть в DataFrame
            available_columns = df.columns.tolist()
            print(f"Available columns in CSV: {available_columns}")
            
            # Дефолтные значения
            default_status = "NORMAL"
            
            for index, row in df.iterrows():
                try:
                    # ДЕБАГ: Выводим строку
                    print(f"Processing row {index + 1}: {row.to_dict()}")
                    
                    # Получаем значения из CSV
                    product_id = str(row['product_id']).strip() if pd.notna(row.get('product_id')) else None
                    product_name = str(row['product_name']).strip() if pd.notna(row.get('product_name')) else "Unknown Product"
                    zone = str(row['zone']).strip() if pd.notna(row.get('zone')) else "UNKNOWN"
                    
                    # Обрабатываем числовые поля
                    try:
                        quantity = int(float(row['quantity'])) if pd.notna(row.get('quantity')) else 0
                    except (ValueError, TypeError):
                        quantity = 0
                    
                    try:
                        row_number = int(float(row['row'])) if pd.notna(row.get('row')) else None
                    except (ValueError, TypeError):
                        row_number = None
                    
                    try:
                        shelf_number = int(float(row['shelf'])) if pd.notna(row.get('shelf')) else None
                    except (ValueError, TypeError):
                        shelf_number = None
                    
                    # Обрабатываем дату
                    date_str = row.get('date')
                    scanned_at = None
                    if pd.notna(date_str) and date_str:
                        try:
                            date_str_clean = str(date_str).strip()
                            if 'T' in date_str_clean:
                                scanned_at = datetime.fromisoformat(date_str_clean.replace('Z', '+00:00'))
                            else:
                                # Пробуем разные форматы даты
                                try:
                                    scanned_at = datetime.strptime(date_str_clean, '%Y-%m-%d')
                                except ValueError:
                                    try:
                                        scanned_at = datetime.strptime(date_str_clean, '%d.%m.%Y')
                                    except ValueError:
                                        scanned_at = datetime.now()
                        except (ValueError, TypeError) as e:
                            print(f"Date parsing error for '{date_str}': {e}")
                            scanned_at = datetime.now()
                    else:
                        scanned_at = datetime.now()
                    
                    # Проверяем обязательные поля
                    if not product_id:
                        errors.append(f"Row {index+1}: Missing product_id")
                        continue
                    
                    # 1. ПРОВЕРЯЕМ/СОЗДАЕМ ПРОДУКТ
                    existing_product = _s.query(self.Product).filter(self.Product.id == product_id).first()
                    if not existing_product:
                        # Создаем новый продукт
                        try:
                            new_product = self.Product(
                                id=product_id,
                                name=product_name,
                                category="Electronics",  # можно сделать умное определение категории
                                min_stock=10,
                                optimal_stock=50
                            )
                            _s.add(new_product)
                            print(f"✅ Created new product: {product_id} - {product_name}")
                        except Exception as e:
                            errors.append(f"Row {index+1}: Failed to create product {product_id}: {str(e)}")
                            continue
                    else:
                        # Обновляем имя продукта если оно изменилось
                        if existing_product.name != product_name:
                            existing_product.name = product_name
                            print(f"ℹ️ Updated product name: {product_id} - {product_name}")
                    
                    # 2. СОЗДАЕМ ЗАПИСЬ ИНВЕНТАРИЗАЦИИ (robot_id оставляем пустым)
                    new_inventory_history = self.InventoryHistory(
                        robot_id=None,  # Оставляем пустым для CSV импорта
                        zone=zone,
                        row_number=row_number,
                        shelf_number=shelf_number,
                        product_id=product_id,
                        quantity=quantity,
                        status=default_status,
                        scanned_at=scanned_at
                    )
                    _s.add(new_inventory_history)
                    success_count += 1
                    
                    print(f"✓ Successfully added inventory record {index+1}: product={product_id}, quantity={quantity}, zone={zone}")
                    
                except Exception as e:
                    error_msg = f"Row {index+1}: {str(e)}"
                    errors.append(error_msg)
                    logging.error(f"Error with row {index}: {e}")
                    print(f"✗ Error with row {index+1}: {e}")
                    continue
            
            try:
                _s.commit()
                result = {
                    "status": "success", 
                    "records_processed": success_count,
                    "total_records": total_records,
                    "message": f"Successfully imported {success_count} inventory records"
                }
                if errors:
                    result["errors"] = errors
                print(f"✅ CSV import completed: {success_count}/{total_records} records processed")
                return result
                
            except IntegrityError as e:
                _s.rollback()

    def add_ai_prediction(self, predictions: List[Dict]):
        """
        Добавляет предсказания AI в таблицу ai_predictions.
        Если 'created_at' отсутствует, генерирует его автоматически.
        """
        if not predictions:
            logging.warning("Received empty predictions list, nothing to save.")
            return []

        with self.DBSession() as _s:
            saved_predictions_data = []

            for prediction in predictions:
                product_id = prediction.get("product_id")
                days_until_stockout = prediction.get("days_until_stockout")
                recommended_order = prediction.get("recommended_order")

                # ГЕНЕРИРУЕМ ДАТУ, если ее нет в запросе
                prediction_date = prediction.get("created_at") or datetime.now()

                new_prediction = self.AIPrediction(
                    product_id=product_id,
                    days_until_stockout=days_until_stockout,
                    recommended_order=recommended_order,
                    confidence_score=0.75,
                    prediction_date=prediction_date
                )
                _s.add(new_prediction)

                # ВСЕГДА возвращаем дату в формате ISO
                saved_predictions_data.append({
                    "product_id": product_id,
                    "days_until_stockout": days_until_stockout,
                    "recommended_order": recommended_order,
                    "created_at": prediction_date.isoformat() # <-- Всегда будет строка
                })
                logging.info(f"Added AI prediction for product {product_id}")

            try:
                _s.commit()
                logging.info(f"Successfully added {len(predictions)} AI predictions.")
                return saved_predictions_data
            except IntegrityError as e:
                _s.rollback()
                logging.error(f"Failed to add AI predictions: IntegrityError - {str(e)}")
                return None

    def get_data_for_predict(self):
        current_date = datetime.now().date()
        from_date = current_date - timedelta(days=3)
        
        historical_data = db.get_filter_inventory_history(
            from_date=from_date,
            to_date=current_date,
            status="CRITICAL"
        )
        
        if not historical_data:
            # Если нет критических остатков, предсказывать нечего
            print("No critical inventory data found for prediction.")
            return PredictResponse(predictions=[], confidence=0.0)

        inventory_data = db.get_products_unique(historical_data)
        
        if not inventory_data:
            # Если уникальных продуктов нет, тоже нечего предсказывать
            print("No unique products found in critical inventory.")
            return PredictResponse(predictions=[], confidence=0.0)
        return inventory_data, historical_data
    
    def get_ai_predictions(self):
        with self.DBSession() as _s:
            prediction = _s.query(self.AIPrediction).order_by(self.AIPrediction.prediction_date.desc()).limit(10).all()
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

    # def get_products_unique(self, historical_data):
    #     unique_product_id = []
    #     for product in historical_data['status': "CRITICAL"]:
    #         product_id = historical_data["product_id"]
    #         if not(product_id in unique_product_id):
    #             unique_product_id.append(product_id)
    #     inventory_data = {}
    #     with self.DBSession() as _s:
    #         for product_id in unique_product_id:
    #             query = _s.query(self.InventoryHistory).filter(self.product_id == product_id).first()
    #             inventory_data[product_id] = query["quantity"]
    #         return inventory_data


    def get_products_unique(self, historical_data):
        inventory_data = {}

        # Обрабатываем historical_data (предполагается, что это список словарей)
        for item in historical_data:
            # Проверяем статус "CRITICAL"
            if item.get('status') == "CRITICAL":
                product_id = item.get('product_id')
                quantity = item.get('quantity')

                # Если продукт еще не добавлен или добавляем с максимальным количеством
                if product_id and product_id not in inventory_data:
                    inventory_data[product_id] = quantity
                elif product_id in inventory_data:
                    # Если хотим брать максимальное количество для дубликатов
                    inventory_data[product_id] = max(inventory_data[product_id], quantity)

        return inventory_data


    # # Сводка работы роботов по фильтрам
    def get_filter_inventory_history(self, from_date=None, to_date=None, zone=None, shelf=None, status=None, category=None):
        with self.DBSession() as _s:
            # Базовый запрос для inventory_history с JOIN к products
            query = _s.query(InventoryHistory, Product.name.label('product_name'))\
                      .join(Product, InventoryHistory.product_id == Product.id)

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
            # Получаем все записи inventory_history с именами продуктов
            records = query.all()
            # Собираем все product_id для batch запроса к AI predictions
            product_ids = [inv_his.product_id for inv_his, product_name in records if inv_his.product_id]
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
            for inv_his, product_name in records:
                result_json = {
                    'id': inv_his.id,
                    'robot_id': inv_his.robot_id,
                    'product_id': inv_his.product_id,
                    'product_name': product_name,  # Добавлено имя продукта
                    'quantity': inv_his.quantity,
                    'zone': inv_his.zone,
                    'shelf_number': inv_his.shelf_number,
                    'status': inv_his.status,
                    'scanned_at': inv_his.scanned_at.isoformat() if inv_his.scanned_at else None,
                }
                # Ищем AI предсказание для этого product_id
                ai_pred = ai_predictions.get(inv_his.product_id)
                if ai_pred:
                    result_json['recommended_order'] = ai_pred.recommended_order
                    result_json['discrepancy'] = abs(inv_his.quantity - ai_pred.recommended_order)
                    result_json['prediction_confidence'] = ai_pred.confidence_score
                else:
                    result_json['recommended_order'] = 0
                    result_json['discrepancy'] = inv_his.quantity
                    result_json['prediction_confidence'] = None
                fileter_history.append(result_json)
            return fileter_history
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


    async def fetch_robots_last_hour_data(self):
        """
        Получает данные о роботах за последний час,
        делит время на интервалы и считает количество активных роботов.
        """
        # === 1. Время (за последний час) ===
        now = datetime.now(timezone.utc)
        hour_ago = now - timedelta(hours=1)  # ← реальный час

        # === 2. Получаем данные из БД ===
        history = db.get_filter_inventory_history(
            from_date=hour_ago,
            to_date=now
        )

        if not history:
            return {i: 0 for i in range(6)}

        # === 3. Разделяем час на 6 интервалов по 10 минут ===
        intervals = []
        start = hour_ago.replace(microsecond=0, tzinfo=timezone.utc)
        for i in range(6):
            s = start + timedelta(minutes=i * 10)
            e = s + timedelta(minutes=10)
            if e > now:
                e = now
            intervals.append((s, e))

        active_robots_by_slot = defaultdict(set)

        for item in history:
            raw_time = item.get('scanned_at')
            robot_id = item.get('robot_id')
            if not raw_time or not robot_id:
                continue

            # === Преобразуем время ===
            try:
                if isinstance(raw_time, datetime):
                    scanned_at = raw_time
                elif 'T' in raw_time:
                    scanned_at = datetime.fromisoformat(raw_time.replace('Z', '+00:00'))
                else:
                    scanned_at = datetime.strptime(raw_time, "%Y-%m-%d %H:%M:%S")
            except Exception:
                continue

            # === Делаем scanned_at aware (UTC) ===
            if scanned_at.tzinfo is None:
                scanned_at = scanned_at.replace(tzinfo=timezone.utc)

            # === Проверяем интервалы ===
            for idx, (s, e) in enumerate(intervals):
                if s <= scanned_at < e:
                    active_robots_by_slot[idx].add(robot_id)
                    break

        result = {i: len(active_robots_by_slot[i]) for i in range(6)}
        return result

db = DataBaseManager(settings.CONN_STR)

def hash_password(password: str) -> bytes:
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed

def verify_password(password: str, hashed_password: bytes) -> bool:
    try:
        password_bytes = password.encode('utf-8')
        return bcrypt.checkpw(password_bytes, hashed_password)
    except (ValueError, TypeError) as e:
        logging.error(f"Failed to verify password: {str(e)}")
        return False
