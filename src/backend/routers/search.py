from fastapi import APIRouter, Query, Depends
from typing import List, Optional
from datetime import date
from services.data import DataService
from dependencies import get_data_service
from models.schemas import Cluster


router = APIRouter(tags=["search"])


@router.get("/search", response_model=List[Cluster])
async def get_search_results(
    query: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    newspaper_name: Optional[str] = None,
    publisher: Optional[str] = None,
    page: int = 1,
    limit: int = Query(10, ge=1, le=10000),  # Allow any limit between 1 and 10000
    data_service: DataService = Depends(get_data_service),
):
    return data_service.search(
        query=query,
        start_date=start_date,
        end_date=end_date,
        newspaper_name=newspaper_name,
        publisher=publisher,
        page=page,
        limit=limit,
    )
