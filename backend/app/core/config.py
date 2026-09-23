from typing import List, Union
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres_password_homelab"
    POSTGRES_DB: str = "skilltracker"
    POSTGRES_HOST: str = "postgres"
    POSTGRES_PORT: int = 5432

    SECRET_KEY: str = "super_secret_jwt_key_change_in_production_32bytes_min"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 43200  # 30 days default for mobile sync

    CORS_ORIGINS: Union[str, List[str]] = (
        "http://localhost:3000,http://127.0.0.1:3000,http://localhost:8000,"
        "http://skilltracker.homelab.internal,https://skilltracker.homelab.internal,"
        "http://api-skilltracker.homelab.internal,https://api-skilltracker.homelab.internal"
    )

    @property
    def cors_origins_list(self) -> List[str]:
        if isinstance(self.CORS_ORIGINS, str):
            return [i.strip() for i in self.CORS_ORIGINS.split(",") if i.strip()]
        return self.CORS_ORIGINS

    @property
    def DATABASE_URL(self) -> str:
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
