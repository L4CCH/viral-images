from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import date as date_type


class ClusterDates(BaseModel):
    """Date range for a cluster."""
    first_year: int = Field(..., description="First year of publication in the cluster")
    last_year: int = Field(..., description="Last year of publication in the cluster")

    class Config:
        json_schema_extra = {
            "example": {
                "first_year": 1910,
                "last_year": 1915
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
                    "first_year": 1910,
                    "last_year": 1915
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

