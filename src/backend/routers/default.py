from fastapi import APIRouter, Depends
from services.data import DataService
from dependencies import get_data_service
from models.schemas import DatasetMetadata

router = APIRouter()

@router.get("/", response_model=DatasetMetadata)
async def get_dataset_metedata(
    data_service: DataService = Depends(get_data_service),
):
    """
    Returns dataset summary info.
    """
    return data_service.get_metadata()
