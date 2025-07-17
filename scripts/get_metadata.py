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
    dataset = load_dataset("biglam/newspaper-navigator", "default")
    return (dataset,)


@app.cell
def _(json):
    # Load the cluster data
    with open("scripts/data/clusters.json", "r") as f:
        clusters_data = json.load(f)

    # Flatten the lists of filepaths from the clusters
    filepaths_to_keep = [
        filepath
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
def _(filtered_dataset):
    # Remove columns
    clean_dataset = filtered_dataset.remove_columns(["ocr"])
    return (clean_dataset,)


@app.cell
def _(clean_dataset):
    # Save JSON
    clean_dataset.to_json("scripts/data/metadata.json", lines=False)
    return


@app.cell
def _(json):
    # Fix forward slashes
    with open('scripts/data/metadata.json', 'r') as json_file:
        data = json.load(json_file)  # Parse JSON to Python object

    with open('scripts/data/metadata.json', 'w') as json_file:
        content = json.dumps(data, indent=2, ensure_ascii=False, separators=(',', ': '))
        content = content.replace('\\/', '/')  # Fix forward slashes after formatting
        json_file.write(content)
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
