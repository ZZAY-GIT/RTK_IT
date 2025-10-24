import logging
import pathlib

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="allow",
        env_prefix="",
    )

    PROJECT_ROOT: pathlib.Path = pathlib.Path(__file__)

    CONN_STR: str = Field(default="postgresql://warehouse_user:secure_password@localhost:5432/warehouse_db", alias="CONN_STR")
    JWT_SECRET: str = Field(default="key", alias="JWT_SECRET")

    YANDEX_API_KEY: str = Field(default="AQVN2shaS1078O7IG0Imrbg-E_oaaOMX331y1e4B", description="Yandex Cloud API key", alias="YANDEX_API_KEY")
    YANDEX_URL: str = Field(default="https://llm.api.cloud.yandex.net/foundationModels/v1/completion", description="Yandex GPT API URL", alias="YANDEX_URL")
    YANDEX_MODEL: str = Field(default="gpt://b1grt4ckppkm30rupg8p/yandexgpt-lite", description="Yandex GPT model name", alias="YANDEX_MODEL")
    API_URL: str = Field(default="http://127.0.0.1:8000", description="Yandex GPT model name", alias="API_URL")
    TEMPERATURE_MODEL: float = Field(default=0.1, description="Model temperature", alias="TEMPERATURE_MODEL")
    MAX_TOKENS: int = Field(default=2000, description="Maximum number of model tokens", alias="MAX_TOKENS")


settings = Settings()
print(settings.model_dump())
