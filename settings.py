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

    # YANDEX_FOLDER_ID: str = Field(default="b1a2c3d4e5f6g7h8i9j0", description="Yandex Cloud folder ID")
    YANDEX_API_KEY: str = Field(default="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", description="Yandex Cloud API key")
    YANDEX_URL: str = Field(default="https://openrouter.ai/api/v1", description="Yandex GPT API URL")


settings = Settings()
print(settings.model_dump())
