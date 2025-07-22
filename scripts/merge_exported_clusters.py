import json
import os
import re

def merge_cluster_files():
    """
    Merges the first 100 clusters from each JSON file in the data/exports
    directory into a single file.

    The cluster keys are renamed to include the year from the source filename,
    e.g., a cluster "0" from "all_1910_epsilon_2_4.json" becomes "1910_0".

    The merged data is saved to data/processed/merged_clusters.json.
    """
    exports_dir = os.path.join("data", "exports")
    processed_dir = os.path.join("data", "processed")
    output_filepath = os.path.join(processed_dir, "merged_clusters.json")

    if not os.path.exists(exports_dir):
        print(f"Error: Directory not found at '{exports_dir}'")
        return

    if not os.path.exists(processed_dir):
        os.makedirs(processed_dir)

    merged_clusters = {}
    
    # Regex to find the year in the filename, e.g., all_1910_...
    year_regex = re.compile(r"_(\d{4})_")

    # Get all json files in the directory
    json_files = [f for f in os.listdir(exports_dir) if f.endswith('.json')]

    for filename in json_files:
        match = year_regex.search(filename)
        if not match:
            print(f"Skipping file (could not find year): {filename}")
            continue
        
        year = match.group(1)
        filepath = os.path.join(exports_dir, filename)

        try:
            with open(filepath, 'r') as f:
                data = json.load(f)

            # Get the first 100 cluster keys, assuming they are strings of ints
            # Sort numerically to ensure we get the first 100 clusters correctly
            cluster_keys = sorted(data.keys(), key=int)[:100]

            for key in cluster_keys:
                new_key = f"{year}_{key}"
                merged_clusters[new_key] = data[key]
            
            print(f"Processed {len(cluster_keys)} clusters from {filename}")

        except (json.JSONDecodeError, ValueError, KeyError) as e:
            print(f"Error processing file {filename}: {e}")
        except Exception as e:
            print(f"An unexpected error occurred with file {filename}: {e}")


    # Save the merged data to the output file
    try:
        with open(output_filepath, 'w') as f:
            json.dump(merged_clusters, f, indent=4)
        print(f"\nSuccessfully merged data to {output_filepath}")
        print(f"Total clusters merged: {len(merged_clusters)}")
    except IOError as e:
        print(f"Error writing to output file {output_filepath}: {e}")


if __name__ == "__main__":
    merge_cluster_files()
