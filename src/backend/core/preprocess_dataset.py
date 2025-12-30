"""
Dataset preprocessing module for loading and processing viral image clusters.

This module handles downloading clusters and metadata from Hugging Face,
formatting filepaths, filtering datasets, and saving the processed data
as a Parquet file for efficient loading.
"""
import logging
from pathlib import Path
from typing import Dict, List, Set, Optional
from datasets import load_dataset, Dataset
import pandas as pd

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Configuration constants
CLUSTERS_DATASET = "L4CCH/viral-images"
CLUSTERS_DATA_FILE = "clusters.json"
METADATA_DATASET = "biglam/newspaper-navigator"
METADATA_CONFIG = "photos"
OUTPUT_FILE = "processed_dataset.parquet"
CLUSTER_ID_TO_REMOVE = "0"


def format_filepath_to_path(filepath: str) -> str:
    """
    Convert filepath from underscore-separated format to path format.
    
    Args:
        filepath: Filepath in format 'a_b_c_d_e_f_g_h_i_j_k_l'
        
    Returns:
        Formatted filepath in format 'a_b_c/d/e/f/g/h/i_j_k_l.jpg'
    """
    parts = filepath.split("_")
    if len(parts) >= 11:
        return f"{parts[0]}_{parts[1]}_{parts[2]}/{parts[3]}/{parts[4]}/{parts[5]}/{parts[6]}/{parts[7]}/{'_'.join(parts[8:])}.jpg"
    return filepath


def format_path_to_filepath(filepath: str) -> str:
    """
    Convert filepath from path format to underscore-separated format.
    
    Args:
        filepath: Filepath in format 'a/b/c.jpg'
        
    Returns:
        Formatted filepath in format 'a_b_c'
    """
    path_parts = filepath.split("/")
    if len(path_parts) > 1:
        directory = "_".join(path_parts[:-1])
        filename = path_parts[-1].replace(".jpg", "")
        return f"{directory}_{filename}"
    return filepath.replace(".jpg", "")


def load_clusters() -> Dict[str, List[str]]:
    """
    Load clusters from Hugging Face dataset.
    
    Returns:
        Dictionary mapping cluster IDs to lists of image filepaths
        
    Raises:
        Exception: If dataset loading fails
    """
    try:
        logger.info(f"Loading clusters from Hugging Face: {CLUSTERS_DATASET}")
        clusters_dataset = load_dataset(CLUSTERS_DATASET, data_files=CLUSTERS_DATA_FILE)
        clusters = clusters_dataset["train"][0]
        
        # Remove cluster with id 0 if present
        if CLUSTER_ID_TO_REMOVE in clusters:
            del clusters[CLUSTER_ID_TO_REMOVE]
            logger.info(f"Removed cluster with id {CLUSTER_ID_TO_REMOVE}")
        
        # Log cluster statistics
        if clusters:
            largest_cluster_size = max(len(image_ids) for image_ids in clusters.values())
            logger.info(f"Largest cluster size: {largest_cluster_size:,}")
            logger.info(f"Total clusters: {len(clusters):,}")
        else:
            raise ValueError("No clusters found in dataset")
            
        return clusters
    except Exception as e:
        logger.error(f"Failed to load clusters: {e}")
        raise


def extract_and_format_filepaths(clusters: Dict[str, List[str]]) -> Set[str]:
    """
    Extract all filepaths from clusters and format them for metadata lookup.
    
    Args:
        clusters: Dictionary mapping cluster IDs to lists of image filepaths
        
    Returns:
        Set of formatted filepaths ready for metadata filtering
    """
    logger.info("Extracting filepaths from clusters...")
    all_filepaths = set()
    for image_ids in clusters.values():
        all_filepaths.update(image_ids)
    
    logger.info(f"Total unique filepaths in clusters: {len(all_filepaths):,}")
    
    # Format filepaths for metadata lookup
    formatted_filepaths = {format_filepath_to_path(fp) for fp in all_filepaths}
    logger.info(f"Total unique formatted filepaths: {len(formatted_filepaths):,}")
    
    return formatted_filepaths


def load_and_filter_metadata(formatted_filepaths: Set[str]) -> Dataset:
    """
    Load image metadata from Hugging Face and filter by filepaths.
    
    Args:
        formatted_filepaths: Set of formatted filepaths to filter by
        
    Returns:
        Filtered dataset containing only matching metadata
        
    Raises:
        Exception: If dataset loading or filtering fails
    """
    try:
        logger.info(f"Loading image metadata from Hugging Face: {METADATA_DATASET}")
        image_metadata_dataset = load_dataset(METADATA_DATASET, METADATA_CONFIG)
        
        logger.info("Filtering image metadata dataset...")
        filtered_dataset = image_metadata_dataset["train"].filter(
            lambda example: example["filepath"] in formatted_filepaths
        )
        
        logger.info(f"Filtered metadata dataset size: {len(filtered_dataset):,}")
        
        if len(filtered_dataset) == 0:
            raise ValueError("No matching metadata found for the provided filepaths")
            
        return filtered_dataset
    except Exception as e:
        logger.error(f"Failed to load or filter metadata: {e}")
        raise


def create_filepath_to_cluster_mapping(clusters: Dict[str, List[str]]) -> Dict[str, str]:
    """
    Create a reverse mapping from filepath to cluster_id for efficient lookup.
    
    Args:
        clusters: Dictionary mapping cluster IDs to lists of image filepaths
        
    Returns:
        Dictionary mapping filepaths to cluster IDs
    """
    filepath_to_cluster = {}
    for cluster_id, image_ids in clusters.items():
        for filepath in image_ids:
            filepath_to_cluster[filepath] = cluster_id
    return filepath_to_cluster


def add_cluster_ids_to_dataset(
    dataset: Dataset,
    clusters: Dict[str, List[str]]
) -> Dataset:
    """
    Add cluster_id column to dataset by matching filepaths.
    
    Args:
        dataset: Dataset to add cluster IDs to
        clusters: Dictionary mapping cluster IDs to lists of image filepaths
        
    Returns:
        Dataset with cluster_id column added
    """
    logger.info("Adding cluster_id to filtered dataset...")
    
    # Create reverse lookup for O(1) access instead of O(n) search
    filepath_to_cluster = create_filepath_to_cluster_mapping(clusters)
    
    def add_cluster_id(example: dict) -> dict:
        """Add cluster_id to a single example."""
        formatted_filepath = format_path_to_filepath(example["filepath"])
        example["cluster_id"] = filepath_to_cluster.get(formatted_filepath)
        return example
    
    return dataset.map(add_cluster_id)


def validate_output(df: pd.DataFrame, clusters: Dict[str, List[str]]) -> None:
    """
    Validate the processed dataset for data integrity.
    
    Args:
        df: Processed DataFrame
        clusters: Original clusters dictionary
        
    Raises:
        ValueError: If validation fails
    """
    logger.info("Validating processed dataset...")
    
    # Check for missing cluster_ids
    no_cluster_id = df[df["cluster_id"].isnull()]
    if len(no_cluster_id) > 0:
        logger.warning(f"Found {len(no_cluster_id):,} images without cluster_id")
    
    # Check which clusters are missing
    all_cluster_ids = set(clusters.keys())
    present_cluster_ids = set(df["cluster_id"].dropna().unique())
    missing_cluster_ids = all_cluster_ids - present_cluster_ids
    
    if missing_cluster_ids:
        logger.warning(f"Missing cluster_ids: {len(missing_cluster_ids)} clusters")
        if len(missing_cluster_ids) <= 10:
            logger.warning(f"Missing cluster IDs: {missing_cluster_ids}")
    
    logger.info(f"Validation complete. Dataset contains {len(df):,} records")


def preprocess_dataset(
    output_path: Optional[Path] = None,
    clusters_dataset: Optional[str] = None,
    metadata_dataset: Optional[str] = None
) -> Path:
    """
    Main preprocessing function that orchestrates the dataset processing pipeline.
    
    Args:
        output_path: Optional path to save the output file. Defaults to current directory.
        clusters_dataset: Optional Hugging Face dataset name for clusters
        metadata_dataset: Optional Hugging Face dataset name for metadata
        
    Returns:
        Path to the created output file
        
    Raises:
        Exception: If any step in the preprocessing pipeline fails
    """
    # Use provided datasets or defaults
    clusters_ds = clusters_dataset or CLUSTERS_DATASET
    metadata_ds = metadata_dataset or METADATA_DATASET
    
    try:
        # Step 1: Load clusters
        clusters = load_clusters()
        
        # Step 2: Extract and format filepaths
        formatted_filepaths = extract_and_format_filepaths(clusters)
        
        # Step 3: Load and filter metadata
        filtered_dataset = load_and_filter_metadata(formatted_filepaths)
        
        # Step 4: Format filepaths in dataset
        logger.info("Formatting filepaths in dataset...")
        filtered_dataset = filtered_dataset.map(
            lambda example: {
                "filepath": format_path_to_filepath(example["filepath"])
            }
        )
        
        # Step 5: Add cluster IDs
        filtered_dataset = add_cluster_ids_to_dataset(filtered_dataset, clusters)
        
        # Step 6: Convert to DataFrame
        logger.info("Converting filtered dataset to DataFrame...")
        filtered_df = pd.DataFrame(filtered_dataset)
        
        # Step 7: Validate output
        validate_output(filtered_df, clusters)
        
        # Step 8: Save to Parquet
        output_file = output_path or Path(OUTPUT_FILE)
        logger.info(f"Saving {len(filtered_df):,} records to {output_file}")
        filtered_df.to_parquet(output_file, index=False)
        
        # Verify file was created
        if not output_file.exists():
            raise FileNotFoundError(f"Output file was not created: {output_file}")
        
        file_size_mb = output_file.stat().st_size / (1024 * 1024)
        logger.info(f"Successfully saved dataset to {output_file} ({file_size_mb:.2f} MB)")
        
        return output_file
        
    except Exception as e:
        logger.error(f"Preprocessing failed: {e}", exc_info=True)
        raise


if __name__ == "__main__":
    preprocess_dataset()
