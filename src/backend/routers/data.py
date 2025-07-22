import json
from fastapi import APIRouter, Query

router = APIRouter()

@router.get("/metadata")
def get_metadata(page: int = 1, page_size: int = 10):
    with open("data/processed/metadata.json") as f:
        data = json.load(f)
    start = (page - 1) * page_size
    end = start + page_size
    return data[start:end]

@router.get("/clusters")
def get_clusters(page: int = 1, page_size: int = 10):
    with open("data/processed/clusters.json") as f:
        data = json.load(f)
    start = (page - 1) * page_size
    end = start + page_size
    return data[start:end]
