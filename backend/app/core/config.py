from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_name: str = "Hanks Paints MVP"
    database_url: str = "sqlite:///./hanks_paints.db"
    media_root: str = "./media"
    public_base_url: str = "http://localhost:3000"
    sms_enabled: bool = False
    email_enabled: bool = False
    access_code_expire_minutes: int = 10
    customer_session_days: int = 7
    stripe_secret_key: str | None = None

    class Config:
        env_file = ".env"

settings = Settings()
