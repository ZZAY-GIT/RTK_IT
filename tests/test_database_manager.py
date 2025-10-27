import pytest
from unittest.mock import patch, MagicMock
from datetime import datetime
from sqlalchemy.exc import IntegrityError
from db.DataBaseManager import DataBaseManager, verify_password, hash_password
from db.models import User, Robot, InventoryHistory, Product, AIPrediction
from settings import settings


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
            db.DBSession = MagicMock()
            return db

    @pytest.fixture
    def mock_session(self, db_manager):
        """Фикстура для мока сессии SQLAlchemy."""
        mock_session = MagicMock()
        db_manager.DBSession.return_value.__enter__.return_value = mock_session
        return mock_session

    @pytest.fixture(autouse=True)
    def setup_mocked_time(self):
        """Фикстура для установки фиксированного времени в тестах."""
        with patch('db.DataBaseManager.datetime') as mocked_time:
            mocked_time.now.return_value = datetime(2025, 10, 26, 19, 30, 0)
            yield mocked_time

    def test_add_user_success(self, db_manager, mock_session):
        """Тест успешного добавления пользователя."""
        email = "test@example.com"
        password = "password123"
        name = "Test User"
        role = "admin"
        
        mock_session.query.return_value.filter.return_value.first.return_value = None
        mock_session.commit.return_value = None
        
        with patch('db.DataBaseManager.hash_password') as mock_hash:
            mock_hash.return_value = b"hashed_password"
            result = db_manager.add_user(email, password, name, role)
            
            mock_session.add.assert_called_once()
            assert result.email == email
            assert result.password_hash == b"hashed_password"
            assert result.name == name
            assert result.role == role
            mock_session.commit.assert_called_once()

    def test_add_user_already_exists(self, db_manager, mock_session):
        """Тест добавления пользователя, который уже существует."""
        email = "test@example.com"
        mock_session.query.return_value.filter.return_value.first.return_value = User(
            email=email, password_hash=b"hashed", name="Existing", role="viewer"
        )
        
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
        mock_session.query.assert_called_once()

    def test_get_user_not_found(self, db_manager, mock_session):
        """Тест получения несуществующего пользователя."""
        email = "test@example.com"
        mock_session.query.return_value.filter.return_value.first.return_value = None
        
        result = db_manager.get_user(email)
        assert result is None
        mock_session.query.assert_called_once()

    def test_get_user_password_found(self, db_manager, mock_session):
        """Тест получения пароля существующего пользователя."""
        email = "test@example.com"
        mock_user = User(email=email, password_hash=b"hashed", name="Test User", role="admin")
        mock_session.query.return_value.filter.return_value.first.return_value = mock_user
        
        result = db_manager.get_user_password(email)
        assert result == b"hashed"
        mock_session.query.assert_called_once()

    def test_get_user_password_not_found(self, db_manager, mock_session):
        """Тест получения пароля несуществующего пользователя."""
        email = "test@example.com"
        mock_session.query.return_value.filter.return_value.first.return_value = None
        
        result = db_manager.get_user_password(email)
        assert result is None
        mock_session.query.assert_called_once()

    def test_add_robot_data_success(self, db_manager, mock_session):
        """Тест успешного добавления данных робота."""
        robot_data = {
            "robot_id": "ROB-001",
            "timestamp": datetime(2025, 10, 26, 19, 30, 0),
            "location": {"zone": "A", "row": 1, "shelf": 2},
            "scan_results": [
                {"product_id": "PROD-001", "quantity": 10, "status": "ok"},
                {"product_id": "PROD-002", "quantity": 5, "status": "low"}
            ]
        }
        mock_session.commit.return_value = None
        
        result = db_manager.add_robot_data(robot_data)
        assert result is True
        assert mock_session.add.call_count == 2
        mock_session.commit.assert_called_once()

    def test_add_robot_data_integrity_error(self, db_manager, mock_session):
        """Тест обработки IntegrityError при добавлении данных робота."""
        robot_data = {
            "robot_id": "ROB-001",
            "timestamp": datetime(2025, 10, 26, 19, 30, 0),
            "location": {"zone": "A", "row": 1, "shelf": 2},
            "scan_results": [{"product_id": "PROD-001", "quantity": 10, "status": "ok"}]
        }
        mock_session.commit.side_effect = IntegrityError("mock", "mock", "mock")
        
        result = db_manager.add_robot_data(robot_data)
        assert result is False
        mock_session.rollback.assert_called_once()

    def test_get_active_robots(self, db_manager, mock_session):
        """Тест получения количества активных роботов."""
        mock_session.query.return_value.filter.return_value.count.return_value = 5
        mock_session.query.return_value.count.return_value = 10
        
        result = db_manager.get_active_robots()
        assert result == (5, 10)
        mock_session.query.assert_called()

    def test_average_battery_charge(self, db_manager, mock_session):
        """Тест получения среднего заряда батареи роботов."""
        mock_session.query.return_value.scalar.return_value = 75.5
        
        result = db_manager.average_battery_charge()
        assert result == 75.5
        mock_session.query.assert_called_once()

    def test_add_robot_success(self, db_manager, mock_session):
        """Тест успешного добавления робота."""
        robot_id = "ROB-001"
        mock_session.query.return_value.filter.return_value.first.return_value = None
        mock_session.commit.return_value = None
        
        result = db_manager.add_robot(robot_id, status="active", battery_level=100)
        assert result.id == robot_id
        assert result.status == "active"
        assert result.battery_level == 100
        mock_session.add.assert_called_once()
        mock_session.commit.assert_called_once()

    def test_add_robot_already_exists(self, db_manager, mock_session):
        """Тест добавления робота, который уже существует."""
        robot_id = "ROB-001"
        mock_robot = Robot(id=robot_id, status="active", battery_level=100)
        mock_session.query.return_value.filter.return_value.first.return_value = mock_robot
        
        result = db_manager.add_robot(robot_id)
        assert result == mock_robot
        mock_session.add.assert_not_called()
        mock_session.commit.assert_not_called()

    def test_add_robot_integrity_error(self, db_manager, mock_session):
        """Тест обработки IntegrityError при добавлении робота."""
        robot_id = "ROB-001"
        mock_session.query.return_value.filter.return_value.first.return_value = None
        mock_session.commit.side_effect = IntegrityError("mock", "mock", "mock")
        
        result = db_manager.add_robot(robot_id)
        assert result is None
        mock_session.rollback.assert_called_once()

    def test_get_robot_found(self, db_manager, mock_session):
        """Тест получения существующего робота."""
        robot_id = "ROB-001"
        mock_robot = Robot(id=robot_id, status="active", battery_level=100)
        mock_session.query.return_value.filter.return_value.first.return_value = mock_robot
        
        result = db_manager.get_robot(robot_id)
        assert result == mock_robot
        mock_session.query.assert_called_once()

    def test_get_robot_not_found(self, db_manager, mock_session):
        """Тест получения несуществующего робота."""
        robot_id = "ROB-001"
        mock_session.query.return_value.filter.return_value.first.return_value = None
        
        result = db_manager.get_robot(robot_id)
        assert result is None
        mock_session.query.assert_called_once()

    def test_get_all_robots(self, db_manager, mock_session):
        """Тест получения всех роботов."""
        mock_robots = [Robot(id="ROB-001"), Robot(id="ROB-002")]
        mock_session.query.return_value.all.return_value = mock_robots
        
        result = db_manager.get_all_robots()
        assert result == mock_robots
        mock_session.query.assert_called_once()

    def test_verify_password_success(self):
        """Тест успешной проверки пароля."""
        password = "password123"
        hashed_password = b"hashed_password"
        
        with patch('db.DataBaseManager.bcrypt.checkpw') as mock_checkpw:
            mock_checkpw.return_value = True
            result = verify_password(password, hashed_password)
            
            mock_checkpw.assert_called_once_with(
                password.encode('utf-8'), hashed_password
            )
            assert result is True

    def test_verify_password_failure(self):
        """Тест неуспешной проверки пароля."""
        password = "wrong_password"
        hashed_password = b"hashed_password"
        
        with patch('db.DataBaseManager.bcrypt.checkpw') as mock_checkpw:
            mock_checkpw.return_value = False
            result = verify_password(password, hashed_password)
            
            mock_checkpw.assert_called_once_with(
                password.encode('utf-8'), hashed_password
            )
            assert result is False

    def test_verify_password_invalid_hash(self):
        """Тест обработки исключения при некорректном хэше."""
        password = "password123"
        hashed_password = b"invalid_hash"
        
        with patch('db.DataBaseManager.bcrypt.checkpw') as mock_checkpw:
            mock_checkpw.side_effect = ValueError("Invalid salt")
            result = verify_password(password, hashed_password)
            
            mock_checkpw.assert_called_once_with(
                password.encode('utf-8'), hashed_password
            )
            assert result is False

if __name__ == "__main__":
    pytest.main()