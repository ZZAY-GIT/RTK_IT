from fastapi import APIRouter, HTTPException
from app.api.v1.schemas import PredictRequest, PredictResponse
from app.core.ai.yandex_gpt_client import yandex_client
from app.db.DataBaseManager import db
from fastapi_cache.decorator import cache
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/predict", response_model=PredictResponse)
@cache(expire=7200)
async def get_predict():
    # 1. Получаем данные для AI из нашей БД
    inventory_data, historical_data = await db.get_data_for_predict()

    # 2. Вызываем метод клиента, который вернет нам словарь с данными
    request_data = yandex_client.get_prediction(inventory_data, historical_data)

    # 3. Проверяем, смог ли клиент получить и распарсить данные
    if request_data is None:
        raise HTTPException(
            status_code=503,
            detail="AI service is currently unavailable or returned an error.",
        )

    # 4. Извлекаем список предсказаний из словаря
    predictions_list = request_data.get("categories")
    if not predictions_list:
        raise HTTPException(
            status_code=503, detail="AI service returned no predictions."
        )

    # 5. Сохраняем список предсказаний в базу данных
    saved_predictions = await db.add_ai_prediction(predictions_list)

    # 6. Проверяем, успешно ли прошла запись в БД
    if saved_predictions is None:
        raise HTTPException(
            status_code=500, detail="Failed to save AI predictions to the database"
        )

    # 7. Возвращаем ответ, содержащий данные, которые были сохранены в БД
    return PredictResponse(predictions=saved_predictions, confidence=0.75)
