from yandex_gpt_client import YandexGPTClient
import json
with open("AI/historicalData.json", "r", encoding="utf-8") as f:
    his = json.load(f)
with open("AI/inventoryData.json", "r", encoding="utf-8") as f:
    inv = json.load(f)
s = YandexGPTClient()
result = s.send_to_api(inv, his)
print(result)