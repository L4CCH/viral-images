from fastapi import APIRouter, Request
import pandas as pd

from core.config import settings

router = APIRouter()


@router.get("/")
async def get_dataset_metedata(request: Request):

    df = request.app.state.dataset_df

    first_date = df["pub_date"].min()
    last_date = df["pub_date"].max()

    metadata = {
        "id": "viral_images_api",
        "about": {
            "title": settings.api_title,
            "description": settings.api_description,
            "version": settings.api_version,
        },
        "dates": {
            "first_year": f"{first_date}",
            "last_year": f"{last_date}",
        },
        "clusters": 2000,
        "images": len(df),
        "newspapers": 200,
        "timeline": {
            "2020": {
                "clusters": 100,
                "images": 500,
                "newspapers": 50,
            },
            "2021": {
                "clusters": 200,
                "images": 600,
                "newspapers": 60,
            },
        },
        "columns": f"{list(df.columns)}",
    }

    return metadata
