from fastapi import APIRouter, Query, Depends
from typing import List, Optional
from datetime import date
from enum import Enum
from services.data import DataService
from dependencies import get_data_service
from models.schemas import Cluster, Facets, TimelineHistogram


router = APIRouter(tags=["search"])


class OrderBy(str, Enum):
    NEWSPAPER_COUNT = "newspaper_count"
    PUBLISHER_COUNT = "publisher_count"
    IMAGE_COUNT = "image_count"


class OrderDirection(str, Enum):
    ASC = "asc"
    DESC = "desc"


@router.get("/search", response_model=List[Cluster])
async def get_search_results(
    query: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    newspaper_name: Optional[str] = None,
    publisher: Optional[str] = None,
    page: int = 1,
    limit: int = Query(10, enum=[10, 50, 100]),  # Allow only 10, 50, or 100
    order_by: Optional[OrderBy] = None,
    order_direction: OrderDirection = OrderDirection.DESC,
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
        order_by=order_by.value if order_by else None,
        order_direction=order_direction.value,
    )


@router.get("/search/facets", response_model=Facets)
async def get_facets(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    data_service: DataService = Depends(get_data_service),
):
    """
    Get search facets (newspapers and publishers) with cluster counts.
    
    Facets can be filtered by date range to show only newspapers/publishers
    that have clusters within the specified date range.
    
    Args:
        start_date: Optional start date for filtering facets
        end_date: Optional end date for filtering facets
        
    Returns:
        Facets containing lists of newspapers and publishers with their cluster counts
    """
    return data_service.get_facets(start_date=start_date, end_date=end_date)


@router.get("/search/timeline", response_model=TimelineHistogram)
async def get_timeline_histogram(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    data_service: DataService = Depends(get_data_service),
):
    """
    Get timeline histogram data (cluster counts per year).
    
    The histogram can be filtered by date range to show only clusters
    within the specified date range.
    
    Args:
        start_date: Optional start date for filtering (YYYY-MM-DD format, auto-parsed by FastAPI)
        end_date: Optional end date for filtering (YYYY-MM-DD format, auto-parsed by FastAPI)
        
    Returns:
        TimelineHistogram containing year counts, total clusters, and min/max years
    """
    return data_service.get_timeline_histogram(start_date=start_date, end_date=end_date)
