from pydantic_settings import BaseSettings
from pathlib import Path
import os


class Settings(BaseSettings):
    APP_NAME: str = "BiteScan"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    HOST: str = "0.0.0.0"
    PORT: int = 8000

    CORS_ORIGINS: list[str] = ["*"]

    UPLOAD_DIR: Path = Path("static/uploads")
    NOTICES_DIR: Path = Path("static/notices")
    DATA_DIR: Path = Path("app/data")

    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.5-flash"

    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""

    EAN13_PHYSICAL_WIDTH_MM: float = 37.29
    EAN13_PHYSICAL_HEIGHT_MM: float = 25.91

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()

settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
settings.NOTICES_DIR.mkdir(parents=True, exist_ok=True)
