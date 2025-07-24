from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # API settings
    api_title: str = "Viral Images API"
    api_description: str = (
        "Clusters of reprinted images from the Newspaper Navigator dataset"
    )
    api_version: str = "0.1.0"


settings = Settings()
