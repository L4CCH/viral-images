from fastapi import APIRouter, Request
import pandas as pd

from core.config import settings

router = APIRouter()


@router.get("/")
async def get_dataset_metedata(request: Request):

    df = request.app.state.dataset_df

    first_date = df["pub_date"].min()
    last_date = df["pub_date"].max()

    # variable that count the of unique newspapers
    unique_newspapers = df["name"].nunique()

    # variable that count the number of unique clusters
    unique_clusters = df["cluster_id"].nunique()

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
        "clusters": unique_clusters,
        "images": len(df),
        "newspapers": unique_newspapers,
        "columns": f"{list(df.columns)}",
    }

    return metadata
