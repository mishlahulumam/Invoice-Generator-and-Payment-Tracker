from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    MAILTRAP_USERNAME: Optional[str] = None
    MAILTRAP_PASSWORD: Optional[str] = None
    MAIL_FROM: str = "noreply@invoiceapp.com"

    FRONTEND_URL: str = "http://localhost:5173"

    class Config:
        env_file = ".env"


settings = Settings()
