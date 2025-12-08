import logging
import pandas as pd
from datetime import date
from typing import Optional, List, Dict, Any
from core.config import settings

class DataService:
    def __init__(self):
        self.dataset_df: Optional[pd.DataFrame] = None

    def load_data(self, data_path: str = "/data/processed_dataset.parquet"):
        try:
            logging.info("Loading dataset...")
            df = pd.read_parquet(data_path)

            logging.info("Preprocessing OCR data for search...")
            # Join the list of words in 'ocr' into a single string for faster search
            df["ocr_text"] = df["ocr"].apply(
                lambda x: " ".join(x) if isinstance(x, list) else ""
            )

            # Convert 'pub_date' to datetime objects for efficient filtering
            df["pub_date"] = pd.to_datetime(df["pub_date"], errors="coerce")

            self.dataset_df = df
            logging.info("OCR data preprocessing complete.")
            logging.info(f"Loaded dataset with {len(df)} rows")

        except Exception as e:
            logging.error(f"Failed to load dataset: {e}")
            raise

    def get_metadata(self) -> Dict[str, Any]:
        if self.dataset_df is None:
            return {}

        df = self.dataset_df
        first_date = df["pub_date"].min().year
        last_date = df["pub_date"].max().year
        unique_newspapers = df["name"].nunique()
        unique_clusters = df["cluster_id"].nunique()
        unique_publishers = df["publisher"].nunique()

        return {
            "id": "viral_images_api",
            "about": {
                "title": settings.api_title,
                "description": settings.api_description,
                "version": settings.api_version,
            },
            "dates": {
                "first_year": f"{first_date}",
                "last_year": f"{last_date}",
            },
            "clusters": unique_clusters,
            "images": len(df),
            "newspapers": unique_newspapers,
            "publishers": unique_publishers,
            "columns": f"{list(df.columns)}",
        }

    def get_cluster(self, cluster_id: str) -> Optional[Dict[str, Any]]:
        if self.dataset_df is None:
            return None

        df = self.dataset_df
        if cluster_id not in df["cluster_id"].values:
            return None

        cluster_data = df[df["cluster_id"] == cluster_id]
        if cluster_data.empty:
            return None

        return {
            "id": f"{cluster_id}",
            "dates": {
                "first_year": cluster_data["pub_date"].min().year,
                "last_year": cluster_data["pub_date"].max().year,
            },
            "newspapers": cluster_data["name"].unique().tolist(),
            "publishers": cluster_data["publisher"].unique().tolist(),
            "images": [row["filepath"] for _, row in cluster_data.iterrows()],
        }

    def get_image(self, image_id: str) -> Optional[Dict[str, Any]]:
        if self.dataset_df is None:
            return None

        df = self.dataset_df
        if image_id not in df["filepath"].values:
            return None

        image_data = df[df["filepath"] == image_id].iloc[0]

        return {
            "id": f"{image_id}",
            "date": image_data["pub_date"].strftime("%Y-%m-%d"),
            "newspaper": image_data["name"],
            "publisher": image_data["publisher"],
            "place": image_data["place_of_publication"],
            "url": image_data["url"],
            "iiif": f"http://example.com/image/{image_id}/annotation.json",
            "cluster": image_data["cluster_id"],
            "ocr": image_data["ocr_text"],
        }

    def search(
        self,
        query: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        newspaper_name: Optional[str] = None,
        publisher: Optional[str] = None,
        page: int = 1,
        limit: int = 10,
    ) -> List[Dict[str, Any]]:
        if self.dataset_df is None:
            return []

        filtered_df = self.dataset_df.copy()

        if start_date:
            filtered_df = filtered_df[filtered_df["pub_date"] >= pd.to_datetime(start_date)]
        if end_date:
            filtered_df = filtered_df[filtered_df["pub_date"] <= pd.to_datetime(end_date)]

        if newspaper_name:
            filtered_df = filtered_df[
                filtered_df["name"].str.contains(newspaper_name, case=False, na=False)
            ]

        if publisher:
            filtered_df = filtered_df[
                filtered_df["publisher"].str.contains(publisher, case=False, na=False)
            ]

        if query:
            filtered_df = filtered_df[
                filtered_df["ocr_text"].str.contains(query, case=False, na=False)
            ]

        clustered_results = (
            filtered_df.groupby("cluster_id")["filepath"].apply(list).reset_index()
        )

        start_index = (page - 1) * limit
        end_index = start_index + limit
        paginated_clusters = clustered_results.iloc[start_index:end_index]

        return [
            {"cluster_id": row["cluster_id"], "images": row["filepath"]}
            for _, row in paginated_clusters.iterrows()
        ]
