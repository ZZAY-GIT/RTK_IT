import json
import httpx
import re
from app.core.settings import settings
from datetime import datetime
import logging

class YandexGPTClient:
    def __init__(self, url=settings.YANDEX_URL, api_key=settings.YANDEX_API_KEY, model=settings.YANDEX_MODEL, temperature=settings.TEMPERATURE_MODEL, max_tokens=settings.MAX_TOKENS):
        self.api_key = api_key
        self.url = url
        self.model = model
        self.last_prediction = None
        self.period_days = 7
        self.temperature = temperature
        self.max_tokens = max_tokens

    def send_to_ai(self, inventory_data, historical_data):
        logging.debug(f"INV DATA: {inventory_data}")
        logging.debug(f"HIS DATA: {historical_data}")
        prompt = f"""
        Analyze warehouse inventory data and predict stock levels for next 7 days.
        Current data: {inventory_data}
        Historical consumption pattern: {historical_data}
        Provide predictions in JSON format with fields: product_id, days_until_stockout, recommended_order. 
        Return ONLY valid JSON array, no additional text or markdown.
        Example: """ + """[{"product_id": "TEL-4567", "days_until_stockout": 9, "recommended_order": 100}, {"product_id": "TEL-8901", "days_until_stockout": 4, "recommended_order": 50}]
        """

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Api-Key {self.api_key}"
        }

        payload = {
            "modelUri": self.model,
            "completionOptions": {
                "stream": False,
                "temperature": self.temperature,
                "maxTokens": self.max_tokens
            },
            "messages": [
                {"role": "system", "text": "You are a warehouse analysis assistant. Return ONLY a valid JSON array, no extra text or markdown."},
                {"role": "user", "text": prompt}
            ]
        }

        with httpx.Client() as client:
            timeout = httpx.Timeout(10.0, read=30.0)
            response = client.post(self.url, headers=headers, json=payload, timeout=timeout)
            response.raise_for_status()
            response = json.loads(response.text)
            result_text = response.get('result', None).get('alternatives', None)
            if result_text:
                result_text = result_text[0].get('message', None).get('text', None)
            return result_text

    def get_prediction(self, inventory_data, historical_data, period_days=7):
        """
        Получает предсказания от YandexGPT на основе данных об остатках.
        Возвращает чистый список словарей с предсказаниями или None в случае ошибки.
        """
        self.period_days = period_days
        ai_response_text = self.send_to_ai(inventory_data, historical_data)
        logging.info(f"Raw AI response: {ai_response_text}")
        
        # Парсим ответ от AI
        self.last_prediction = self.safe_parse_json(ai_response_text)
        # Если safe_parse_json вернул None (ошибка парсинга)
        if self.last_prediction is None:
            logging.error("Failed to parse AI prediction response.")
            return None
            
        # Отфильтровываем лишний элемент с датой, если он есть
        clean_predictions = [
            p for p in self.last_prediction 
            if isinstance(p, dict) and 'product_id' in p and 'days_until_stockout' in p
        ]
        
        if not clean_predictions:
            logging.warning("AI returned valid JSON but no actual prediction data.")
            return None
        logging.info(f"Successfully parsed {len(clean_predictions)} predictions from AI.")
        request_data = {
            "period_days": self.period_days,
            "categories": self.last_prediction
        }
        return request_data

    # def send_to_api(self):
    #     
    #     logging.debug(request_data)
    #     with httpx.Client(timeout=30.0) as client:
    #         logging.debug(f"Sending request to API: {settings.API_URL}/api/ai/predict/post")
    #         response = client.post(settings.API_URL + "/api/ai/predict/post", json=request_data)
    #         response.raise_for_status()
    #         logging.info(f"Successfully sent data to API. Status: {response.status_code}")
    #     return response.text

    @staticmethod
    def safe_parse_json(json_str: str):
        """
        Парсит JSON-ответ от AI. Если JSON полный, обогащает все элементы.
        Если JSON обрезан, пытается восстановить ВСЕ полные элементы до места обрыва.
        """
        try:
            result_text = json_str
            if "```json" in result_text:
                result_text = result_text.replace("```json", "```")
            
            start_marker = "```"
            end_marker = "```"

            start_index = result_text.find(start_marker)
            if start_index == -1:
                logging.error("Ответ AI не содержит открывающего маркера ```")
                return None

            content_start = start_index + len(start_marker)
            potential_json = result_text[content_start:]
            end_index = potential_json.find(end_marker)

            if end_index != -1:
                clean_json_str = potential_json[:end_index].strip()
            else:
                logging.warning("Закрывающий маркер ``` не найден. Ответ от AI, вероятно, обрезан.")
                clean_json_str = potential_json.strip()

            # Шаг 2: Пытаемся распарсить полный JSON
            try:
                data = json.loads(clean_json_str)
                if not isinstance(data, list):
                    logging.error("Ответ AI не является JSON-массивом.")
                    return None
                
                # Успех! Обогащаем все элементы и возвращаем.
                prediction_timestamp = datetime.now()
                for item in data:
                    if isinstance(item, dict) and 'product_id' in item:
                        item['created_at'] = prediction_timestamp.isoformat()
                
                logging.info(f"Успешно распарсено {len(data)} элементов из ответа AI.")
                return data

            except json.JSONDecodeError:
                # Шаг 3: Парсинг не удался, пытаемся восстановить все полные элементы
                logging.warning("JSON в ответе AI повреждён. Попытка восстановить все полные элементы.")
                
                # Логика "починки" обрезанного JSON
                last_delimiter_idx = clean_json_str.rfind('},')
                repaired_str = ""
                if last_delimiter_idx != -1:
                    # Найден полный объект, отрезаем лишнее и закрываем массив
                    repaired_str = clean_json_str[:last_delimiter_idx + 1] + ']'
                else:
                    # Ищем конец последнего (возможно, единственного) объекта
                    last_brace_idx = clean_json_str.rfind('}')
                    if last_brace_idx != -1:
                        repaired_str = clean_json_str[:last_brace_idx + 1] + ']'

                if not repaired_str:
                    logging.error("Не удалось восстановить повреждённый JSON.")
                    return None

                try:
                    repaired_data = json.loads(repaired_str)
                    if not isinstance(repaired_data, list) or not repaired_data:
                        logging.error("Восстановленные данные не являются валидным массивом.")
                        return None
                    
                    # Восстановление прошло успешно! Обогащаем ВСЕ элементы в восстановленном списке.
                    prediction_timestamp = datetime.now()
                    for item in repaired_data:
                        if isinstance(item, dict) and 'product_id' in item:
                            item['created_at'] = prediction_timestamp.isoformat()
                    
                    logging.info(f"Успешно восстановлено {len(repaired_data)} полных элементов из усечённого ответа.")
                    return repaired_data

                except json.JSONDecodeError:
                    logging.error("Не удалось распарсить даже восстановленную JSON-строку.")
                    return None

        except Exception as e:
            logging.error(f"Произошла непредвиденная ошибка при парсинге JSON: {e}")
            return None
        
yandex_client = YandexGPTClient()