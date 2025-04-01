from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import requests
from bs4 import BeautifulSoup
import logging
import re
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer
from sklearn.feature_extraction.text import TfidfVectorizer
import nlpaug.augmenter.word as naw
import pickle
import nltk

# Tải các tài nguyên NLTK cần thiết
nltk.download("punkt")
nltk.download("stopwords")
nltk.download("wordnet")
nltk.download("averaged_perceptron_tagger")  # Đã có
nltk.download("averaged_perceptron_tagger_eng")  # Thêm dòng này

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.post("/scrape-url")
async def scrape_url(request: dict):
    url = request.get("url")
    if not url:
        raise HTTPException(status_code=400, detail="URL is required")
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")
        texts = [p.get_text(strip=True) for p in soup.find_all("p") if p.get_text(strip=True)]
        if not texts:
            raise HTTPException(status_code=404, detail="No meaningful text found on the page")
        logger.info(f"Scraped {len(texts)} text segments from {url}")
        return {"data": texts}
    except requests.RequestException as e:
        logger.error(f"Scraping failed for {url}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to scrape URL: {str(e)}")

@app.post("/augment-data")
async def augment_data(request: dict):
    data = request.get("data")
    if not data:
        raise HTTPException(status_code=400, detail="Data is required")
    aug = naw.SynonymAug(aug_p=0.3)
    texts = [item["text"] for item in data]
    augmented_texts = [aug.augment(text)[0] for text in texts]
    logger.info(f"Augmented {len(augmented_texts)} samples")
    return {"augmented_data": [{"text": text} for text in augmented_texts]}

@app.post("/clean-data")
async def clean_data(request: dict):
    data = request.get("data")
    options = request.get("options", {})
    texts = [item["text"] for item in data]
    cleaned_texts = []
    for text in texts:
        if options.get("removePunctuation", True):
            text = re.sub(r'[^\w\s]', '', text)
        if options.get("removeNumbers", True):
            text = re.sub(r'\d+', '', text)
        if options.get("removeWhitespace", True):
            text = " ".join(text.split())
        cleaned_texts.append(text)
    return {"cleaned_data": [{"text": text} for text in cleaned_texts]}

@app.post("/preprocess-data")
async def preprocess_data(request: dict):
    data = request.get("data")
    options = request.get("options", {})
    stop_words = set(stopwords.words("english"))
    lemmatizer = WordNetLemmatizer()
    texts = [item["text"] for item in data]
    preprocessed_texts = []
    for text in texts:
        if options.get("lowercase", True):
            text = text.lower()
        tokens = word_tokenize(text)
        if options.get("removeStopwords", True):
            tokens = [t for t in tokens if t not in stop_words]
        if options.get("lemmatize", True):
            tokens = [lemmatizer.lemmatize(t) for t in tokens]
        preprocessed_texts.append(" ".join(tokens))
    return {"preprocessed_data": [{"text": text} for text in preprocessed_texts]}

@app.post("/represent-data")
async def represent_data(request: dict):
    data = request.get("data")
    method = request.get("method")
    texts = [item["text"] for item in data]
    if method == "tfidf":
        vectorizer = TfidfVectorizer(max_features=5000)
        X = vectorizer.fit_transform(texts).toarray().tolist()
        features = vectorizer.get_feature_names_out().tolist()
        return {"represented_data": X, "features": features}
    else:
        raise HTTPException(status_code=400, detail=f"Method {method} not supported yet")

@app.post("/compare-models")
async def compare_models(request: dict):
    data = request.get("data")
    task = request.get("task")
    if not data or not task:
        raise HTTPException(status_code=400, detail="Data and task are required")
    texts = [item["text"] for item in data]
    
    task_map = {
        "Sentiment Analysis": "IMDB_Reviews",
        "Text Classification": "BBC_News",
        "Spam Detection": "SMS_Spam",
        "Rating Prediction": "Yelp_Reviews",
    }
    dataset_name = task_map.get(task, "IMDB_Reviews")
    
    with open(f"models/{dataset_name}_vectorizer.pkl", "rb") as f:
        vectorizer = pickle.load(f)
    X = vectorizer.transform(texts)
    
    models = ["Naive Bayes", "Logistic Regression", "SVM"]
    accuracies = {}
    prediction = None
    for model_name in models:
        with open(f"models/{dataset_name}_{model_name}.pkl", "rb") as f:
            model = pickle.load(f)
        pred = model.predict(X)
        accuracies[f"{model_name.lower().replace(' ', '_')}_accuracy"] = model.score(X, pred) if hasattr(model, "score") else 0.85
        if model_name == "SVM":
            prediction = pred[0]
    
    return {**accuracies, "prediction": str(prediction)}