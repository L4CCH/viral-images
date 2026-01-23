from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import date as date_type


class ClusterDates(BaseModel):
    """Date range for a cluster."""
    start_date: str = Field(..., description="Start date of publication in the cluster (YYYY-MM-DD format)")
    end_date: str = Field(..., description="End date of publication in the cluster (YYYY-MM-DD format)")

    class Config:
        json_schema_extra = {
            "example": {
                "start_date": "1910-01-01",
                "end_date": "1915-12-31"
            }
        }


class Cluster(BaseModel):
    """Cluster schema representing a group of similar images."""
    id: str = Field(..., description="Unique cluster identifier")
    dates: ClusterDates = Field(..., description="Date range of publications in the cluster")
    newspapers: List[str] = Field(..., description="List of newspaper names in the cluster")
    publishers: List[str] = Field(..., description="List of publisher names in the cluster")
    images: List[str] = Field(..., description="List of image file paths in the cluster")
    thumbnail: str = Field(..., description="URL of the first image in the cluster")

    class Config:
        json_schema_extra = {
            "example": {
                "id": "cluster_123",
                "dates": {
                    "start_date": "1910-01-01",
                    "end_date": "1915-12-31"
                },
                "newspapers": ["The New York Times", "The Washington Post"],
                "publishers": ["Publisher A", "Publisher B"],
                "images": [
                    "path/to/image1.jpg",
                    "path/to/image2.jpg"
                ],
                "thumbnail": "https://example.com/image1.jpg"
            }
        }


class Image(BaseModel):
    """Image schema representing a single image from the dataset."""
    id: str = Field(..., description="Unique image identifier (filepath)")
    date: date_type = Field(..., description="Publication date")
    newspaper: Optional[str] = Field(None, description="Name of the newspaper")
    publisher: Optional[str] = Field(None, description="Name of the publisher")
    place: Optional[str] = Field(None, description="Place of publication")
    url: str = Field(..., description="URL to the image file")
    iiif: str = Field(..., description="IIIF annotation URL for the image")
    cluster: str = Field(..., description="Cluster ID this image belongs to")
    ocr: str = Field(default="", description="OCR text extracted from the image")

    class Config:
        json_schema_extra = {
            "example": {
                "id": "nbu_irons_ver01_data_2010270504_00237284768_1918102201_0615_004_0_96",
                "date": "1918-10-22",
                "newspaper": "The North Platte semi-weekly tribune.",
                "publisher": "I.L. Bare",
                "place": "North Platte, Neb.",
                "url": "https://news-navigator.labs.loc.gov/data/nbu_irons_ver01/data/2010270504/00237284768/1918102201/0615/004_0_96.jpg",
                "iiif": "http://example.com/image/nbu_irons_ver01_data_2010270504_00237284768_1918102201_0615_004_0_96/annotation.json",
                "cluster": "1241",
                "ocr": ""
            }
        }


class Facets(BaseModel):
    """Facets schema containing newspaper and publisher facets with cluster counts."""
    newspapers: Dict[str, int] = Field(..., description="Dictionary of newspaper names to cluster counts")
    publishers: Dict[str, int] = Field(..., description="Dictionary of publisher names to cluster counts")

    class Config:
        json_schema_extra = {
            "example": {
                "newspapers": {
                    "The New York Times": 42,
                    "The Washington Post": 35
                },
                "publishers": {
                    "Publisher A": 28,
                    "Publisher B": 19
                }
            }
        }


class YearCount(BaseModel):
    """A single year with its cluster count."""
    year: int = Field(..., description="Year")
    count: int = Field(..., description="Number of unique clusters in this year")

    class Config:
        json_schema_extra = {
            "example": {
                "year": 1910,
                "count": 42
            }
        }


class TimelineHistogram(BaseModel):
    """Timeline histogram schema containing year counts for cluster distribution."""
    year_counts: List[YearCount] = Field(..., description="List of years with cluster counts")
    total_clusters: int = Field(..., description="Total number of clusters across all years")
    min_year: int = Field(..., description="Earliest year in the dataset")
    max_year: int = Field(..., description="Latest year in the dataset")

    class Config:
        json_schema_extra = {
            "example": {
                "year_counts": [
                    {"year": 1910, "count": 42},
                    {"year": 1911, "count": 35},
                    {"year": 1912, "count": 28}
                ],
                "total_clusters": 105,
                "min_year": 1910,
                "max_year": 1912
            }
        }


class DatasetMetadata(BaseModel):
    """Dataset metadata schema."""
    id: str = Field(..., description="Dataset identifier")
    about: Dict[str, str] = Field(..., description="About information")
    dates: Dict[str, str] = Field(..., description="Date range with start_date and end_date in YYYY-MM-DD format")
    clusters: int = Field(..., description="Number of unique clusters")
    images: int = Field(..., description="Total number of images")
    newspapers: int = Field(..., description="Number of unique newspapers")
    publishers: int = Field(..., description="Number of unique publishers")
    columns: str = Field(..., description="List of dataset columns")

    class Config:
        json_schema_extra = {
            "example": {
                "id": "viral_images_api",
                "about": {
                    "title": "Viral Images API",
                    "description": "API for viral images dataset",
                    "version": "1.0.0"
                },
                "dates": {
                    "start_date": "1910-01-01",
                    "end_date": "1915-12-31"
                },
                "clusters": 1000,
                "images": 5000,
                "newspapers": 50,
                "publishers": 30,
                "columns": "['filepath', 'pub_date', 'name', 'publisher', ...]"
            }
        }

