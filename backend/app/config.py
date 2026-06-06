from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    default_llm_provider: str = "mimo"
    default_llm_model: str = "mimo-v2.5-pro"
    default_embedding_provider: str = "hunyuan"
    default_embedding_model: str = ""

    mimo_api_key: str = ""
    mimo_base_url: str = ""
    hunyuan_api_key: str = ""
    hunyuan_base_url: str = ""

    model_timeout_seconds: int = 45

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()

