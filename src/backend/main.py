from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
import logging



from routers import default, clusters, images, search
from core.config import settings
from services.data import DataService

logging.basicConfig(
    level=logging.INFO,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        data_service = DataService()
        data_service.load_data()
        app.state.data_service = data_service
        
    except Exception as e:
        logging.error(f"Failed to load dataset: {e}")
        raise

    yield
    app.state.data_service = None


app = FastAPI(lifespan=lifespan)

app.title = settings.api_title
app.description = settings.api_description
app.version = settings.api_version

app.include_router(default.router)
app.include_router(clusters.router)
app.include_router(images.router)
app.include_router(search.router)
