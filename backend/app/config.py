import os
from functools import lru_cache

from pydantic import BaseModel


class Settings(BaseModel):
    database_url: str = (
        os.getenv(
            "DATABASE_URL",
            "postgresql+psycopg2://postgres:postgres@db:5432/insight",
        )
    )
    secret_key: str = os.getenv("SECRET_KEY", "CHANGE_ME_SUPER_SECRET_KEY")
    access_token_expire_minutes: int = int(
        os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60")
    )
    algorithm: str = "HS256"

    admin_username: str = os.getenv("ADMIN_USERNAME", "insight")
    admin_password: str = os.getenv("ADMIN_PASSWORD", "Parol13!!")


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()



