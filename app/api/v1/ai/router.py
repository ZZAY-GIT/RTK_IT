from fastapi import APIRouter, Depends, HTTPException
from app.api.v1.schemas import PredictRequest, PredictResponse
from app.api.v1.ai.yandex_gpt_client import yandex_client
from app.dependencies import access_level
from app.db.DataBaseManager import db
from fastapi_cache.decorator import cache
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/predict", response_model=PredictResponse)
@cache(expire=7200)
async def get_predict():
    inventory_data, historical_data = await db.get_data_for_predict()
    predictions_from_ai = yandex_client.get_prediction(inventory_data, historical_data)
    if predictions_from_ai is None:
        raise HTTPException(
            status_code=503, 
            detail="AI service is currently unavailable or returned an error."
        )
    return PredictResponse(predictions=predictions_from_ai, confidence=0.75)


@router.post("/predict/post", response_model=PredictResponse)
def predict(request: PredictRequest):
    predictions_list = request.categories
    saved_predictions = db.add_ai_prediction(predictions_list)
    if saved_predictions is None:
        # Если БД вернула ошибку, возвращаем серверную ошибку
        raise HTTPException(status_code=500, detail="Failed to save AI predictions to the database")
    return PredictResponse(predictions=saved_predictions, confidence=0.75)