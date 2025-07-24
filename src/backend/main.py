from fastapi import FastAPI
from contextlib import asynccontextmanager
from datasets import load_dataset
from routers import dataset, clusters, images, search
from core.config import settings

# @asynccontextmanager
# async def lifespan(app: FastAPI):
#     # Load the dataset and create the filepath to index mapping
#     print("Loading dataset...")
#     dataset = load_dataset("biglam/newspaper-navigator", "photos", split="train")
#     app.state.dataset = dataset
#     app.state.filepath_to_index = {item["filepath"]: i for i, item in enumerate(dataset)}
#     print("Dataset loaded.")
#     yield
#     # Clean up (optional)
#     print("Shutting down...")


app = FastAPI()

app.title = settings.api_title
app.description = settings.api_description
app.version = settings.api_version

app.include_router(dataset.router)
app.include_router(clusters.router)
app.include_router(images.router)
app.include_router(search.router)

# @app.get("/filepath_to_index")
# async def get_filepath_to_index():
#     return app.state.filepath_to_index
