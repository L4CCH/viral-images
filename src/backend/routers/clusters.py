from fastapi import APIRouter, HTTPException, Depends
from services.data import DataService
from dependencies import get_data_service

router = APIRouter(tags=["clusters"])


@router.get("/cluster/{cluster_id}")
async def get_cluster_metadata(
    cluster_id: str,
    data_service: DataService = Depends(get_data_service),
):
    metadata = data_service.get_cluster(cluster_id)
    
    if metadata is None:
        raise HTTPException(status_code=404, detail="Cluster not found")

    return metadata
