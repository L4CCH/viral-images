from fastapi import APIRouter
from core.config import settings

router = APIRouter()


@router.get("/")
async def get_dataset_metedata():

    metadata = {
        "id": "viral_images_api",
        "about": {
            "title": settings.api_title,
            "description": settings.api_description,
            "version": settings.api_version,
        },
        "dates": {"first_year": 1900, "last_year": 2020},
        "clusters": 2000,
        "images": 1500000,
        "newspapers": 200,
    }

    return metadata
