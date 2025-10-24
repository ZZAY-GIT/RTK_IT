import json
import httpx
import re
from settings import settings
from datetime import datetime

class YandexGPTClient:
    def __init__(self, url=settings.YANDEX_URL, api_key=settings.YANDEX_API_KEY, model=settings.YANDEX_MODEL, temperature=settings.TEMPERATURE_MODEL, max_tokens=settings.MAX_TOKENS):
        self.api_key = api_key
        self.url = url
        self.model = model
        self.last_prediction = None
        self.period_days = 7
        self.temperature = temperature
        self.max_tokens = max_tokens

    def send_to_ai(self, inventory_data, historical_data, temperature, max_tokens):
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
                "temperature": temperature,
                "maxTokens": max_tokens
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
            return result_text

    def get_prediction(self, inventory_data, historical_data, period_days):
        self.period_days = period_days
        self.last_prediction = self.send_to_ai(inventory_data, historical_data)
        self.last_prediction = self.safe_parse_json(self.last_prediction)
        return self.last_prediction

    def send_to_api(self, inventory_data, historical_data):
        if self.last_prediction:
            categories = self.last_prediction
        else:
            categories = self.get_prediction(inventory_data, historical_data, self.period_days)

        request_data = {
            "period_days": self.period_days,
            "categories": categories
        }
        
        with httpx.Client() as client:
            response = client.post(settings.API_URL + "/api/ai/predict", json=request_data)
        
        return response.text
    
    @staticmethod
    def safe_parse_json(json_str):
        try:
            result_text = json_str
            if "```json" in result_text:
                result_text = result_text.replace("```json", "```")
            clean = re.sub(r'^```([\s\S]*?)```$', r'\1', result_text)
            data = json.loads(clean.strip())
            data.append({"created_at": datetime.now()})
            return data
        except (json.JSONDecodeError, KeyError) as e:
            # print(f"Ошибка парсинга JSON: {e}")
            # print(f"Сырой JSON: {json_str}")
            return None
        
yandex_client = YandexGPTClient()
