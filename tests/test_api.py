import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from fastapi.testclient import TestClient
from datetime import datetime
from api.api import app
from api.schemas import RobotData, PredictRequest, PredictResponse, LoginRequest
from db.DataBaseManager import DataBaseManager
from auth.auth_service import auth_service
import pandas as pd
import io
import json
from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend
from redis.asyncio import Redis



@pytest.mark.unit
class TestApi:
    """Класс для тестирования эндпоинтов FastAPI из api.py."""

    @pytest.fixture(autouse=True)
    def setup_method(self):
        """Отключаем кэширование и инициализируем FastAPICache."""
        with patch('api.api.cache', lambda *args, **kwargs: lambda func: func):
            yield

    @pytest.fixture
    def client(self):
        """Фикстура для создания тестового клиента FastAPI с инициализацией кэша."""
        # Создаем мок Redis
        mock_redis = MagicMock(spec=Redis)
        
        # Инициализируем FastAPICache
        FastAPICache.init(RedisBackend(mock_redis), prefix="test_cache")
        
        # Создаем клиент
        with TestClient(app) as client:
            yield client
        
        # Очищаем после теста
        FastAPICache._coder = None
        FastAPICache._backend = None
        FastAPICache._prefix = None

    @pytest.fixture
    def mock_db(self):
        with patch('api.api.db') as mock_db:
            mock_db.get_current_state = MagicMock()
            mock_db.add_robot_data = MagicMock()
            mock_db.get_filter_inventory_history = MagicMock()
            mock_db.get_data_for_predict = MagicMock()
            mock_db.add_ai_prediction = MagicMock()
            yield mock_db

    @pytest.fixture
    def mock_auth_service(self):
        with patch('api.api.auth_service') as mock_auth:
            mock_auth.login = MagicMock()
            yield mock_auth

    @pytest.fixture
    def mock_ws_manager(self):
        with patch('api.api.ws_manager') as mock_ws:
            mock_ws.broadcast_dashboard_updates = AsyncMock()
            mock_ws.get_connections_count = MagicMock(return_value=3)
            mock_ws.broadcast = AsyncMock()
            yield mock_ws

    def test_predict_endpoint(self, client, mock_db):
        mock_inventory_data = ["inventory_data"]
        mock_historical_data = ["historical_data"]
        mock_db.get_data_for_predict.return_value = (mock_inventory_data, mock_historical_data)
        
        mock_predictions = [{"product_id": "p1", "recommended_order": 10}]
        
        with patch('api.api.yandex_client') as mock_yandex:
            mock_yandex.get_prediction.return_value = mock_predictions
            
            response = client.get("/api/ai/predict")
            
            assert response.status_code == 200
            response_data = response.json()
            assert "predictions" in response_data
            assert "confidence" in response_data
            assert response_data["predictions"] == mock_predictions
            assert response_data["confidence"] == 0.75
            
            mock_db.get_data_for_predict.assert_called_once()
            mock_yandex.get_prediction.assert_called_once_with(mock_inventory_data, mock_historical_data)

    def test_predict_post_endpoint(self, client, mock_db):
        """Тест POST эндпоинта для сохранения предсказаний."""
        # Подготавливаем тестовые данные
        test_predictions = [
            {"product_id": "p1", "recommended_order": 10},
            {"product_id": "p2", "recommended_order": 5}
        ]
        
        # Мокаем успешное сохранение
        mock_db.add_ai_prediction.return_value = test_predictions
        
        # Выполняем POST-запрос
        response = client.post(
            "/api/ai/predict/post",
            json={"categories": test_predictions}
        )
        
        # Проверяем результат
        assert response.status_code == 200
        response_data = response.json()
        assert response_data["predictions"] == test_predictions
        assert response_data["confidence"] == 0.75
        mock_db.add_ai_prediction.assert_called_once_with(test_predictions)

    def test_predict_post_endpoint_failure(self, client, mock_db):
        """Тест POST эндпоинта при ошибке сохранения."""
        test_predictions = [{"product_id": "p1", "recommended_order": 10}]
        
        # Мокаем ошибку сохранения
        mock_db.add_ai_prediction.return_value = None
        
        # Выполняем POST-запрос
        response = client.post(
            "/api/ai/predict/post", 
            json={"categories": test_predictions}
        )
        
        # Проверяем ошибку
        assert response.status_code == 500
        assert "Failed to save AI predictions" in response.json()["detail"]

    def test_login_success(self, client, mock_auth_service):
        """Тест успешного логина."""
        email = "test@example.com"
        password = "password123"
        mock_auth_service.login.return_value = {"token": "fake_token"}
        
        response = client.post(
            "/api/auth/login",
            json={"email": email, "password": password}
        )
        
        assert response.status_code == 200
        assert response.json() == {"token": "fake_token"}
        mock_auth_service.login.assert_called_once_with(email, password)

    def test_receive_robot_data_success(self, client, mock_db, mock_ws_manager):
        """Тест успешного добавления данных робота."""
        robot_data = {
            "robot_id": "ROB-001",
            "timestamp": "2025-10-26T19:30:00",
            "location": {"zone": "A", "row": 1, "shelf": 2},
            "scan_results": [
                {"product_id": "PROD-001", "product_name": "Product 1", "quantity": 10, "status": "ok"}
            ],
            "battery_level": 95.5,
            "next_checkpoint": "CHECK-001"
        }
        mock_db.add_robot_data.return_value = True
        
        response = client.post("/api/robots/data", json=robot_data)
        
        assert response.status_code == 200
        mock_db.add_robot_data.assert_called_once()

    def test_receive_robot_data_failure(self, client, mock_db, mock_ws_manager):
        """Тест неуспешного добавления данных робота."""
        robot_data = {
            "robot_id": "ROB-001",
            "timestamp": "2025-10-26T19:30:00",
            "location": {"zone": "A", "row": 1, "shelf": 2},
            "scan_results": [
                {"product_id": "PROD-001", "product_name": "Product 1", "quantity": 10, "status": "ok"}
            ],
            "battery_level": 95.5,
            "next_checkpoint": "CHECK-001"
        }
        mock_db.add_robot_data.return_value = False
        
        response = client.post("/api/robots/data", json=robot_data)
        
        assert response.status_code == 200
        mock_db.add_robot_data.assert_called_once()
        mock_ws_manager.broadcast.assert_not_called()

    def test_get_current_data(self, client, mock_db):
        """Тест получения текущего состояния."""
        mock_db.get_current_state.return_value = {"state": "active"}
        
        response = client.get("/api/dashboard/current")
        
        assert response.status_code == 200
        assert response.json() == {"state": "active"}
        mock_db.get_current_state.assert_called_once()

    def test_get_inventory_history(self, client, mock_db):
        """Тест получения истории инвентаризации."""
        mock_db.get_filter_inventory_history.return_value = [
            {"id": 1, "product_id": "PROD-001", "quantity": 10}
        ]
        
        response = client.get(
            "/api/inventory/history?from_date=2025-10-26&to_date=2025-10-27&zone=A&status=ok"
        )
        
        assert response.status_code == 200
        assert response.json() == {
            "total": 1,
            "items": [{"id": 1, "product_id": "PROD-001", "quantity": 10}],
            "pagination": {}
        }
        mock_db.get_filter_inventory_history.assert_called_once_with(
            from_date=datetime.fromisoformat("2025-10-26"),
            to_date=datetime.fromisoformat("2025-10-27"),
            zone="A",
            status="ok"
        )

    def test_websocket_status(self, client, mock_ws_manager):
        """Тест получения статуса WebSocket соединений."""
        response = client.get("/api/ws/status")
        
        assert response.status_code == 200
        assert response.json() == {
            "active_connections": 3,
            "status": "operational"
        }
        mock_ws_manager.get_connections_count.assert_called_once()

    def test_health_check(self, client, mock_ws_manager):
        """Тест проверки здоровья приложения."""
        response = client.get("/health")
        
        assert response.status_code == 200
        assert response.json() == {
            "status": "healthy",
            "websocket_connections": 3
        }
        mock_ws_manager.get_connections_count.assert_called_once()

if __name__ == "__main__":
    pytest.main()