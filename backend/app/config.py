from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str
    session_ttl_minutes: int = 60
    cors_origins: str = "http://localhost:5173"
    cors_origin_regex: str | None = None
    local_image_dir: str | None = None
    image_base_url: str | None = None
    admin_export_key: str | None = None

    @model_validator(mode="after")
    def _default_image_base(self) -> "Settings":
        if self.image_base_url is None:
            if self.local_image_dir is None:
                raise ValueError(
                    "Set IMAGE_BASE_URL (production) or LOCAL_IMAGE_DIR (dev)"
                )
            self.image_base_url = "http://localhost:8000/static/images"
        self.image_base_url = self.image_base_url.rstrip("/")
        return self

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()


def image_url(filename: str) -> str:
    return f"{settings.image_base_url}/{filename}"
