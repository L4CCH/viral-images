from datasets import load_dataset
import pandas as pd


def preprocess_dataset():

    # Load the clusters from Hugging Face
    print("Loading clusters from Hugging Face...")
    clusters_dataset = load_dataset("L4CCH/viral-images", data_files="clusters.json")
    clusters = clusters_dataset["train"][0]

    # Remove cluster with id 0
    if "0" in clusters:
        del clusters["0"]

    # Print largest cluster
    largest_cluster_size = max(len(image_ids) for image_ids in clusters.values())
    print(f"Largest cluster size: {largest_cluster_size}")

    # # Print cluster sizes
    # cluster_sizes = [len(image_ids) for image_ids in clusters.values()]
    # print("Cluster sizes:")
    # print(pd.Series(cluster_sizes).describe())

    # Create a set of all filepaths (image identifiers) present in any clusters
    all_filepaths = set()
    for image_ids in clusters.values():
        all_filepaths.update(image_ids)

    # Print all_filepaths count
    print(f"Total unique filepaths in clusters: {len(all_filepaths):,}")

    # Format all_filepaths set to match the 'a_b_c' to 'a/b/c.jpg' style
    formatted_filepaths = set()
    for filepath in all_filepaths:
        parts = filepath.split("_")
        if len(parts) >= 11:
            formatted_filepath = f"{parts[0]}_{parts[1]}_{parts[2]}/{parts[3]}/{parts[4]}/{parts[5]}/{parts[6]}/{parts[7]}/{'_'.join(parts[8:])}.jpg"
            formatted_filepaths.add(formatted_filepath)
        else:
            # Keep original if it doesn't match expected format
            formatted_filepaths.add(filepath)

    print(f"Total unique formatted filepaths: {len(formatted_filepaths):,}")

    # # Print first 10 formatted filepaths
    # print("First 10 formatted filepaths:")
    # for filepath in list(formatted_filepaths)[:10]:
    #     print(filepath)

    # Load the image metadata from Hugging Face, filtering by filepaths in clusters

    print("Loading image metadata from Hugging Face")
    image_metadata_dataset = load_dataset("biglam/newspaper-navigator", "photos")

    # print something to indicate we're processing
    print("Filtering image metadata dataset...")
    filtered_dataset = image_metadata_dataset["train"].filter(
        lambda example: example["filepath"] in formatted_filepaths
    )

    print("Filtered metadata dataset size:", len(filtered_dataset))

    # Format filter_dataset "filepath" column, turning / into _ and removing .jpg
    filtered_dataset = filtered_dataset.map(
        lambda example: {
            "filepath": "_".join(example["filepath"].split("/")[:-1])
            + "_"
            + example["filepath"].split("/")[-1].replace(".jpg", "")
        }
    )

    # Add a 'cluster_id' column to the filtered dataset
    print("Adding cluster_id to filtered dataset...")

    def add_cluster_id(example):
        for cluster_id, image_ids in clusters.items():
            if example["filepath"] in image_ids:
                example["cluster_id"] = cluster_id
                return example
        example["cluster_id"] = None
        return example

    filtered_dataset = filtered_dataset.map(add_cluster_id)

    # Convert the filtered dataset to a DataFrame
    print("Converting filtered dataset to DataFrame...")
    filtered_df = pd.DataFrame(filtered_dataset)

    # # Print sample 10 records in filtered_df (columns filepath and cluster_id)
    # print("Filtered DataFrame sample:")
    # print(filtered_df[["filepath", "cluster_id"]].head(10).to_string(index=False))

    # # Print images without cluster_id
    # print("Images without cluster_id:")
    # no_cluster_id = filtered_df[filtered_df["cluster_id"].isnull()]
    # print(no_cluster_id[["filepath"]].head(10).to_string(index=False))

    # # Print all columns in filtered_df
    # print("Filtered DataFrame columns:")
    # print(filtered_df.columns.tolist())

    print(f"Saving {len(filtered_df):,} records...")
    filtered_df.to_pickle("processed_dataset.pkl")

    # Also save as parquet for faster loading
    print("Also saving as parquet...")
    filtered_df.to_parquet("processed_dataset.parquet")

    print("Done!")


if __name__ == "__main__":
    preprocess_dataset()
