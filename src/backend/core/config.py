from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # API settings
    api_title: str = "Viral Images API"
    api_description: str = (
        "Clusters of reprinted images from the Newspaper Navigator dataset"
    )
    api_version: str = "0.1.0"

    # Origins allowed to call the API from a browser (CORS). In production the
    # static site is served by this app (same origin), so only the Next.js dev
    # server needs to be listed. Override with a JSON list, e.g.
    #   CORS_ORIGINS='["https://example.org"]'
    # Note: this does not affect loading images from the Library of Congress;
    # <img> requests don't use CORS, and tile.loc.gov sets its own headers.
    cors_origins: list[str] = ["http://localhost:3000"]

    # Content-Security-Policy sent with every response. It limits where images
    # may be loaded from to this site and the Library of Congress image servers.
    # Scripts/styles are intentionally not restricted: the Next.js static export
    # relies on inline scripts. Set to an empty string to disable.
    content_security_policy: str = (
        "img-src 'self' data: https://tile.loc.gov https://chroniclingamerica.loc.gov; "
        "object-src 'none'; "
        "base-uri 'self'"
    )


settings = Settings()
