# app/core/settings.py
import pathlib
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict
from .models import RedisConfig, CacheConfig
import logging

# Создаём логгер вручную (до setup_logger)
logger = logging.getLogger("app.core.settings")

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="allow",
        env_prefix="",
    )

    # === Путь к корню проекта ===
    PROJECT_ROOT: pathlib.Path = pathlib.Path(__file__).parent.parent.parent  # app/core → app → project_root

    # === База данных ===
    CONN_STR: str = Field(default="postgresql://warehouse_user:secure_password@localhost:5432/warehouse_db", alias="CONN_STR")

    # === JWT ===
    JWT_SECRET: str = Field(default="key", alias="JWT_SECRET")

    # === Yandex GPT ===
    YANDEX_API_KEY: str = Field(default="AQVN2shaS1078O7IG0Imrbg-E_oaaOMX331y1e4B", alias="YANDEX_API_KEY")
    YANDEX_URL: str = Field(default="https://llm.api.cloud.yandex.net/foundationModels/v1/completion", alias="YANDEX_URL")
    YANDEX_MODEL: str = Field(default="gpt://b1grt4ckppkm30rupg8p/yandexgpt-lite", alias="YANDEX_MODEL")
    TEMPERATURE_MODEL: float = Field(default=0.1, alias="TEMPERATURE_MODEL")
    MAX_TOKENS: int = Field(default=2000, alias="MAX_TOKENS")

    # === API ===
    API_URL: str = Field(default="http://127.0.0.1:8000", alias="API_URL")
    REDIS_HOST: str = Field(default="localhost", alias="REDIS_PORT")
    REDIS_PORT: int = Field(default=6379, alias="REDIS_PORT")
    # === Redis & Cache ===
    REDIS: RedisConfig = RedisConfig()
    CACHE: CacheConfig = CacheConfig()

    # === CORS ===
    CORS_ORIGINS: list[str] = Field(default=["http://localhost:3000"], alias="CORS_ORIGINS")

    def model_post_init(self, __context):
        # Логируем только после настройки логгера (в __init__.py)
        logger.info("Settings loaded successfully")
        logger.debug("DB: %s", self.CONN_STR.split("@")[-1])
        logger.debug("Redis: %s:%s", self.REDIS.host, self.REDIS.port)
        logger.debug("Project root: %s", self.PROJECT_ROOT)


# Создаём экземпляр (логгер будет настроен в __init__.py)
settings = Settings()