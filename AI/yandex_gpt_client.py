import json
import httpx
import re
from settings import settings

class YandexGPTClient:
    def __init__(self, url=settings.YANDEX_URL, api_key=settings.YANDEX_API_KEY, model=settings.YANDEX_MODEL):
        self.api_key = api_key
        self.url = url
        self.model = model
        self.last_prediction = {} 

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
                "temperature": 0.1,
                "maxTokens": 2000
            },
            "messages": [
                {"role": "system", "text": "You are a warehouse analysis assistant. Return ONLY a valid JSON array, no extra text or markdown."},
                {"role": "user", "text": prompt}
            ]
        }

        with httpx.Client() as client:
            response = client.post(self.url, headers=headers, json=payload)
            response = json.loads(response.text)
            # print(response, type(response))
            result_text = response['result']['alternatives'][0]['message']['text']
            return result_text

    def get_prediction(self, inventory_data, historical_data):
        self.last_prediction = self.send_to_ai(inventory_data, historical_data)
        self.last_prediction = self.safe_parse_json(self.last_prediction)
        return self.last_prediction

    def send_to_api(self):
        pass
    
    @staticmethod
    def safe_parse_json(json_str):
        try:
            # response_json = json.loads(json_str)
            # result_text = response_json['result']['alternatives'][0]['message']['text']
            result_text = json_str
            if "```json" in result_text:
                result_text = result_text.replace("```json", "```")
            clean = re.sub(r'^```([\s\S]*?)```$', r'\1', result_text)
            return json.loads(clean.strip())
        except (json.JSONDecodeError, KeyError) as e:
            print(f"Ошибка парсинга JSON: {e}")
            print(f"Сырой JSON: {json_str}")
            return None
        

