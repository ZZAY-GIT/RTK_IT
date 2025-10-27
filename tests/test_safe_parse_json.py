import pytest
import unittest
from datetime import datetime
from unittest.mock import patch
from ai.yandex_gpt_client import yandex_client


@pytest.mark.unit
class TestSafeParseJson:
    """Класс для тестирования метода safe_parse_json из YandexGPTClient."""

    @pytest.fixture(autouse=True)
    def setup_mocked_time(self):
        """Фикстура для установки фиксированного времени в тестах."""
        with patch('ai.yandex_gpt_client.datetime') as mocked_time:
            mocked_time.now.return_value = datetime(2025, 10, 26, 19, 30, 0)
            yield mocked_time

    def test_valid_json(self, setup_mocked_time):
        """Тест успешного парсинга валидного JSON-списка."""
        json_str = '[{"key": "value"}]'
        expected = [{"key": "value"}, {"created_at": datetime(2025, 10, 26, 19, 30, 0)}]
        result = yandex_client.safe_parse_json(json_str)
        assert result == expected

    def test_with_markdown(self, setup_mocked_time):
        """Тест парсинга JSON-списка в markdown-обертке."""
        json_str = '```json\n[{"key": "value"}]\n```'
        expected = [{"key": "value"}, {"created_at": datetime(2025, 10, 26, 19, 30, 0)}]
        result = yandex_client.safe_parse_json(json_str)
        assert result == expected

    def test_with_empty_markdown(self, setup_mocked_time):
        """Тест парсинга JSON-списка в markdown с пустыми строками."""
        json_str = '```\n[{"key": "value"}]\n\n```'
        expected = [{"key": "value"}, {"created_at": datetime(2025, 10, 26, 19, 30, 0)}]
        result = yandex_client.safe_parse_json(json_str)
        assert result == expected

    def test_invalid_json(self):
        """Тест обработки невалидного JSON."""
        json_str = '[{"key": "value"'  # Неполный JSON
        result = yandex_client.safe_parse_json(json_str)
        assert result is None

    def test_empty_string(self):
        """Тест обработки пустой строки."""
        json_str = ""
        result = yandex_client.safe_parse_json(json_str)
        assert result is None

    def test_non_json_string(self):
        """Тест обработки строки, не являющейся JSON."""
        json_str = "not a json string"
        result = yandex_client.safe_parse_json(json_str)
        assert result is None

    def test_only_markdown(self):
        """Тест обработки строки с markdown без JSON."""
        json_str = '```json\n\n```'
        result = yandex_client.safe_parse_json(json_str)
        assert result is None

    def test_nested_json(self, setup_mocked_time):
        """Тест парсинга сложного (вложенного) JSON-списка."""
        json_str = '```json\n[{"key": {"nested": 42}}]\n```'
        expected = [{"key": {"nested": 42}}, {"created_at": datetime(2025, 10, 26, 19, 30, 0)}]
        result = yandex_client.safe_parse_json(json_str)
        assert result == expected

    def test_non_list_json(self):
        """Тест обработки JSON, который не является списком."""
        json_str = '{"key": "value"}'  # JSON-объект, а не список
        result = yandex_client.safe_parse_json(json_str)
        assert result is None

if __name__ == "__main__":
    unittest.main()