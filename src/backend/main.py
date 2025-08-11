from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
import logging

import pandas as pd

from routers import default, clusters, images, search
from core.config import settings

logging.basicConfig(
    level=logging.INFO,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        logging.info("Loading dataset...")
        dataset_df = pd.read_parquet("/data/processed_dataset.parquet")

        # The parquet file already contains a pandas DataFrame, no conversion needed
        logging.info("Preprocessing OCR data for search...")

        # Join the list of words in 'ocr' into a single string for faster search
        dataset_df["ocr_text"] = dataset_df["ocr"].apply(
            lambda x: " ".join(x) if isinstance(x, list) else ""
        )

        # Convert 'pub_date' to datetime objects for efficient filtering
        dataset_df["pub_date"] = pd.to_datetime(dataset_df["pub_date"], errors="coerce")

        app.state.dataset_df = dataset_df
        logging.info("OCR data preprocessing complete.")

        logging.info(f"Loaded dataset with {len(dataset_df)} rows")
        # logging.info(f"First 10 OCR entries: {dataset_df['ocr'].head(10).tolist()}")

    except Exception as e:
        logging.error(f"Failed to load dataset: {e}")
        raise

    yield
    app.state.dataset_df = None


app = FastAPI(lifespan=lifespan)

app.title = settings.api_title
app.description = settings.api_description
app.version = settings.api_version

app.include_router(default.router)
app.include_router(clusters.router)
app.include_router(images.router)
app.include_router(search.router)
