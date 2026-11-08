from contextlib import asynccontextmanager
import logging
import os

from fastapi import FastAPI, APIRouter, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

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

api_router = APIRouter(prefix="/api")
api_router.include_router(default.router)
api_router.include_router(clusters.router)
api_router.include_router(images.router)
api_router.include_router(search.router)

# CORS: only needed for browsers calling the API from another origin (the
# Next.js dev server). The API is read-only and uses no cookies.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_content_security_policy(request: Request, call_next):
    response = await call_next(request)
    if settings.content_security_policy:
        response.headers.setdefault(
            "Content-Security-Policy", settings.content_security_policy
        )
    return response

app.title = settings.api_title
app.description = settings.api_description
app.version = settings.api_version

app.include_router(api_router)

static_dir = "/app/static"
if os.path.isdir(static_dir):
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="frontend")
