import json
import httpx
import re
from settings import settings
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
        prompt = f"""
        Analyze warehouse inventory data and predict stock levels for next 7 days.
        Current data: {json.dumps(inventory_data)}
        Historical consumption pattern: {json.dumps(historical_data)}
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
            response = client.post(self.url, headers=headers, json=payload)
            response = json.loads(response.text)
            result_text = response['result']['alternatives'][0]['message']['text']
            logging.info("Ответ нейронки:", result_text)
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
        parsed_data = self.safe_parse_json(ai_response_text)
        
        # Если safe_parse_json вернул None (ошибка парсинга)
        if parsed_data is None:
            logging.error("Failed to parse AI prediction response.")
            return None
            
        # Отфильтровываем лишний элемент с датой, если он есть
        clean_predictions = [
            p for p in parsed_data 
            if isinstance(p, dict) and 'product_id' in p and 'days_until_stockout' in p
        ]
        
        if not clean_predictions:
            logging.warning("AI returned valid JSON but no actual prediction data.")
            return None
            
        logging.info(f"Successfully parsed {len(clean_predictions)} predictions from AI.")
        return clean_predictions

    # def get_prediction(self, inventory_data, historical_data, period_days=7):
    #     self.period_days = period_days
    #     self.last_prediction = self.send_to_ai(inventory_data, historical_data)
    #     logging.info("ласт предикт:", self.last_prediction)
    #     self.last_prediction = self.safe_parse_json(self.last_prediction)
    #     self.send_to_api()
    #     return self.last_prediction

    def send_to_api(self):
        # def default_serializer(obj):
        #     if isinstance(obj, datetime):
        #         return obj.isoformat()
        #     raise TypeError(f"Object of type {type(obj).__name__} is not JSON serializable")
        request_data = {
            "period_days": self.period_days,
            "categories": self.last_prediction
        }
        # json_payload = json.dumps(request_data, default=default_serializer)  content=json_payload
        with httpx.Client() as client:
            response = client.post(settings.API_URL + "/api/ai/predict/post", json=request_data)
        
        return response.text
    
    # Внутри класса YandexGPTClient

    @staticmethod
    def safe_parse_json(json_str):
        try:
            result_text = json_str
            if "```json" in result_text:
                result_text = result_text.replace("```json", "```")
            clean = re.sub(r'^```([\s\S]*?)```$', r'\1', result_text)
            data = json.loads(clean.strip())
            
            if not isinstance(data, list):
                logging.error("AI response is not a list.")
                return None
            
            # Добавляем created_at к КАЖДОМУ объекту предсказания
            prediction_timestamp = datetime.now()
            for item in data:
                if isinstance(item, dict) and 'product_id' in item:
                    item['created_at'] = prediction_timestamp
            
            return data
        except (json.JSONDecodeError, KeyError) as e:
            logging.error(f"JSON parsing error: {e}")
            return None
        
yandex_client = YandexGPTClient()