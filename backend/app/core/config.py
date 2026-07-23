from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_name: str = "Hanks Paints MVP"
    database_url: str = "sqlite:///./hanks_paints.db"
    media_root: str = "./media"
    public_base_url: str = "http://localhost:3000"
    sms_enabled: bool = False
    sms_notifications_enabled: bool = False
    shop_notification_phone: str = "+17652714378"
    twilio_account_sid: str | None = None
    twilio_api_key: str | None = None
    twilio_api_secret: str | None = None
    twilio_from_phone: str | None = None
    twilio_messaging_service_sid: str | None = None
    email_enabled: bool = False
    access_code_expire_minutes: int = 10
    customer_session_days: int = 7
    stripe_secret_key: str | None = None

    class Config:
        env_file = ".env"

settings = Settings()
