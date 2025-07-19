import marimo

__generated_with = "0.14.11"
app = marimo.App(width="full")


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""# Dataset: Metadata from Clustered Images""")
    return


@app.cell
def _():
    import json
    import marimo as mo
    from datasets import load_dataset
    return json, load_dataset, mo


@app.cell
def _(load_dataset):
    # Load a specific configuration (e.g., photos)
    dataset = load_dataset("biglam/newspaper-navigator", "photos")
    return (dataset,)


@app.cell
def _(json):
    # Load the cluster data
    with open("scripts/data/clusters.json", "r") as clusters_json:
        clusters_data = json.load(clusters_json)

    with open("scripts/data/clusters.json", "r") as clusters_json:
        clusters_data = json.load(clusters_json)

    def format_cluster(clusters_data):
        formatted_data = {}
        for cluster_id, filepaths in clusters_data.items():
            formatted_data[cluster_id] = []
            for filepath in filepaths:
                # Formats a filepath from 'a_b_c' to 'a/b/c.jpg' style
                parts = filepath.split('_')
                if len(parts) >= 11:
                    formatted_filepath = f"{parts[0]}_{parts[1]}_{parts[2]}/{parts[3]}/{parts[4]}/{parts[5]}/{parts[6]}/{parts[7]}/{'_'.join(parts[8:])}.jpg"
                    formatted_data[cluster_id].append(formatted_filepath)
                else:
                    # Keep original if it doesn't match expected format
                    formatted_data[cluster_id].append(filepath)
        return formatted_data

    with open("scripts/data/formatted_clusters.json", "w") as formatted_clusters_json:
        formatted_cluster = format_cluster(clusters_data)
        json.dump(formatted_cluster, formatted_clusters_json, indent=2)
    return (clusters_data,)


@app.cell
def _(clusters_data, format_filepath):
    # Flatten the lists of filepaths from the clusters
    filepaths_to_keep = [
        format_filepath(filepath)
        for cluster_filepaths in clusters_data.values()
        for filepath in cluster_filepaths
    ]

    # Create a set for faster lookups
    filepaths_set = set(filepaths_to_keep)

    print(f"Total items: {len(filepaths_set)}")
    print(filepaths_set)
    return (filepaths_set,)


@app.cell
def _(dataset, filepaths_set):
    # Filter the dataset
    filtered_dataset = dataset["train"].filter(
        lambda x: x["filepath"] in filepaths_set
    )
    print(filtered_dataset)
    return (filtered_dataset,)


@app.cell
def _():
    return


@app.cell
def _(filtered_dataset):
    # Remove columns
    clean_dataset = filtered_dataset.remove_columns(["ocr"])
    return (clean_dataset,)


@app.cell
def _(clean_dataset):
    # Save JSON
    clean_dataset.to_json("scripts/data/metadata.json")
    return


@app.cell
def _(json):
    # Fix forward slashes
    def fix_slashes_in_file(input_path, output_path):
        with open(input_path, 'r') as infile, open(output_path, 'w') as outfile:
            for line in infile:
                try:
                    # Load the JSON object from the line
                    data = json.loads(line)

                    # Iterate over all key-value pairs
                    for key, value in data.items():
                        # If the value is a string and contains the escaped slashes, replace them
                        if isinstance(value, str):
                            data[key] = value.replace('\/', '/')

                    # Write the corrected JSON object back to the new file
                    outfile.write(json.dumps(data) + '\n')
                except json.JSONDecodeError:
                    # If a line is not a valid JSON, write it as is to the new file
                    outfile.write(line)

    fix_slashes_in_file("scripts/data/metadata.json", "scripts/data/metadata_fixed.json")
    return


@app.cell
def _(os, requests, time, tqdm):
    def download_images(dataset):
        """Downloads all images from the dataset to a specified directory."""
        output_dir = "script/data/filtered_image_files"
        os.makedirs(output_dir, exist_ok=True)

        # 20 requests per minute is 1 request every 3 seconds
        requests_per_minute = 20
        delay_between_requests = 60.0 / requests_per_minute

        for index, photo in enumerate(tqdm(dataset, total=len(dataset))):

            image_url = photo['prediction_section_iiif_url']
            # Sanitize filepath to create a valid filename
            filename_path = photo['filepath'].replace('/', '_')
            filename = os.path.join(output_dir, f"{filename_path}.jpg")

            try:
                response = requests.get(image_url, stream=True)
                response.raise_for_status()

                with open(filename, 'wb') as f:
                    for chunk in response.iter_content(chunk_size=8192):
                        f.write(chunk)
                time.sleep(delay_between_requests)
            except requests.exceptions.RequestException as e:
                print(f"Error downloading {image_url}: {e}")

    # download_images(filtered_photos_dataset)
    return


if __name__ == "__main__":
    app.run()
