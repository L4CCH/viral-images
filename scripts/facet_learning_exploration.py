import marimo

__generated_with = "0.14.11"
app = marimo.App()


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""# Let's get the imports out of the way:""")
    return


@app.cell
def _():
    import marimo as mo
    return (mo,)


@app.cell
def _():
    # scikit-learn
    from sklearn.metrics.pairwise import cosine_distances
    from sklearn.linear_model import LogisticRegression
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.manifold import TSNE
    from sklearn.svm import LinearSVC

    # NumPy
    import numpy as np

    # vanilla Python imports
    from collections import Counter, OrderedDict
    from functools import reduce

    try:
        import pickle5 as pickle
    except ModuleNotFoundError:
        import pickle

    # lastly, we handle imports for showing IIIF photos
    from IPython.display import Image, display
    import requests
    return Image, LogisticRegression, display, np, pickle


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""# Next, let's load the 1.5 million photos (1900-1963):""")
    return


@app.cell
def _(np, pickle):
    with open('datasets/starting_data/global_metadata.pkl', 'rb') as f:
        metadata = pickle.load(f)
    print('Loaded metadata!')
    embeddings = np.load('datasets/starting_data/global_embeddings_light.npy')
    print('Loaded embeddings!')
    for _i in range(0, len(metadata)):
        lowered = metadata[_i]['ocr'].lower()
        metadata[_i]['lowered_ocr'] = lowered
        metadata[_i]['uuid'] = _i
    print('Lowered all OCR for ease of string matching & added UUIDs!')
    print(metadata[0])
    return embeddings, metadata


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""# Next, let's define a keyword search and see what results come up:""")
    return


@app.cell
def _(metadata):
    def keyword_search(search):
        res = []
        for _i in range(0, len(metadata)):
            md = metadata[_i]
            if len(search) > 0:
                if 'lowered_ocr' in md.keys():
                    if not search in md['lowered_ocr']:
                        continue
            res.append(md)
        return res
    results = keyword_search('baseball')
    for _i in range(0, 3):
        print(results[_i])
    return (keyword_search,)


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""# Next, we define a classifier based on a keyword search:""")
    return


@app.cell
def _(LogisticRegression, embeddings, np):
    # this function trains the facet learner and predicts on all examples
    # positive_indices, negative_indices are used for training
    def train_and_predict(positive_indices, negative_indices):

        # set random seed for reproducibility w/ negative examples
        np.random.seed(0)

        # next, we grab the embeddings 
        positive_embeddings = embeddings[positive_indices]
        negative_embeddings = embeddings[negative_indices]

        # construct training data
        train_X = np.concatenate((positive_embeddings, negative_embeddings), axis=0)
        train_y = np.concatenate((np.ones(len(positive_embeddings)), np.zeros(len(negative_embeddings))))
        # set sample weight
        sample_weight = np.ones(len(positive_embeddings) + len(negative_embeddings))
        sample_weight[:len(positive_indices)] = 10
        sample_weight[-len(negative_indices):] = 10

        # create Linear SVM
        # clf = RandomForestClassifier(max_depth=5, random_state=1, n_estimators=100)
        clf = LogisticRegression(class_weight='balanced', random_state=1, max_iter=100000)
        # LinearSVC(class_weight='balanced', verbose=False, max_iter=100000, tol=1e-6, random_state=1)

        # fit to the training data (positive + negative annotations w/ additional, randomly drawn negative examples)
        clf.fit(train_X, train_y, sample_weight)

        # generate predictions
        predictions = clf.predict_proba(embeddings)[:,1]

        return predictions
    return (train_and_predict,)


@app.cell
def _(embeddings, keyword_search, np, train_and_predict):
    N_PREDICTIONS = 1000

    def train_facet_learner(search):

        print("Finding + examples for: " + str(search) + "...")

        # let's grab all examples with matching keyword
        results = keyword_search(search)

        print("Found " + str(len(results)) + " positive matches")

        print("Generating training data...")

        # convert to indices
        positive_indices = []
        for result in results:
            positive_indices.append(result['uuid'])

    #     for i in positive_indices[:10]:
    #         display(Image(metadata[i]['IIIF_downsampled_url']))

        # generate random negative indices
        n_negative_examples = len(positive_indices)
        random_indices_for_negative = np.arange(len(embeddings))
        np.random.shuffle(random_indices_for_negative)
        random_indices_for_negative = random_indices_for_negative[:n_negative_examples]
        negative_indices = random_indices_for_negative

        print("Training and predicting...")

        # train and predict using function defined above
        predictions = train_and_predict(positive_indices, negative_indices)

        print("Sorting results & filtering...")

        # sort indices of predictions and invert (here, capped @ 1K results)
        sorted_indices = predictions.argsort()[::-1]
        sorted_indices = sorted_indices[:N_PREDICTIONS + len(positive_indices) + len(negative_indices)]

        # filter out photos already in library (+ or -)
        filtered_sorted_indices = []
        for index in sorted_indices:
            if index not in positive_indices and index not in negative_indices:
                filtered_sorted_indices.append(index)    

        print("Done!")
        return filtered_sorted_indices
    return (train_facet_learner,)


@app.cell
def _(Image, display, metadata, train_facet_learner):
    _facet_learner_results = train_facet_learner('building')
    for _i in _facet_learner_results[:20]:
        display(Image(metadata[_i]['IIIF_downsampled_url']))
    return


@app.cell
def _(Image, display, metadata, train_facet_learner):
    _facet_learner_results = train_facet_learner('baseball')
    for _i in _facet_learner_results[:20]:
        display(Image(metadata[_i]['IIIF_downsampled_url']))
    return


@app.cell
def _(Image, display, metadata, train_facet_learner):
    _facet_learner_results = train_facet_learner(' horse ')
    for _i in _facet_learner_results[:20]:
        display(Image(metadata[_i]['IIIF_downsampled_url']))
    return


@app.cell
def _(Image, display, metadata, train_facet_learner):
    _facet_learner_results = train_facet_learner(' boxer ')
    for _i in _facet_learner_results[:20]:
        display(Image(metadata[_i]['IIIF_downsampled_url']))
    return


if __name__ == "__main__":
    app.run()
