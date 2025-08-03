from fastapi import APIRouter, Request, Query
from typing import List, Optional
from datetime import date
import pandas as pd


router = APIRouter(tags=["search"])


@router.get("/search")
async def get_search_results(
    request: Request,
    query: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    newspaper_name: Optional[str] = None,
    publisher: Optional[str] = None,
    page: int = 1,
    limit: int = Query(10, enum=[10, 50, 100]),
):
    dataset_df = request.app.state.dataset_df

    # Create a copy to avoid modifying the original DataFrame
    filtered_df = dataset_df.copy()

    # Filter by date range
    if start_date:
        filtered_df = filtered_df[filtered_df["pub_date"] >= pd.to_datetime(start_date)]
    if end_date:
        filtered_df = filtered_df[filtered_df["pub_date"] <= pd.to_datetime(end_date)]

    # Filter by newspaper name (case-insensitive)
    if newspaper_name:
        filtered_df = filtered_df[
            filtered_df["name"].str.contains(newspaper_name, case=False, na=False)
        ]

    # Filter by publisher (case-insensitive)
    if publisher:
        filtered_df = filtered_df[
            filtered_df["publisher"].str.contains(publisher, case=False, na=False)
        ]

    # Search the preprocessed 'ocr_text' column if a query is provided
    if query:
        search_results = filtered_df[
            filtered_df["ocr_text"].str.contains(query, case=False, na=False)
        ]
    else:
        search_results = filtered_df

    # Paginate the results
    start_index = (page - 1) * limit
    end_index = start_index + limit
    paginated_results = search_results.iloc[start_index:end_index]

    # Return the 'filepath' column as a list
    return paginated_results["filepath"].tolist()
