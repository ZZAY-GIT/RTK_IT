import pytest
from unittest.mock import patch, MagicMock, call
from datetime import datetime
from sqlalchemy.exc import IntegrityError
from db.DataBaseManager import DataBaseManager, verify_password, hash_password
from db.models import User, Robot, InventoryHistory, Product, AIPrediction
from settings import settings
from api.schemas import UserResponse, ProductResponse, RobotResponse


@pytest.mark.unit
class TestDataBaseManager:
    """Класс для тестирования методов DataBaseManager."""

    @pytest.fixture
    def db_manager(self):
        """Фикстура для создания экземпляра DataBaseManager с мок-движком."""
        with patch('db.DataBaseManager.create_engine') as mock_engine:
            mock_engine.return_value = MagicMock()
            db = DataBaseManager(settings.CONN_STR)
            db.engine = MagicMock()
            return db

    @pytest.fixture
    def mock_session(self, db_manager):
        """
        Фикстура для мока сессии SQLAlchemy.
        """
        mock_session_instance = MagicMock()
        
        # Создаем мок для вызываемого объекта (sessionmaker)
        mock_db_session_callable = MagicMock()
        mock_db_session_callable.return_value.__enter__.return_value = mock_session_instance
        mock_db_session_callable.return_value.__exit__.return_value = None
        
        # Заменяем DBSession в db_manager на наш мок
        db_manager.DBSession = mock_db_session_callable
        
        return mock_session_instance

    @pytest.fixture(autouse=True)
    def setup_mocked_time(self):
        """Фикстура для установки фиксированного времени в тестах."""
        with patch('db.DataBaseManager.datetime') as mocked_time:
            mocked_time.now.return_value = datetime(2025, 10, 26, 19, 30, 0)
            yield mocked_time

    # --- User Tests ---

    def test_add_user_success(self, db_manager, mock_session):
        """Тест успешного добавления пользователя."""
        email = "test@example.com"
        password = "password123"
        name = "Test User"
        role = "admin"
        
        # Настраиваем моки для запросов - пользователь не существует
        mock_session.query.return_value.filter.return_value.first.return_value = None
        
        with patch('db.DataBaseManager.hash_password') as mock_hash:
            mock_hash.return_value = b"hashed_password"
            
            # Создаем мок пользователя для возврата после коммита
            mock_user = MagicMock()
            mock_user.id = 1
            mock_user.email = email
            mock_user.name = name
            mock_user.role = role
            mock_user.created_at = datetime(2025, 10, 26, 19, 30, 0)
            
            # После коммита и refresh должен вернуться пользователь
            def refresh_side_effect(obj):
                if hasattr(obj, 'id'):
                    obj.id = 1
                    obj.email = email
                    obj.name = name
                    obj.role = role
            
            mock_session.refresh.side_effect = refresh_side_effect
            
            result = db_manager.add_user(email, password, name, role)
            
            # Проверяем, что пользователь был добавлен
            mock_session.add.assert_called_once()
            added_user = mock_session.add.call_args[0][0]
            assert added_user.email == email
            assert added_user.password_hash == b"hashed_password"
            assert added_user.name == name
            assert added_user.role == role
            
            mock_session.commit.assert_called_once()
            mock_session.refresh.assert_called_once_with(added_user)
            
            # Проверяем результат
            assert isinstance(result, UserResponse)
            assert result.email == email
            assert result.name == name
            assert result.role == role

    def test_add_user_already_exists(self, db_manager, mock_session):
        """Тест добавления пользователя, который уже существует."""
        email = "test@example.com"
        existing_user = MagicMock()
        existing_user.email = email
        mock_session.query.return_value.filter.return_value.first.return_value = existing_user
        
        result = db_manager.add_user(email, "password123", "Test User", "admin")
        
        assert result is None
        mock_session.add.assert_not_called()
        mock_session.commit.assert_not_called()

    def test_add_user_integrity_error(self, db_manager, mock_session):
        """Тест обработки IntegrityError при добавлении пользователя."""
        email = "test@example.com"
        mock_session.query.return_value.filter.return_value.first.return_value = None
        mock_session.commit.side_effect = IntegrityError("mock", "mock", "mock")
        
        with patch('db.DataBaseManager.hash_password') as mock_hash:
            mock_hash.return_value = b"hashed_password"
            result = db_manager.add_user(email, "password123", "Test User", "admin")
            
            assert result is None
            mock_session.rollback.assert_called_once()

    def test_get_user_found(self, db_manager, mock_session):
        """Тест получения существующего пользователя."""
        email = "test@example.com"
        mock_user = User(email=email, password_hash=b"hashed", name="Test User", role="admin")
        mock_session.query.return_value.filter.return_value.first.return_value = mock_user
        
        result = db_manager.get_user(email)
        
        assert result == mock_user
        mock_session.query.assert_called_once_with(User)

    def test_get_user_not_found(self, db_manager, mock_session):
        """Тест получения несуществующего пользователя."""
        email = "test@example.com"
        mock_session.query.return_value.filter.return_value.first.return_value = None
        
        result = db_manager.get_user(email)
        
        assert result is None
        mock_session.query.assert_called_once_with(User)

    def test_update_user_success(self, db_manager, mock_session):
        """Тест успешного обновления пользователя."""
        user_id = 1
        
        # Создаем мок пользователя
        mock_user = MagicMock()
        mock_user.id = user_id
        mock_user.email = "test@example.com"
        mock_user.name = "Old Name"
        mock_user.role = "user"
        mock_user.created_at = datetime(2025, 10, 26, 19, 30, 0)
        
        mock_session.query.return_value.filter.return_value.first.return_value = mock_user
        
        with patch('db.DataBaseManager.hash_password') as mock_hash:
            mock_hash.return_value = b"new_hashed_password"
            
            result = db_manager.update_user(user_id, name="New Name", password="newpass")
            
            # Проверяем, что поля были обновлены
            assert mock_user.name == "New Name"
            assert mock_user.password_hash == b"new_hashed_password"
            
            mock_session.commit.assert_called_once()
            mock_session.refresh.assert_called_once_with(mock_user)
            
            # Проверяем результат
            assert isinstance(result, UserResponse)
            assert result.name == "New Name"

    def test_update_user_not_found(self, db_manager, mock_session):
        """Тест обновления несуществующего пользователя."""
        user_id = 999
        mock_session.query.return_value.filter.return_value.first.return_value = None
        
        result = db_manager.update_user(user_id, name="New Name")
        
        assert result is None
        mock_session.commit.assert_not_called()

    def test_delete_user_success(self, db_manager, mock_session):
        """Тест успешного удаления пользователя."""
        mock_user = MagicMock()
        mock_session.query.return_value.filter.return_value.first.return_value = mock_user
        
        result = db_manager.delete_user(1)
        
        assert result is True
        mock_session.delete.assert_called_once_with(mock_user)
        mock_session.commit.assert_called_once()

    def test_delete_user_not_found(self, db_manager, mock_session):
        """Тест удаления несуществующего пользователя."""
        mock_session.query.return_value.filter.return_value.first.return_value = None
        
        result = db_manager.delete_user(999)
        
        assert result is False
        mock_session.delete.assert_not_called()

    # --- Product Tests ---

    def test_add_product_success(self, db_manager, mock_session):
        """Тест успешного добавления продукта."""
        # Настраиваем моки для генерации ID
        mock_max_product = MagicMock()
        mock_max_product.id = "TEL-0001"
        mock_session.query.return_value.filter.return_value.order_by.return_value.first.return_value = mock_max_product
        
        # Проверка существования продукта
        mock_session.query.return_value.filter.return_value.first.return_value = None
        
        result = db_manager.add_product(None, "Test Product", "Electronics", 10, 50)
        
        assert result == "TEL-0002"  # Следующий ID
        mock_session.add.assert_called_once()
        mock_session.commit.assert_called_once()

    def test_add_product_with_id_success(self, db_manager, mock_session):
        """Тест успешного добавления продукта с заданным ID."""
        product_id = "CUSTOM-123"
        
        # Мок для проверки существования ID
        mock_session.query.return_value.filter.return_value.first.return_value = None
        
        result = db_manager.add_product(product_id, "Custom Product", "Other", 5, 25)
        
        assert result == product_id
        mock_session.add.assert_called_once()
        mock_session.commit.assert_called_once()

    def test_get_all_products(self, db_manager, mock_session):
        """Тест получения всех продуктов."""
        # Создаем моки продуктов с правильными атрибутами
        mock_product1 = MagicMock()
        mock_product1.id = "TEL-0001"
        mock_product1.name = "Product 1"
        mock_product1.category = "A"
        mock_product1.min_stock = 10
        mock_product1.optimal_stock = 50
        
        mock_product2 = MagicMock()
        mock_product2.id = "TEL-0002"
        mock_product2.name = "Product 2"
        mock_product2.category = "B"
        mock_product2.min_stock = 5
        mock_product2.optimal_stock = 25
        
        mock_products = [mock_product1, mock_product2]
        mock_session.query.return_value.all.return_value = mock_products
        
        result = db_manager.get_all_products()
        
        assert len(result) == 2
        assert isinstance(result[0], ProductResponse)
        assert result[0].id == "TEL-0001"
        assert result[0].name == "Product 1"
        assert result[0].category == "A"
        assert result[0].min_stock == 10
        assert result[0].optimal_stock == 50

    # --- Robot Tests ---

    def test_add_robot_data_success(self, db_manager, mock_session):
        """Тест успешного добавления данных робота."""
        robot_data = {
            "robot_id": "ROB-001",
            "battery_level": 85,
            "timestamp": "2025-10-26T19:30:00Z",
            "location": {"zone": "A", "row": 1, "shelf": 2},
            "scan_results": [
                {"product_id": "PROD-001", "product_name": "Product 1", "quantity": 10, "status": "ok"}
            ]
        }
        
        # Создаем мок существующего робота (чтобы не создавать нового)
        mock_robot = MagicMock()
        mock_robot.id = "ROB-001"
        mock_robot.battery_level = 50  # старое значение
        mock_robot.status = "active"
        mock_robot.current_zone = None
        mock_robot.current_row = None
        mock_robot.current_shelf = None
        mock_robot.last_update = datetime(2025, 10, 26, 18, 30, 0)
        
        # Мокаем get_robot чтобы вернуть существующего робота
        with patch.object(db_manager, 'get_robot', return_value=mock_robot):
            # Мокаем get_product чтобы вернуть None (продукт не существует)
            with patch.object(db_manager, 'get_product', return_value=None):
                # Мокаем add_product чтобы вернуть ID продукта
                with patch.object(db_manager, 'add_product', return_value="PROD-001"):
                    
                    result = db_manager.add_robot_data(robot_data)
                    
                    assert result is True
                    
                    # Проверяем, что робот был обновлен
                    assert mock_robot.battery_level == 85
                    assert mock_robot.status == "active"  # 85 > 20, поэтому статус active
                    assert mock_robot.current_zone == "A"
                    assert mock_robot.current_row == 1
                    assert mock_robot.current_shelf == 2
                    
                    # Проверяем вызовы
                    db_manager.get_robot.assert_called_once_with("ROB-001")
                    db_manager.get_product.assert_called_once_with("PROD-001")
                    db_manager.add_product.assert_called_once()
                    
                    # Должны быть добавлены: записи инвентаря
                    assert mock_session.add.call_count >= 1
                    mock_session.commit.assert_called_once()

    def test_get_robot_response(self, db_manager, mock_session):
        """Тест получения ответа для робота."""
        robot_id = "RB-0001"
        mock_robot = MagicMock(
            id=robot_id, 
            status="active", 
            battery_level=90, 
            current_zone="A",
            current_row=1,
            current_shelf=2,
            last_update=datetime(2025, 10, 26, 19, 30, 0)
        )
        
        # Мокаем get_robot напрямую
        with patch.object(db_manager, 'get_robot', return_value=mock_robot):
            result = db_manager.get_robot_response(robot_id)
            
            db_manager.get_robot.assert_called_once_with(robot_id)
            assert isinstance(result, RobotResponse)
            assert result.id == robot_id
            assert result.status == "active"
            assert result.battery_level == 90

    def test_add_robot_data_success(self, db_manager, mock_session):
        """Тест успешного добавления данных робота."""
        robot_data = {
            "robot_id": "ROB-001",
            "battery_level": 85,
            "timestamp": "2025-10-26T19:30:00Z",
            "location": {"zone": "A", "row": 1, "shelf": 2},
            "scan_results": [
                {"product_id": "PROD-001", "product_name": "Product 1", "quantity": 10, "status": "ok"}
            ]
        }
        
        # Мокаем все зависимости
        with patch.object(db_manager, 'get_robot', return_value=None), \
             patch.object(db_manager, 'add_robot', return_value="ROB-001"), \
             patch.object(db_manager, 'get_product', return_value=None), \
             patch.object(db_manager, 'add_product', return_value="PROD-001"):
            
            result = db_manager.add_robot_data(robot_data)
            
            assert result is True
            db_manager.add_robot.assert_called_once()
            db_manager.add_product.assert_called_once()
            # Должны быть добавлены: робот + записи инвентаря
            assert mock_session.add.call_count >= 2
            mock_session.commit.assert_called_once()

    def test_add_robot_data_integrity_error(self, db_manager, mock_session):
        """Тест обработки IntegrityError при добавлении данных робота."""
        robot_data = {
            "robot_id": "ROB-001", 
            "battery_level": 50,
            "scan_results": []
        }
        
        # Настраиваем существующего робота
        mock_robot = MagicMock()
        mock_robot.battery_level = 50
        mock_robot.status = "active"
        mock_robot.current_zone = None
        mock_robot.current_row = None
        mock_robot.current_shelf = None
        mock_robot.last_update = datetime(2025, 10, 26, 19, 30, 0)
        
        with patch.object(db_manager, 'get_robot', return_value=mock_robot):
            mock_session.commit.side_effect = IntegrityError("mock", "mock", "mock")
            
            result = db_manager.add_robot_data(robot_data)
            
            assert result is False
            mock_session.rollback.assert_called_once()

    # --- AI Prediction Tests ---

    def test_add_ai_prediction_success(self, db_manager, mock_session):
        """Тест успешного добавления AI предсказаний."""
        predictions = [
            {"product_id": "TEL-0001", "days_until_stockout": 5, "recommended_order": 100},
            {"product_id": "TEL-0002", "days_until_stockout": 10, "recommended_order": 50}
        ]
        
        result = db_manager.add_ai_prediction(predictions)
        
        # Проверяем, что было 2 вызова add
        assert mock_session.add.call_count == 2
        mock_session.commit.assert_called_once()
        
        # Проверяем результат
        assert len(result) == 2
        assert result[0]['product_id'] == "TEL-0001"
        assert result[0]['days_until_stockout'] == 5
        assert result[0]['recommended_order'] == 100
        assert 'created_at' in result[0]
        assert isinstance(result[0]['created_at'], str)

    def test_add_ai_prediction_empty_list(self, db_manager, mock_session):
        """Тест добавления пустого списка предсказаний."""
        result = db_manager.add_ai_prediction([])
        
        assert result == []
        mock_session.add.assert_not_called()
        mock_session.commit.assert_not_called()

    # def test_get_ai_predictions_found(self, db_manager, mock_session):
    #     """Тест получения AI предсказаний, когда они есть."""
    #     mock_prediction = MagicMock()
    #     mock_prediction.id = 1
    #     mock_prediction.product_id = "TEL-0001"
    #     mock_prediction.prediction_date = datetime(2025, 10, 26, 19, 30, 0)
    #     mock_prediction.days_until_stockout = 5
    #     mock_prediction.recommended_order = 100
    #     mock_prediction.confidence_score = 0.8
    #     mock_prediction.created_at = datetime(2025, 10, 26, 19, 25, 0)

    #     mock_session.query.return_value.order_by.return_value.limit.return_value.all.return_value = [mock_prediction]

    #     result = db_manager.get_ai_predictions()

    #     assert result is not None
    #     assert result["id"] == 1
    #     assert result["product_id"] == "TEL-0001"
    #     assert result["prediction_date"] == "2025-10-26T19:30:00"
    #     assert result["days_until_stockout"] == 5
    #     assert result["recommended_order"] == 100
    #     assert result["confidence_score"] == 0.8
    #     assert result["created_at"] == "2025-10-26T19:25:00"
        
    # def test_get_ai_predictions_not_found(self, db_manager, mock_session):
    #     """Тест получения AI предсказаний, когда их нет."""
    #     mock_session.query.return_value.order_by.return_value.limit.return_value.all.return_value = []
            
    #     result = db_manager.get_ai_predictions()
            
    #     assert result is None

        # --- Utility Tests ---

    def test_get_active_robots(self, db_manager, mock_session):
        """Тест получения количества активных роботов."""
        # Настраиваем моки для count запросов
        active_count_mock = MagicMock()
        active_count_mock.count.return_value = 5
        
        total_count_mock = MagicMock()
        total_count_mock.count.return_value = 10
        
        # Настраиваем side_effect для последовательных вызовов
        mock_session.query.side_effect = [active_count_mock, total_count_mock]
        active_count_mock.filter.return_value = active_count_mock
        
        active_count, total_count = db_manager.get_active_robots()
        
        assert active_count == 5
        assert total_count == 10

    def test_average_battery_charge(self, db_manager, mock_session):
        """Тест получения среднего заряда батареи роботов."""
        mock_session.query.return_value.filter.return_value.scalar.return_value = 75.5
        
        result = db_manager.average_battery_charge()
        
        assert result == 75.5
        mock_session.query.assert_called_once()

    def test_process_csv_inventory_import_success(self, db_manager, mock_session):
        """Тест успешного импорта инвентаря из CSV."""
        csv_content = "product_id;product_name;quantity;zone;row;shelf\nPROD-1;Product 1;10;A;1;1"
        
        with patch('pandas.read_csv') as mock_read_csv:
            # Создаем мок DataFrame
            mock_df = MagicMock()
            mock_df.columns = ['product_id', 'product_name', 'quantity', 'zone', 'row', 'shelf']
            mock_df.where.return_value.to_dict.return_value = [
                {
                    'product_id': 'PROD-1', 
                    'product_name': 'Product 1', 
                    'quantity': 10, 
                    'zone': 'A', 
                    'row': 1, 
                    'shelf': 1,
                    'date': None
                }
            ]
            mock_read_csv.return_value = mock_df
            
            # Мок для проверки существования продукта
            mock_session.query.return_value.filter.return_value.first.return_value = None
            
            result = db_manager.process_csv_inventory_import(csv_content)
            
            assert result['status'] == 'success'
            assert result['records_processed'] == 1
            mock_session.add.assert_called()
            mock_session.commit.assert_called_once()

    def test_process_csv_inventory_import_missing_columns(self, db_manager, mock_session):
        """Тест импорта CSV с отсутствующими колонками."""
        csv_content = "name;quantity\nProduct 1;10"
        
        with patch('pandas.read_csv') as mock_read_csv:
            mock_df = MagicMock()
            mock_df.columns = ['name', 'quantity']  # Отсутствуют обязательные колонки
            mock_read_csv.return_value = mock_df
            
            result = db_manager.process_csv_inventory_import(csv_content)
            
            assert result['status'] == 'error'
            assert 'Missing required columns' in result['error']
            mock_session.add.assert_not_called()

    # --- Password Hashing Tests ---

    def test_verify_password_success(self):
        """Тест успешной проверки пароля."""
        password = "password123"
        hashed_password = hash_password(password)
        
        result = verify_password(password, hashed_password)
        
        assert result is True

    def test_verify_password_failure(self):
        """Тест неуспешной проверки пароля."""
        password = "wrong_password"
        hashed_password = hash_password("correct_password")
        
        result = verify_password(password, hashed_password)
        
        assert result is False


if __name__ == "__main__":
    pytest.main()