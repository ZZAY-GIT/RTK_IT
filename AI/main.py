# from settings import settings
# from openai import OpenAI

# client = OpenAI(
#   base_url="https://openrouter.ai/api/v1",
#   api_key="settings.YANDEX_API_KEY",
# )

# completion = client.chat.completions.create(
#   model="deepseek/deepseek-r1",
#   messages=[
#     {
#       "role": "user",
#       "content": "What is the meaning of life?"
#     }
#   ]
# )
# print(completion.choices[0].message.content)


from yandex_gpt_client import YandexGPTClient
import json
with open("historicalData.json", "r", encoding="utf-8") as f:
    his = json.load(f)
with open("inventoryData.json", "r", encoding="utf-8") as f:
    inv = json.load(f)
s = YandexGPTClient()
c = 0
for i in range(100):
    ii = s.send_to_ai(inv, his)
    i1 = s.safe_parse_json(ii)
    if not "Ошибка JSON" in i1:
        c += 1
        print(i1)
        print(f"Успешно {c}/100")
    else:
        print(ii)
        print('-------------------------')
        print(i1)

# from yandex_gpt_client import YandexGPTClient
# import json
# with open("historicalData.json", "r", encoding="utf-8") as f:
#     his = json.load(f)
# with open("inventoryData.json", "r", encoding="utf-8") as f:
#     inv = json.load(f)
# s = YandexGPTClient(mock_api=True)
# api_result = s.send_to_api(inv, his)
# print("Результат send_to_api:", api_result)