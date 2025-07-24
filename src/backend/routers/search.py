from fastapi import APIRouter

router = APIRouter(tags=["search"])

@router.get("/search/{query}")
async def get_search_results(query: str):
    # filter by newspaper title
    # filter by date range
    # return list of clusters
    # paginate results larger than 50
    # return metadata for each cluster
    return {"message": f"Return search results (list of clusters) for query: {query}"}
