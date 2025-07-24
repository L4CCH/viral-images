import json
from fastapi import APIRouter, Query, HTTPException, Request

router = APIRouter(tags=["clusters"])


@router.get("/cluster/{cluster_id}")
async def get_cluster_metadata(cluster_id: str):

    metadata = {
        "id": f"{cluster_id}",
        "dates": {"first_year": 1900, "last_year": 2020},
        "newspapers": ["Newspaper A", "Newspaper B"],
        "images": [
            {"id": "path_to_image1", "url": "path/to/image1.jpg"},
            {"id": "path_to_image2", "url": "path/to/image2.jpg"},
            {"id": "path_to_image3", "url": "path/to/image3.jpg"},
        ],
    }

    return metadata
