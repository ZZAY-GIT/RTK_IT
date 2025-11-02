import pathlib

from pydantic import Field, BaseModel
from pydantic_settings import BaseSettings, SettingsConfigDict




class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="allow",
        env_prefix="",
    )

    PROJECT_ROOT: pathlib.Path = pathlib.Path(__file__)

    CONN_STR: str = Field(default="postgresql+asyncpg://warehouse_user:secure_password@localhost:5432/warehouse_db", alias="CONN_STR")
    API_HOST: str = Field(default="localhost", alias="API_HOST")
    API_PORT: int = Field(default=8000, alias="API_PORT")
    JWT_SECRET: str = Field(default="key", alias="JWT_SECRET")

    YANDEX_API_KEY: str = Field(default="secret-api-key", description="Yandex Cloud API key", alias="YANDEX_API_KEY")
    YANDEX_URL: str = Field(default="https://llm.api.cloud.yandex.net/foundationModels/v1/completion", description="Yandex GPT API URL", alias="YANDEX_URL")
    YANDEX_MODEL: str = Field(default="gpt://b1grt4ckppkm30rupg8p/yandexgpt-lite", description="Yandex GPT model name", alias="YANDEX_MODEL")
    TEMPERATURE_MODEL: float = Field(default=0.1, description="Temperature model", alias="TEMPERATURE_MODEL")
    MAX_TOKENS: int = Field(default=2000, description="Max tokens", alias="MAX_TOKENS")
    
    REDIS_HOST: str = Field(default="localhost", description="Redis host", alias="REDIS_HOST")
    REDIS_DB: int = Field(default=0, description="Redis DB", alias="REDIS_DB")
    REDIS_PORT: int = Field(default=6379, description="Redis port", alias="REDIS_PORT")
    REDIS_PREFIX: str = Field(default="fastapi-cache", description="Prefix", alias="REDIS_PREFIX")

    DEFAULT_ADMIN_EMAIL: str = Field(default="admin@admin.com", alias="DEFAULT_ADMIN_EMAIL")
    DEFAULT_ADMIN_PASSWORD: str = Field(default="admin1234", alias="DEFAULT_ADMIN_PASSWORD")


class CacheNamespace(BaseModel):
    predict_list: str = "predict_list"

class CacheConfig(BaseModel):
    prefix: str
    namespace: CacheNamespace = CacheNamespace()

class RedisConfig(BaseModel):
    host: str
    port: int
    db: int

settings = Settings()
REDIS: RedisConfig = RedisConfig(
    host=settings.REDIS_HOST,
    port=settings.REDIS_PORT,
    db=settings.REDIS_DB
)

CACHE: CacheConfig = CacheConfig(
    prefix=settings.REDIS_PREFIX
)
print(settings.model_dump())
