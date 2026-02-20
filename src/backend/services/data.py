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
        start_date = df["pub_date"].min()
        end_date = df["pub_date"].max()
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
                "start_date": start_date.strftime("%Y-%m-%d"),
                "end_date": end_date.strftime("%Y-%m-%d"),
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
                "start_date": cluster_data["pub_date"].min().strftime("%Y-%m-%d"),
                "end_date": cluster_data["pub_date"].max().strftime("%Y-%m-%d"),
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
        newspaper_names: Optional[List[str]] = None,
        publishers: Optional[List[str]] = None,
        page: int = 1,
        limit: int = 10,
        offset: Optional[int] = None,
        order_by: Optional[str] = None,
        order_direction: str = "desc",
    ) -> List[Dict[str, Any]]:
        if self.dataset_df is None:
            return []

        filtered_df = self.dataset_df.copy()

        if start_date:
            filtered_df = filtered_df[filtered_df["pub_date"] >= pd.to_datetime(start_date)]
        if end_date:
            filtered_df = filtered_df[filtered_df["pub_date"] <= pd.to_datetime(end_date)]

        # Filter by newspaper names (OR logic: match any of the selected newspapers)
        if newspaper_names:
            mask = pd.Series(False, index=filtered_df.index)
            for n in newspaper_names:
                mask = mask | filtered_df["name"].str.contains(n, case=False, na=False, regex=False)
            filtered_df = filtered_df[mask]

        # Filter by publishers (OR logic: match any of the selected publishers)
        if publishers:
            mask = pd.Series(False, index=filtered_df.index)
            for p in publishers:
                mask = mask | filtered_df["publisher"].str.contains(p, case=False, na=False, regex=False)
            filtered_df = filtered_df[mask]

        if query:
            filtered_df = filtered_df[
                filtered_df["ocr_text"].str.contains(query, case=False, na=False, regex=False)
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

        # Calculate counts for sorting
        clustered_results["newspaper_count"] = clustered_results["newspapers"].apply(
            lambda x: len([n for n in x if n is not None and pd.notna(n)])
        )
        clustered_results["publisher_count"] = clustered_results["publishers"].apply(
            lambda x: len([p for p in x if p is not None and pd.notna(p)])
        )
        clustered_results["image_count"] = clustered_results["images"].apply(len)

        # Sort - default to image_count desc if not specified
        sort_by = order_by if order_by else "image_count"
        sort_direction = order_direction if order_by else "desc"  # Default desc for image_count
        ascending = sort_direction == "asc"
        clustered_results = clustered_results.sort_values(by=sort_by, ascending=ascending)

        # Apply pagination after sorting
        if offset is not None:
            start_index = offset
        else:
            start_index = (page - 1) * limit
        end_index = start_index + limit
        paginated_clusters = clustered_results.iloc[start_index:end_index]

        return [
            {
                "id": f"{row['cluster_id']}",
                "dates": {
                    "start_date": row["min_date"].strftime("%Y-%m-%d"),
                    "end_date": row["max_date"].strftime("%Y-%m-%d"),
                },
                "newspapers": _filter_none_values(row["newspapers"]),
                "publishers": _filter_none_values(row["publishers"]),
                "images": row["images"],
                "thumbnail": _resize_iiif_thumbnail(row["thumbnail"]) if pd.notna(row["thumbnail"]) else "",
            }
            for _, row in paginated_clusters.iterrows()
        ]

    def get_facets(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> Dict[str, List[Dict[str, Any]]]:
        """
        Get facets (newspapers and publishers) with cluster counts.
        
        Args:
            start_date: Optional start date for filtering
            end_date: Optional end date for filtering
            
        Returns:
            Dictionary with 'newspapers' and 'publishers' lists, each containing
            FacetItem-like dictionaries with 'name' and 'count' fields
        """
        if self.dataset_df is None:
            return {"newspapers": [], "publishers": []}

        df = self.dataset_df.copy()

        # Apply date filtering if provided
        if start_date:
            df = df[df["pub_date"] >= pd.to_datetime(start_date)]
        if end_date:
            df = df[df["pub_date"] <= pd.to_datetime(end_date)]

        # Compute newspaper facets: count unique clusters per newspaper
        newspaper_facets = {}
        if len(df) > 0:
            # Group by newspaper name and count unique cluster_ids
            newspaper_counts = (
                df[df["name"].notna()]
                .groupby("name")["cluster_id"]
                .nunique()
            )
            
            # Convert to dictionary: {name: count}
            newspaper_facets = {str(name): int(count) for name, count in newspaper_counts.items()}
            # Sort by key alphabetically
            newspaper_facets = dict(sorted(newspaper_facets.items()))

        # Compute publisher facets: count unique clusters per publisher
        publisher_facets = {}
        if len(df) > 0:
            # Group by publisher and count unique cluster_ids
            publisher_counts = (
                df[df["publisher"].notna()]
                .groupby("publisher")["cluster_id"]
                .nunique()
            )
            
            # Convert to dictionary: {name: count}
            publisher_facets = {str(name): int(count) for name, count in publisher_counts.items()}
            # Sort by key alphabetically
            publisher_facets = dict(sorted(publisher_facets.items()))

        return {
            "newspapers": newspaper_facets,
            "publishers": publisher_facets,
        }

    def get_timeline_histogram(
        self,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
    ) -> Dict[str, Any]:
        """
        Get timeline histogram data (cluster counts per year).
        
        Args:
            start_date: Optional start date for filtering
            end_date: Optional end date for filtering
            
        Returns:
            Dictionary with 'year_counts', 'total_clusters', 'min_year', 'max_year'
        """
        if self.dataset_df is None:
            return {
                "year_counts": [],
                "total_clusters": 0,
                "min_year": 1700,
                "max_year": 2024,
            }

        df = self.dataset_df.copy()

        # Apply date filtering if provided
        if start_date:
            df = df[df["pub_date"] >= pd.to_datetime(start_date)]
        if end_date:
            df = df[df["pub_date"] <= pd.to_datetime(end_date)]

        # Compute year histogram: count unique clusters per year
        year_counts = []
        if len(df) > 0:
            # Extract year from pub_date and group by year, count unique cluster_ids
            df["year"] = df["pub_date"].dt.year
            year_cluster_counts = (
                df[df["year"].notna()]
                .groupby("year")["cluster_id"]
                .nunique()
                .reset_index()
            )
            year_cluster_counts.columns = ["year", "count"]
            
            # Convert to list of dictionaries and sort by year
            year_counts = [
                {"year": int(row["year"]), "count": int(row["count"])}
                for _, row in year_cluster_counts.iterrows()
            ]
            year_counts.sort(key=lambda x: x["year"])

        # Calculate totals and min/max years
        total_clusters = sum(item["count"] for item in year_counts) if year_counts else 0
        min_year = min(item["year"] for item in year_counts) if year_counts else 1700
        max_year = max(item["year"] for item in year_counts) if year_counts else 2024

        return {
            "year_counts": year_counts,
            "total_clusters": total_clusters,
            "min_year": min_year,
            "max_year": max_year,
        }
