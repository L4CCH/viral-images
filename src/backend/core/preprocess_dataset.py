from datasets import load_dataset
import pandas as pd
import gc
from tqdm import tqdm


def preprocess_dataset():
    print("Loading dataset with streaming...")
    dataset = load_dataset("biglam/newspaper-navigator", "photos", streaming=True)

    # Get approximate dataset size (if available)
    try:
        total_size = dataset["train"].info.splits["train"].num_examples
        print(f"Dataset has approximately {total_size:,} records")
    except:
        print("Could not determine dataset size")

    batch_size = 5000  # Smaller batches for better memory management
    max_records = 50000  # Limit for faster processing - adjust as needed

    batches = []
    processed_records = 0

    print("Processing batches...")
    for batch in tqdm(dataset["train"].iter(batch_size=batch_size)):
        batch_df = pd.DataFrame(batch)
        batches.append(batch_df)
        processed_records += len(batch_df)

        if processed_records >= max_records:
            print(f"Reached limit of {max_records} records")
            break

        # Memory management - combine batches periodically
        if len(batches) >= 10:
            print(
                f"Combining {len(batches)} batches... ({processed_records:,} records so far)"
            )
            combined = pd.concat(batches, ignore_index=True)
            batches = [combined]
            gc.collect()  # Force garbage collection

    print("Final combination...")
    df = pd.concat(batches, ignore_index=True)

    print(f"Saving {len(df):,} records...")
    df.to_pickle("processed_dataset.pkl")

    # Also save as parquet for faster loading
    print("Also saving as parquet...")
    df.to_parquet("processed_dataset.parquet")

    print("Done!")

    ## FORMAT IDENTIFIERS
    ## MERGE WITH CLUSTERS


if __name__ == "__main__":
    preprocess_dataset()
