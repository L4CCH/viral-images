from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List
from services.data import DataService
from dependencies import get_data_service
from models.schemas import Cluster

router = APIRouter(tags=["clusters"])


@router.get("/clusters", response_model=List[Cluster])
async def get_all_clusters(
    page: int = 1,
    limit: int = Query(10, ge=1, le=100),  # Allow any limit between 1 and 100
    data_service: DataService = Depends(get_data_service),
):
    clusters = data_service.get_all_clusters(page=page, limit=limit)
    return clusters


@router.get("/clusters/{cluster_id}", response_model=Cluster)
async def get_cluster_metadata(
    cluster_id: str,
    data_service: DataService = Depends(get_data_service),
):
    metadata = data_service.get_cluster(cluster_id)
    
    if metadata is None:
        raise HTTPException(status_code=404, detail="Cluster not found")

    return metadata
