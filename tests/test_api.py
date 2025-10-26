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

@pytest.mark.unit
@pytest.mark.asyncio
class TestApi:
    """Класс для тестирования эндпоинтов FastAPI из api.py."""

    @pytest.fixture
    def client(self):
        """Фикстура для создания тестового клиента FastAPI."""
        return TestClient(app)

    @pytest.fixture
    def mock_db(self):
        """Фикстура для мока DataBaseManager."""
        with patch('api.api.db') as mock_db:
            mock_db.get_current_state = MagicMock()
            mock_db.add_robot_data = MagicMock()
            mock_db.get_filter_inventory_history = MagicMock()
            yield mock_db

    @pytest.fixture
    def mock_auth_service(self):
        """Фикстура для мока auth_service."""
        with patch('api.api.auth_service') as mock_auth:
            mock_auth.login = MagicMock()
            yield mock_auth

    @pytest.fixture
    def mock_ws_manager(self):
        """Фикстура для мока ws_manager."""
        with patch('api.api.ws_manager') as mock_ws:
            mock_ws.broadcast_dashboard_updates = AsyncMock()
            mock_ws.get_connections_count = MagicMock(return_value=3)
            mock_ws.broadcast = AsyncMock()
            yield mock_ws

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

    def test_predict_endpoint(self, client):
        """Тест эндпоинта предсказания AI."""
        request_data = {
            "period_days": 7,
            "categories": [{"id": "cat1", "name": "Category 1"}]
        }
        
        response = client.post("/api/ai/predict", json=request_data)
        
        assert response.status_code == 200
        assert response.json() == {
            "predictions": [{"id": "cat1", "name": "Category 1"}],
            "confidence": 0.95
        }

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

    def test_add_csv_file_success(self, client, mock_db):
        """Тест успешной загрузки CSV файла."""
        csv_content = "robot_id;product_id;quantity;status\nROB-001;PROD-001;10;ok"
        mock_db.add_robot_data_csv.return_value = None
        
        response = client.post(
            "/api/inventory/import",
            files={"file_csv": ("test.csv", csv_content, "text/csv")}
        )
        
        assert response.status_code == 200
        assert response.json() == {
            "status": "success",
            "records_processed": 1,
            "total_records": 1
        }
        mock_db.add_robot_data_csv.assert_called_once()

    def test_add_csv_file_invalid_format(self, client):
        """Тест загрузки файла с неверным форматом."""
        response = client.post(
            "/api/inventory/import",
            files={"file_csv": ("test.txt", "content", "text/plain")}
        )
        
        assert response.status_code == 400
        assert response.json()["detail"] == "Only CSV files are allowed"

    def test_add_csv_file_empty(self, client):
        """Тест загрузки пустого CSV файла."""
        csv_content = ""
        with patch('pandas.read_csv', side_effect=pd.errors.EmptyDataError):
            response = client.post(
                "/api/inventory/import",
                files={"file_csv": ("test.csv", csv_content, "text/csv")}
            )
            
            assert response.status_code == 400
            assert response.json()["detail"] == "CSV file is empty"

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