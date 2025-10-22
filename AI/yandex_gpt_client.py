import json
import httpx
import re
from settings import settings
from openai import OpenAI
from unittest.mock import Mock

def safe_parse_json(json_str):
    try:
        # Убираем блоки кода
        clean = re.sub(r'^```[\s\S]*?```$', '', json_str, flags=re.MULTILINE)
        # Парсим
        return json.loads(clean.strip())
    except json.JSONDecodeError as e:
        print(f"Ошибка JSON: {e}")
        return None

class YandexGPTClient:
    def __init__(self, url=settings.YANDEX_URL, api_key=settings.YANDEX_API_KEY,):
        """
        ИНИЦИАЛИЗАЦИЯ: Подключаемся к YandexGPT
        :param folder_id: ID папки в Yandex Cloud (получи в консоли)
        :param api_key: API-ключ (создай в Yandex Cloud)
        """
        # self.folder_id = settings.YANDEX_FOLDER_ID
        self.api_key = api_key
        self.url = url
        # self.api_url = api_url
        self.client = OpenAI(
            base_url=self.url,
            api_key=self.api_key,
        )
        self.last_prediction = {} 

    def send_to_ai(self, inventory_data, historical_data):
        prompt = f"""
        Analyze warehouse inventory data and predict stock levels for next 7 days.
        Current data: {json.dumps(inventory_data)}
        Historical consumption pattern: {json.dumps(historical_data)}
        Provide predictions in JSONLINES format with fields: product_id, days_until_stockout, recommended_order. 
        The predictions field should not be in the json file. As an output I expect only a json file without additional text.
        """

        response = self.client.chat.completions.create(
            model="deepseek/deepseek-v3.2-exp",
            messages=[
                {"role": "system", "content": "You are a warehouse analysis assistant."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1
        )
        response = response.choices[0].message.content
        return response

    def get_prediction(self, inventory_data, historical_data):
        self.last_prediction = self.send_to_ai(inventory_data, historical_data)

    # def send_to_api(self, inventory_data, historical_data):
    #     """
    #     Вызывает send_to_ai для получения ответа нейронной сети и отправляет его на тестовый API.
    #     :param inventory_data: Текущие данные инвентаризации (dict)
    #     :param historical_data: Исторические данные потребления (list)
    #     :return: Ответ API (str)
    #     """

    #     if self.mock_api:
    #         # Мок ответа API
    #         mock_response = Mock()
    #         mock_response.status_code = 200
    #         mock_response.json.return_value = {
    #             "json": {"predictions": ai_response},
    #             "message": "Mock API response: predictions received"
    #         }
    #         return json.dumps(mock_response.json(), indent=2)
        
    #     headers = {
    #         "Content-Type": "application/json"
    #     }

    #     payload = {
    #         "predictions": ai_response  # Отправляем JSON из send_to_ai как часть payload
    #     }

    #     # Отправка на httpbin.org для тестирования
    #     test_api_url = "https://httpbin.org/post"
    #     response = httpx.post(
    #         test_api_url,
    #         json=payload,
    #         headers=headers
    #     )

    #     if response.status_code == 200:
    #         result = response.json()
    #         return json.dumps(result, indent=2)  # Возвращаем ответ API в читаемом виде
    #     else:
    #         raise Exception(f"Ошибка API: {response.status_code} - {response.text}")
    
    @staticmethod
    def safe_parse_json(json_str):
        try:
            if "```json" in json_str:
                json_str = json_str.replace("```json", "```")
            clean = re.sub(r'^```([\s\S]*?)```$', r'\1', json_str)
            return json.loads(clean.strip())
        except json.JSONDecodeError as e:
            print(f"Ошибка JSON: {e}")
            return None
        

