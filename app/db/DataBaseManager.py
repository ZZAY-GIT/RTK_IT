from collections import defaultdict
from app.db.models import User, Robot, Product, InventoryHistory, AIPrediction
from app.db.base import Base
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy import create_engine, func, desc, select
import logging
from sqlalchemy.exc import IntegrityError
from datetime import datetime, timedelta, timezone
from typing import List, Dict
import pandas as pd
import io
from api.schemas import (
    UserResponse,
    ProductResponse,
    RobotResponse,
    PredictResponse,
)
from app.core.settings import settings
from app.core.security import hash_password


class DataBaseManager:
    def __init__(self, conn_str: str):
        self.conn_str = conn_str   
        self.engine = create_async_engine(self.conn_str, echo=False)
        self.DBSession = async_sessionmaker(bind=self.engine, class_=AsyncSession, expire_on_commit=False)
        self.User = User
        self.Robot = Robot
        self.Product = Product
        self.InventoryHistory = InventoryHistory
        self.AIPrediction = AIPrediction

    async def create_tables(self):
        async with self.engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        

    # Методы User
    async def add_user(self, email: str, password: str, name: str, role: str):
        password_hash = hash_password(password)
        async with self.DBSession() as _s:
            existing_user = await _s.execute(select(self.User).filter(self.User.email == email))
            existing_user = existing_user.scalar_one_or_none()
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
                await _s.commit()
                await _s.refresh(new_user)  # Важно!

                logging.info(f"Successfully created user with email {email}")
                
                return UserResponse(
                    id=new_user.id,
                    email=new_user.email,
                    name=new_user.name,
                    role=new_user.role,
                )
            except Exception as e:
                await _s.rollback()
                return None
            
    async def get_user(self, email: str):
        async with self.DBSession() as _s:
            # Проверяем, существует ли пользователь с таким email
            result = await _s.execute(select(self.User).filter(self.User.email == email))
            existing_user = result.scalar_one_or_none()
            if existing_user:
                logging.info(f"User with email {email} found")
                return existing_user
            else:
                logging.info(f"User with email {email} not found")
                return None

    async def get_user_by_id(self, user_id: int):
        async with self.DBSession() as _s:
            result = await _s.execute(select(self.User).filter(self.User.id == user_id))
            user = result.scalar_one_or_none()
            if user:
                logging.info(f"User with id {user_id} found")
                return user
            else:
                logging.info(f"User with id {user_id} not found")
                return None

    async def get_user_password(self, email: str) -> str | None:
        async with self.DBSession() as _s:
            result = await _s.execute(
                select(self.User.password_hash)
                .filter(self.User.email == email)
            )
            record = result.scalar_one_or_none()
        if not record:
            return None
        return record

    async def get_all_users(self):
        async with self.DBSession() as _s:
            result = await _s.execute(select(self.User))
            users = result.scalars().all()
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
    
    async def update_user(self, user_id: int, **kwargs):
        async with self.DBSession() as _s:
            result = await _s.execute(select(self.User).filter(self.User.id == user_id))
            user = result.scalar_one_or_none()
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
                await _s.commit()
                await _s.refresh(user)  # Обновляем объект из базы
                logging.info(f"Successfully updated user with id {user_id}")

                # Возвращаем UserResponse вместо SQLAlchemy объекта
                return UserResponse(
                    id=user.id,
                    email=user.email,
                    name=user.name,
                    role=user.role
                )
            except IntegrityError:
                await _s.rollback()
                logging.error(f"Failed to update user with id {user_id}: IntegrityError")
                return None

    async def delete_user(self, user_id: int):
        async with self.DBSession() as _s:
            result = await _s.execute(select(self.User).filter(self.User.id == user_id))
            user = result.scalar_one_or_none()
            if not user:
                logging.info(f"User with id {user_id} not found")
                return False

            await _s.delete(user)
            try:
                await _s.commit()
                logging.info(f"Successfully deleted user with id {user_id}")
                return True
            except IntegrityError:
                await _s.rollback()
                logging.error(f"Failed to delete user with id {user_id}: IntegrityError")
                return False

    # Методы Product
    async def add_product(self, id, name, category, min_stock, optimal_stock):
        async with self.DBSession() as _s:
            # Ищем максимальный существующий ID с префиксом TEL-
            result = await _s.execute(
                select(self.Product)
                .filter(self.Product.id.like('TEL-%'))
                .order_by(self.Product.id.desc())
                .limit(1)
            )
            max_id_product = result.scalar_one_or_none()

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
            result = await _s.execute(select(self.Product).filter(self.Product.id == new_id))
            existing_product = result.scalar_one_or_none()
            if existing_product:
                # Если существует, ищем следующий доступный номер
                while existing_product:
                    new_number += 1
                    new_id = f"TEL-{new_number:04d}"
                    result = await _s.execute(select(self.Product).filter(self.Product.id == new_id))
                    existing_product = result.scalar_one_or_none()

            new_product = self.Product(
                id=id if id else new_id,
                name=name,
                category=category,
                min_stock=min_stock,
                optimal_stock=optimal_stock
            )
            _s.add(new_product)
            try:
                await _s.commit()
                return id if id else new_id  # Возвращаем сгенерированный ID
            except IntegrityError:
                await _s.rollback()
                return False

    async def get_product(self, product_id: str):
        async with self.DBSession() as _s:
            result = await _s.execute(select(self.Product).filter(self.Product.id == product_id))
            product = result.scalar_one_or_none()
            if product:
                logging.info(f"Product with id {product_id} found")
                return product
            else:
                logging.info(f"Product with id {product_id} not found")
                return None

    async def get_all_products(self):
        async with self.DBSession() as _s:
            result = await _s.execute(select(self.Product))
            products = result.scalars().all()
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
    
    async def update_product(self, product_id: str, **kwargs):
        async with self.DBSession() as _s:
            result = await _s.execute(select(self.Product).filter(self.Product.id == product_id))
            product = result.scalar_one_or_none()
            if not product:
                logging.info(f"Product with id {product_id} not found")
                return None

            # Обновляем только переданные поля
            for key, value in kwargs.items():
                if hasattr(product, key) and value is not None:
                    setattr(product, key, value)

            try:
                await _s.commit()
                await _s.refresh(product)  # Обновляем объект из БД
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
                await _s.rollback()
                logging.error(f"Failed to update product with id {product_id}: IntegrityError")
                return None

    async def delete_product(self, product_id: str):
        async with self.DBSession() as _s:
            result = await _s.execute(select(self.Product).filter(self.Product.id == product_id))
            product = result.scalar_one_or_none()
            if not product:
                logging.info(f"Product with id {product_id} not found")
                return False

            await _s.delete(product)
            try:
                await _s.commit()
                logging.info(f"Successfully deleted product with id {product_id}")
                return True
            except IntegrityError:
                await _s.rollback()
                logging.error(f"Failed to delete product with id {product_id}: IntegrityError")
                return False

    # Методы Robot
    async def get_robot(self, robot_id: str):
        async with self.DBSession() as _s:
            result = await _s.execute(select(self.Robot).filter(self.Robot.id == robot_id))
            robot = result.scalar_one_or_none()
            if robot:
                logging.info(f"Robot with id {robot_id} found")
                # Возвращаем RobotResponse с правильными полями
                return robot
            else:
                logging.info(f"Robot with id {robot_id} not found")
                return None
            
    async def get_robot_response(self, robot_id: str):
        robot = await self.get_robot(robot_id)
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

    async def add_robot(self, id: str, status: str, battery_level: int, current_zone: str = "", current_row: int = 0, current_shelf: int = 0):
        async with self.DBSession() as _s:
            # Ищем максимальный существующий ID с префиксом RB-
            result = await _s.execute(
                select(self.Robot)
                .filter(self.Robot.id.like('RB-%'))
                .order_by(self.Robot.id.desc())
                .limit(1) # <-- ГАРАНТИРУЕМ, ЧТО БУДЕТ ТОЛЬКО ОДНА ЗАПИСЬ
            )
            max_id_robot = result.scalar_one_or_none()

            # Генерируем новый ID
            if max_id_robot:
                last_number = int(max_id_robot.id.split('-')[1])
                new_number = last_number + 1
            else:
                new_number = 1

            new_id = f"RB-{new_number:04d}"

            # Проверяем существование (на всякий случай)
            result = await _s.execute(select(self.Robot).filter(self.Robot.id == new_id))
            existing_robot = result.scalar_one_or_none()
            if existing_robot:
                if id == existing_robot.id:
                    id = new_id
                while existing_robot:
                    new_number += 1
                    new_id = f"RB-{new_number:04d}"
                    result = await _s.execute(select(self.Robot).filter(self.Robot.id == new_id))
                    existing_robot = result.scalar_one_or_none()
                    
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
                await _s.commit()
                return id if id else new_id
            except IntegrityError:
                await _s.rollback()
                return False

    async def get_all_robots(self):
        async with self.DBSession() as _s:
            result = await _s.execute(select(self.Robot))
            robots = result.scalars().all()
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

    async def update_robot(self, robot_id: str, **kwargs):
        async with self.DBSession() as _s:
            result = await _s.execute(select(self.Robot).filter(self.Robot.id == robot_id))
            robot = result.scalar_one_or_none()
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
                await _s.commit()
                await _s.refresh(robot)
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
                await _s.rollback()
                logging.error(f"Failed to update robot with id {robot_id}: IntegrityError")
                return None

    async def delete_robot(self, robot_id: str):
        async with self.DBSession() as _s:
            result = await _s.execute(select(self.Robot).filter(self.Robot.id == robot_id))
            robot = result.scalar_one_or_none()
            if not robot:
                logging.info(f"Robot with id {robot_id} not found")
                return False

            await _s.delete(robot)
            try:
                await _s.commit()
                logging.info(f"Successfully deleted robot with id {robot_id}")
                return True
            except IntegrityError:
                await _s.rollback()
                logging.error(f"Failed to delete robot with id {robot_id}: IntegrityError")
                return False

    #Работа робота
    async def add_robot_data(self, robot_data):
        async with self.DBSession() as _s:
            robot_id = robot_data.get("robot_id", None)
            battery_level = robot_data.get("battery_level", None)
            timestamp_str = robot_data.get("timestamp", None)
            
            # --- ГАРАНТИРОВАННОЕ СОЗДАНИЕ DATETIME С ZONE ---
            # Создаем scanned_at, гарантированно с временной зоной UTC
            if timestamp_str:
                try:
                    scanned_at = datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
                    # Если по какой-то причине tzinfo не применилось, добавляем его принудительно
                    if scanned_at.tzinfo is None:
                        scanned_at = scanned_at.replace(tzinfo=timezone.utc)
                except ValueError:
                    # Если формат строки неверный, используем текущее время в UTC
                    scanned_at = datetime.now(timezone.utc)
            else:
                scanned_at = datetime.now(timezone.utc)

            # Определяем статус на основе уровня батареи
            robot_status = "active"
            if battery_level is not None:
                if battery_level < 20:
                    robot_status = "low_battery"
                elif battery_level == 0:
                    robot_status = "inactive"

            # Ищем робота в ТЕКУЩЕЙ сессии
            result = await _s.execute(select(self.Robot).filter(self.Robot.id == robot_id))
            robot = result.scalar_one_or_none()

            if not robot:
                # Создаем робота в ТЕКУЩЕЙ сессии
                new_robot = self.Robot(
                    id=robot_id,
                    status=robot_status,
                    battery_level=battery_level,
                    last_update=datetime.now(timezone.utc) # <-- ГАРАНТИЯ UTC
                )
                _s.add(new_robot)
                robot = new_robot

            # Обновляем существующего робота
            robot.battery_level = battery_level
            robot.status = robot_status
            robot.last_update = datetime.now(timezone.utc) # <-- ГАРАНТИЯ UTC

            # Получаем location
            robot_location = robot_data.get("location", None)
            zone = robot_location.get("zone", None) if robot_location else None
            row_number = robot_location.get("row", None) if robot_location else None
            shelf_number = robot_location.get("shelf", None) if robot_location else None

            # Обновляем текущую позицию робота
            if zone is not None:
                robot.current_zone = zone
            if row_number is not None:
                robot.current_row = row_number
            if shelf_number is not None:
                robot.current_shelf = shelf_number

            # Обрабатываем scan_results
            scan_results = robot_data.get("scan_results", [])
            for scan_result in scan_results:
                product_id = scan_result.get("product_id", None)
                product_name = scan_result.get("product_name", None)
                quantity = scan_result.get("quantity", None)
                status = scan_result.get("status", None)

                if product_id and product_name:
                    result = await _s.execute(select(self.Product).filter(self.Product.id == product_id))
                    product = result.scalar_one_or_none()

                    if not product:
                        new_product = self.Product(
                            id=product_id,
                            name=product_name,
                            category=None,
                            min_stock=10,
                            optimal_stock=100
                        )
                        _s.add(new_product)
                    else:
                        if product.name != product_name:
                            product.name = product_name

                new_inventory_history = self.InventoryHistory(
                    robot_id=robot_id,
                    zone=zone,
                    row_number=row_number,
                    shelf_number=shelf_number,
                    product_id=product_id,
                    quantity=quantity,
                    status=status,
                    scanned_at=scanned_at,
                    created_at=datetime.now(timezone.utc)
                )
                _s.add(new_inventory_history)

            try:
                await _s.commit()
                logging.info(f"Successfully processed robot data for {robot_id}")
                return True
            except Exception as e:
                await _s.rollback()
                logging.error(f"Failed to process robot data for {robot_id}: {str(e)}")
                return False
            
    async def get_current_state(self):
        """Получает текущее состояние для dashboard"""
        async with self.DBSession() as _s:
            # Активные роботы
            active_robots_count, total_robots = await self.get_active_robots()
            # Средний заряд батареи
            avg_battery = await self.average_battery_charge() or 0
    
            # Проверено сегодня
            today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
            result = await _s.execute(
                select(self.InventoryHistory)
                .filter(self.InventoryHistory.scanned_at >= today_start)
            )
            scanned_today = len(result.scalars().all())
    
            # Критические остатки
            result = await _s.execute(
                select(self.InventoryHistory)
                .filter(self.InventoryHistory.status == 'CRITICAL')
                .filter(self.InventoryHistory.scanned_at >= today_start)
            )
            critical_stocks = len(result.scalars().all())
    
            # Последние сканирования (20 записей) с JOIN к продуктам
            result = await _s.execute(
                select(self.InventoryHistory, self.Product.name.label('product_name'))
                .join(self.Product, self.InventoryHistory.product_id == self.Product.id)
                .order_by(self.InventoryHistory.scanned_at.desc())
                .limit(20)
            )
            recent_scans = result.all()
    
            # Текущие роботы
            result = await _s.execute(select(self.Robot))
            robots = result.scalars().all()
    
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
                        "last_update": robot.last_update.strftime("%H:%M:%S %d.%m.%Y") if robot.last_update else None,
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
                        "scanned_at": scan.scanned_at.strftime("%H:%M:%S %d.%m.%Y") if scan.scanned_at else None
                    }
                    for scan, product_name in recent_scans  # Распаковываем кортеж
                ]
            }
        
    async def process_csv_inventory_import(self, csv_content: str) -> Dict[str, any]:
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
            
            async with self.DBSession() as _s:
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
                        result = await _s.execute(select(self.Product).filter(self.Product.id == product_id))
                        product = result.scalar_one_or_none()
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
                    await _s.commit()
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
                    await _s.rollback()
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
    async def process_csv_file(self, file_csv):
        """Обрабатывает CSV файл и добавляет данные в базу"""
        try:
            # Читаем файл
            contents = file_csv.file.read()
            csv_text = contents.decode('utf-8')
            
            # Используем StringIO для pandas
            df = pd.read_csv(io.StringIO(csv_text), delimiter=';')
            
            # Передаем DataFrame напрямую, а не records
            return await self.add_robot_data_csv_from_dataframe(df)
            
        except Exception as e:
            logging.error(f"Error processing CSV file: {e}")
            raise

    async def add_robot_data_csv_from_dataframe(self, df):
        """Добавляет записи из DataFrame в базу данных"""
        async with self.DBSession() as _s:
            success_count = 0
            total_records = len(df)
            errors = []

            default_status = "NORMAL"
            
            for index, row in df.iterrows():
                try:
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
                            scanned_at = datetime.now()
                    else:
                        scanned_at = datetime.now()
                    
                    # Проверяем обязательные поля
                    if not product_id:
                        errors.append(f"Row {index+1}: Missing product_id")
                        continue
                    
                    # 1. ПРОВЕРЯЕМ/СОЗДАЕМ ПРОДУКТ
                    result = await _s.execute(select(self.Product).filter(self.Product.id == product_id))
                    existing_product = result.scalar_one_or_none()
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
                        except Exception as e:
                            errors.append(f"Row {index+1}: Failed to create product {product_id}: {str(e)}")
                            continue
                    else:
                        # Обновляем имя продукта если оно изменилось
                        if existing_product.name != product_name:
                            existing_product.name = product_name
                    
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
                    
                    
                except Exception as e:
                    error_msg = f"Row {index+1}: {str(e)}"
                    errors.append(error_msg)
                    logging.error(f"Error with row {index}: {e}")
                    continue
            
            try:
                await _s.commit()
                result = {
                    "status": "success", 
                    "records_processed": success_count,
                    "total_records": total_records,
                    "message": f"Successfully imported {success_count} inventory records"
                }
                if errors:
                    result["errors"] = errors
                return result
                
            except IntegrityError as e:
                await _s.rollback()

    async def add_ai_prediction(self, predictions: List[Dict]):
        """
        Добавляет предсказания AI в таблицу ai_predictions.
        Если 'created_at' отсутствует, генерирует его автоматически.
        """
        if not predictions:
            logging.warning("Received empty predictions list, nothing to save.")
            return []

        async with self.DBSession() as _s:
            saved_predictions_data = []

            for prediction in predictions:
                product_id = prediction.get("product_id")
                days_until_stockout = prediction.get("days_until_stockout")
                recommended_order = prediction.get("recommended_order")
                created_at_str = prediction.get("created_at") or datetime.now()
                if created_at_str:
                    # Если дата пришла в запросе, парсим строку в объект datetime
                    try:
                        prediction_date = datetime.fromisoformat(created_at_str)
                    except ValueError:
                        # Если строка невалидна, используем текущую дату и логируем предупреждение
                        logging.warning(f"Invalid date format for product {product_id}: {created_at_str}. Using current time.")
                        prediction_date = datetime.now()
                else:
                    # Если даты нет в запросе, генерируем её
                    prediction_date = datetime.now()

                new_prediction = self.AIPrediction(
                    product_id=product_id,
                    days_until_stockout=days_until_stockout,
                    recommended_order=recommended_order,
                    confidence_score=0.75,
                    prediction_date=prediction_date
                )
                _s.add(new_prediction)

                saved_predictions_data.append({
                    "product_id": product_id,
                    "days_until_stockout": days_until_stockout,
                    "recommended_order": recommended_order,
                    "created_at": prediction_date.isoformat() # <-- Всегда будет строка
                })
                logging.info(f"Added AI prediction for product {product_id}")

            try:
                await _s.commit()
                logging.info(f"Successfully added {len(predictions)} AI predictions.")
                return saved_predictions_data
            except IntegrityError as e:
                await _s.rollback()
                logging.error(f"Failed to add AI predictions: IntegrityError - {str(e)}")
                return None

    async def get_data_for_predict(self):
        current_date = datetime.now().date()
        to_date = current_date + timedelta(days=1) 
        from_date = current_date - timedelta(days=3)
        
        historical_data = await self.get_filter_inventory_history(
            from_date=from_date,
            to_date=to_date,
            status="CRITICAL",
            limit=100
        )
        
        if not historical_data:
            logging.info("No critical inventory data found for prediction.")
            return PredictResponse(predictions=[], confidence=0.0)

        inventory_data = await self.get_products_unique(historical_data)
        if not inventory_data:
            logging.info("No unique products found in critical inventory.")
            return PredictResponse(predictions=[], confidence=0.0)
        return inventory_data, historical_data
    
    # def get_ai_predictions(self):
    #     with self.DBSession() as _s:
    #         prediction = _s.query(self.AIPrediction).order_by(self.AIPrediction.prediction_date.desc()).limit(10).all()
    #         if prediction:
    #             logging.info(f"Found latest prediction for product_id: {prediction.product_id}, date: {prediction.prediction_date}")
    #             return {
    #                 "id": prediction.id,
    #                 "product_id": prediction.product_id,
    #                 "prediction_date": prediction.prediction_date.isoformat() if prediction.prediction_date else None,
    #                 "days_until_stockout": prediction.days_until_stockout,
    #                 "recommended_order": prediction.recommended_order,
    #                 "confidence_score": float(prediction.confidence_score) if prediction.confidence_score else None,
    #                 "created_at": prediction.created_at.isoformat() if prediction.created_at else None
    #             }
    #         else:
    #             logging.info(f"Entry not found")
    #             return None

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


    async def get_products_unique(self, historical_data):
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
    async def get_filter_inventory_history(self, from_date=None, to_date=None, zone=None, shelf=None, status=None, category=None, limit=None):
        async with self.DBSession() as _s:
            # Базовый запрос для inventory_history с JOIN к products
            query = select(InventoryHistory, Product.name.label('product_name')).join(Product, InventoryHistory.product_id == Product.id)

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
            if limit is not None:
                query = query.limit(limit)
            filtered_history = []
            # Получаем все записи inventory_history с именами продуктов
            result = await _s.execute(query)
            records = result.all()
            # Собираем все product_id для batch запроса к AI predictions
            product_ids = [inv_his.product_id for inv_his, product_name in records if inv_his.product_id]
            # Получаем все AI predictions для этих product_ids одним запросом
            ai_predictions = {}
            if product_ids:
                predictions_query = select(AIPrediction).filter(AIPrediction.product_id.in_(product_ids))
                predictions_result = await _s.execute(predictions_query)
                predictions = predictions_result.scalars().all()
                
                # Группируем predictions по product_id, берем последнее по дате
                for pred in predictions:
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
                filtered_history.append(result_json)
            return filtered_history
    # Сводка количества активных роботов, возвращает кортеж формата (n активных роботов, m всего роботов)
    async def get_active_robots(self): # Не проверено
        async with self.DBSession() as _s:
            result = await _s.execute(select(Robot).filter(Robot.status == 'active'))
            active_robots_count = len(result.scalars().all())
            
            result = await _s.execute(select(Robot))
            count_robots = len(result.scalars().all())
            return (active_robots_count, count_robots)

    # Средний заряд батареи роботов, возвращает чило
    async def average_battery_charge(self):
        async with self.DBSession() as _s:
            result = await _s.execute(
                select(func.avg(Robot.battery_level))
                .filter(Robot.status == "active")
            )
            avg_battery = result.scalar()
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
        history = await self.get_filter_inventory_history(
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

    async def get_activity_history(self):
        """
        Форматирует данные из fetch_robots_last_hour_data в формат для фронтенда.
        """
        raw_data = await self.fetch_robots_last_hour_data()
        
        now = datetime.now()
        hour_ago = now - timedelta(hours=1)
        
        activity_history = []
        
        for i in range(6):
            start_time = hour_ago + timedelta(minutes=i * 10)
            end_time = start_time + timedelta(minutes=10)
            if end_time > now:
                end_time = now
            
            # Используем end_time как точку для timestamp
            timestamp = int(end_time.timestamp() * 1000)  # JS-style timestamp in ms
            time_display = end_time.strftime('%d.%m.%Y %H:%M:%S')  # Соответствует formatDateTime
            
            count = raw_data[i]
            
            activity_history.append({
                'timestamp': timestamp,
                'timeDisplay': time_display,
                'count': count
            })
        
        return activity_history

db = DataBaseManager(settings.CONN_STR)
