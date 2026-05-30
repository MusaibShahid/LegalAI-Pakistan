from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "Pakistan Legal Search Engine"
    app_version: str = "1.0.0"
    debug: bool = False

    # Database
    database_url: str = "sqlite+aiosqlite:///./plse.db"

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # CORS
    cors_origins: str = "http://localhost:3000,https://*.vercel.app"

    # Cache
    cache_ttl_seconds: int = 3600  # 1 hour

    # Search
    default_page_size: int = 20
    max_page_size: int = 100

    # Rate limiting
    rate_limit_per_minute: int = 60

    model_config = {"env_file": ".env", "env_prefix": "PLSE_"}


settings = Settings()
