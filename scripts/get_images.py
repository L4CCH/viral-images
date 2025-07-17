import marimo

__generated_with = "0.14.11"
app = marimo.App(width="full")


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""# Dataset: Photos from 1910""")
    return


@app.cell
def _():
    import os
    import time
    import requests

    from datasets import load_dataset, load_from_disk
    from tqdm import tqdm
    import marimo as mo
    return load_dataset, mo, os, requests, time, tqdm


@app.cell
def _(load_dataset):
    # Load a specific configuration (e.g., photos)
    photos_dataset = load_dataset("biglam/newspaper-navigator", "photos")
    return (photos_dataset,)


@app.cell
def _(photos_dataset):
    # Save dataset to disk
    photos_dataset.save_to_disk(f"datasets/newspaper_navigator_photos")
    return


@app.cell
def _(photos_dataset):
    filtered_photos_dataset = photos_dataset["train"].filter(
        lambda x: "1910" <= x["pub_date"][:4] <= "1910"
    )

    filtered_photos_dataset.save_to_disk("datasets/newspaper_navigator_photos_filtered")

    return (filtered_photos_dataset,)


@app.cell
def _(filtered_photos_dataset):
    print(len(filtered_photos_dataset))

    # View the first example
    example = filtered_photos_dataset[0]

    print(f"Publication: {example['name']}")
    print(f"Date: {example['pub_date']}")
    print(f"OCR text: {example['ocr']}")

    image_url = example['prediction_section_iiif_url']
    print(f"Image URL:\n{image_url}")
    return


@app.cell
def _(filtered_photos_dataset, os, requests, time, tqdm):
    def download_images(dataset):
        """Downloads all images from the dataset to a specified directory."""
        output_dir = "datasets/filtered_image_files"
        os.makedirs(output_dir, exist_ok=True)

        # 20 requests per minute is 1 request every 3 seconds
        requests_per_minute = 20
        delay_between_requests = 60.0 / requests_per_minute

        for index, photo in enumerate(tqdm(dataset, total=len(dataset))):

            image_url = photo['prediction_section_iiif_url']  
            #tqdm.write(f"Downloading item {index}: {image_url}")

            try:
                response = requests.get(image_url, stream=True)
                response.raise_for_status()

                filename = os.path.join(output_dir, f"{index}.jpg")

                with open(filename, 'wb') as f:
                    for chunk in response.iter_content(chunk_size=8192):
                        f.write(chunk)
                time.sleep(delay_between_requests)
            except requests.exceptions.RequestException as e:
                print(f"Error downloading {image_url}: {e}")

    download_images(filtered_photos_dataset)
    return


if __name__ == "__main__":
    app.run()
