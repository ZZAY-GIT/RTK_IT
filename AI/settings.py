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
    
    YANDEX_API_KEY: str = Field(default="AQVN2shaS1078O7IG0Imrbg-E_oaaOMX331y1e4B", description="Yandex Cloud API key")
    YANDEX_URL: str = Field(default="https://llm.api.cloud.yandex.net/foundationModels/v1/completion", description="Yandex GPT API URL")
    YANDEX_MODEL: str = Field(default="gpt://b1grt4ckppkm30rupg8p/yandexgpt-lite", description="Yandex GPT model name")

settings = Settings()
print(settings.model_dump())
