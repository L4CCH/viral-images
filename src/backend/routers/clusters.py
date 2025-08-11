import json
from fastapi import APIRouter, Query, HTTPException, Request

router = APIRouter(tags=["clusters"])


@router.get("/cluster/{cluster_id}")
async def get_cluster_metadata(cluster_id: str, request: Request):

    df = request.app.state.dataset_df

    if cluster_id not in df["cluster_id"].values:
        raise HTTPException(status_code=404, detail="Cluster not found")

    # filter the DataFrame for the given cluster_id
    cluster_data = df[df["cluster_id"] == cluster_id]

    if cluster_data.empty:
        raise HTTPException(status_code=404, detail="No data found for this cluster")

    metadata = {
        "id": f"{cluster_id}",
        "dates": {
            "first_year": cluster_data["pub_date"].min().year,
            "last_year": cluster_data["pub_date"].max().year,
        },
        "newspapers": cluster_data["name"].unique().tolist(),
        "publishers": cluster_data["publisher"].unique().tolist(),
        "images": [row["filepath"] for _, row in cluster_data.iterrows()],
    }

    return metadata
