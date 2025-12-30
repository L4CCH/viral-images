import logging
import re
import pandas as pd
from datetime import date
from typing import Optional, List, Dict, Any
from core.config import settings


def _filter_none_values(items: List[Any]) -> List[str]:
    """Filter out None values from a list and convert to strings."""
    return [str(item) for item in items if item is not None and pd.notna(item)]


def _resize_iiif_thumbnail(url: str, size: int = 25) -> str:
    """
    Resize IIIF thumbnail URL by replacing the size parameter.
    
    Args:
        url: Original IIIF URL (e.g., .../pct:100/0/default.jpg)
        size: Desired size percentage (default: 25)
        
    Returns:
        Resized IIIF URL with the new size parameter
    """
    if not url or not isinstance(url, str):
        return url
    
    # Replace /pct:100/ with /pct:25/ (or specified size)
    # Handle both /pct:100/ and /pct:100.0/ patterns
    pattern = r'/pct:\d+(?:\.\d+)?/'
    replacement = f'/pct:{size}/'
    resized_url = re.sub(pattern, replacement, url)
    
    return resized_url


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

    def get_all_clusters(self, page: int = 1, limit: int = 10) -> List[Dict[str, Any]]:
        if self.dataset_df is None:
            return []

        df = self.dataset_df
        unique_clusters = df["cluster_id"].unique()
        
        clusters = []
        for cluster_id in unique_clusters:
            cluster_data = df[df["cluster_id"] == cluster_id]
            image_paths = [row["filepath"] for _, row in cluster_data.iterrows()]
            
            # Get thumbnail URL from first image and resize it
            thumbnail = ""
            if image_paths:
                first_image = cluster_data.iloc[0]
                if pd.notna(first_image["prediction_section_iiif_url"]):
                    thumbnail = _resize_iiif_thumbnail(first_image["prediction_section_iiif_url"])
            
            clusters.append({
                "id": f"{cluster_id}",
                "dates": {
                    "first_year": cluster_data["pub_date"].min().year,
                    "last_year": cluster_data["pub_date"].max().year,
                },
                "newspapers": _filter_none_values(cluster_data["name"].unique().tolist()),
                "publishers": _filter_none_values(cluster_data["publisher"].unique().tolist()),
                "images": image_paths,
                "thumbnail": thumbnail,
            })
        
        # Apply pagination
        start_index = (page - 1) * limit
        end_index = start_index + limit
        paginated_clusters = clusters[start_index:end_index]
        
        return paginated_clusters

    def get_cluster(self, cluster_id: str) -> Optional[Dict[str, Any]]:
        if self.dataset_df is None:
            return None

        df = self.dataset_df
        if cluster_id not in df["cluster_id"].values:
            return None

        cluster_data = df[df["cluster_id"] == cluster_id]
        if cluster_data.empty:
            return None

        image_paths = [row["filepath"] for _, row in cluster_data.iterrows()]
        
        # Get thumbnail URL from first image and resize it
        thumbnail = ""
        if image_paths:
            first_image = cluster_data.iloc[0]
            if pd.notna(first_image["prediction_section_iiif_url"]):
                thumbnail = _resize_iiif_thumbnail(first_image["prediction_section_iiif_url"])

        return {
            "id": f"{cluster_id}",
            "dates": {
                "first_year": cluster_data["pub_date"].min().year,
                "last_year": cluster_data["pub_date"].max().year,
            },
            "newspapers": _filter_none_values(cluster_data["name"].unique().tolist()),
            "publishers": _filter_none_values(cluster_data["publisher"].unique().tolist()),
            "images": image_paths,
            "thumbnail": thumbnail,
        }

    def get_image(self, image_id: str) -> Optional[Dict[str, Any]]:
        if self.dataset_df is None:
            return None

        df = self.dataset_df
        if image_id not in df["filepath"].values:
            return None

        image_data = df[df["filepath"] == image_id].iloc[0]

        # Handle None values for optional fields
        newspaper = image_data["name"] if pd.notna(image_data["name"]) else None
        publisher = image_data["publisher"] if pd.notna(image_data["publisher"]) else None
        place = image_data["place_of_publication"] if pd.notna(image_data["place_of_publication"]) else None
        ocr = image_data["ocr_text"] if pd.notna(image_data["ocr_text"]) else ""

        # Convert pandas Timestamp to Python date object
        pub_date = image_data["pub_date"]
        if pd.notna(pub_date):
            # Convert pandas Timestamp to Python date
            if hasattr(pub_date, 'date'):
                date_obj = pub_date.date()
            else:
                # Fallback if it's already a date
                date_obj = pub_date
        else:
            raise ValueError(f"Invalid date for image {image_id}")

        return {
            "id": f"{image_id}",
            "date": date_obj,
            "newspaper": newspaper,
            "publisher": publisher,
            "place": place,
            "url": image_data["prediction_section_iiif_url"],
            "iiif": f"http://example.com/image/{image_id}/annotation.json",
            "cluster": f"{image_data['cluster_id']}",
            "ocr": ocr,
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
            filtered_df.groupby("cluster_id").agg({
                "filepath": list,
                "pub_date": ["min", "max"],
                "name": lambda x: x.unique().tolist(),
                "publisher": lambda x: x.unique().tolist(),
                "prediction_section_iiif_url": "first",  # Get first image URL for thumbnail
            }).reset_index()
        )
        clustered_results.columns = ["cluster_id", "images", "min_date", "max_date", "newspapers", "publishers", "thumbnail"]

        start_index = (page - 1) * limit
        end_index = start_index + limit
        paginated_clusters = clustered_results.iloc[start_index:end_index]

        return [
            {
                "id": f"{row['cluster_id']}",
                "dates": {
                    "first_year": row["min_date"].year,
                    "last_year": row["max_date"].year,
                },
                "newspapers": _filter_none_values(row["newspapers"]),
                "publishers": _filter_none_values(row["publishers"]),
                "images": row["images"],
                "thumbnail": _resize_iiif_thumbnail(row["thumbnail"]) if pd.notna(row["thumbnail"]) else "",
            }
            for _, row in paginated_clusters.iterrows()
        ]
