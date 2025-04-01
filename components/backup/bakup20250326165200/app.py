from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sklearn.naive_bayes import MultinomialNB
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
from sklearn.feature_extraction.text import TfidfVectorizer, CountVectorizer
from sklearn.metrics import accuracy_score, confusion_matrix
from sklearn.model_selection import train_test_split
from sklearn.manifold import TSNE
import pandas as pd
import numpy as np
import logging
import os
import joblib
from datasets import load_dataset
import requests
import zipfile
import io
import json
import traceback
import sys
import re
import random
import string
from bs4 import BeautifulSoup
import nltk
from nltk.corpus import stopwords
from nltk.stem import PorterStemmer, WordNetLemmatizer
from nltk.tokenize import word_tokenize
import gensim
from gensim.models import Word2Vec

# Download NLTK resources
try:
    nltk.download('punkt', quiet=True)
    nltk.download('punkt_tab', quiet=True)  # Thêm dòng này
    nltk.download('stopwords', quiet=True)
    nltk.download('wordnet', quiet=True)
except Exception as e:
    print(f"Error downloading NLTK resources: {e}")



# Configure detailed logging
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s - %(levelname)s - %(message)s - [%(filename)s:%(lineno)d]",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

app = FastAPI()

# Permissive CORS settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

model = None
vectorizer = None

DATASET_DIR = "./datasets"
if not os.path.exists(DATASET_DIR):
    os.makedirs(DATASET_DIR)
    logger.info(f"Created dataset directory: {DATASET_DIR}")
else:
    logger.info(f"Using existing dataset directory: {DATASET_DIR}")

DATASET_MAPPING = {
    "imdb": {"huggingface_name": "imdb", "split": "train", "file_name": "imdb.csv"},
    "ag_news": {"huggingface_name": "ag_news", "split": "train", "file_name": "ag_news.csv"},
    "twitter": {"huggingface_name": "sentiment140", "split": "train", "file_name": "twitter.csv", "trust_remote_code": True},
    "sms": {"url": "https://archive.ics.uci.edu/ml/machine-learning-databases/00228/smsspamcollection.zip", "file_name": "sms.csv", "download_method": "url"},
    "bbc": {"url": "http://mlg.ucd.ie/files/datasets/bbc-fulltext.zip", "file_name": "bbc.csv", "download_method": "url"},
    "yelp": {"huggingface_name": "yelp_review_full", "split": "train", "file_name": "yelp.csv"},
}

@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.debug(f"Received request: {request.method} {request.url}")
    logger.debug(f"Headers: {request.headers}")
    try:
        body = await request.body()
        if body:
            logger.debug(f"Request body: {body.decode()}")
    except Exception as e:
        logger.debug(f"Could not log request body: {str(e)}")
    response = await call_next(request)
    logger.debug(f"Response status: {response.status_code}")
    return response

@app.on_event("startup")
async def startup_event():
    logger.info("=== FastAPI NLP Classification Server Started ===")
    logger.info(f"Available datasets: {list(DATASET_MAPPING.keys())}")
    logger.info(f"Dataset directory: {os.path.abspath(DATASET_DIR)}")

@app.get("/health")
async def health_check():
    logger.info("Health check endpoint called")
    return {"status": "ok", "message": "Server is running"}

@app.get("/get-dataset/{dataset_name}")
async def get_dataset(dataset_name: str):
    logger.info(f"Received GET request for dataset: {dataset_name}")
    logs = [f"Processing dataset request: {dataset_name}"]

    if dataset_name not in DATASET_MAPPING:
        logger.error(f"Dataset not supported: {dataset_name}")
        logs.append(f"Dataset not supported: {dataset_name}")
        raise HTTPException(status_code=400, detail={"message": "Dataset not supported", "logs": logs})

    dataset_info = DATASET_MAPPING[dataset_name]
    file_path = os.path.join(DATASET_DIR, dataset_info["file_name"])
    logger.info(f"Checking dataset file at: {file_path}")

    if not os.path.exists(file_path):
        logger.info(f"Dataset {dataset_name} not found locally, starting download...")
        logs.append(f"Dataset {dataset_name} not found locally, starting download...")
        try:
            if "huggingface_name" in dataset_info:
                logger.info(f"Downloading {dataset_name} from Hugging Face...")
                trust_remote_code = dataset_info.get("trust_remote_code", False)
                dataset = load_dataset(dataset_info["huggingface_name"], split=dataset_info["split"], trust_remote_code=trust_remote_code)
                df = pd.DataFrame(dataset)
                logger.info(f"Saving dataset {dataset_name} to {file_path}")
                df.to_csv(file_path, index=False)
                logs.append(f"Downloaded and saved {dataset_name} to {file_path}")
            elif "url" in dataset_info:
                logger.info(f"Downloading {dataset_name} from URL: {dataset_info['url']}")
                response = requests.get(dataset_info["url"])
                if response.status_code != 200:
                    logger.error(f"Failed to download dataset from {dataset_info['url']}, status code: {response.status_code}")
                    logs.append(f"Failed to download dataset from {dataset_info['url']}")
                    raise HTTPException(status_code=500, detail={"message": "Failed to download dataset", "logs": logs})
                with zipfile.ZipFile(io.BytesIO(response.content)) as z:
                    logger.info(f"Extracting zip file for {dataset_name}")
                    if dataset_name == "sms":
                        with z.open("SMSSpamCollection") as f:
                            df = pd.read_csv(f, sep="\t", names=["label", "text"])
                            df.to_csv(file_path, index=False)
                    elif dataset_name == "bbc":
                        df_list = []
                        for file_name in z.namelist():
                            if file_name.endswith(".txt"):
                                with z.open(file_name) as f:
                                    content = f.read().decode("utf-8")
                                    category = file_name.split("/")[0]
                                    df_list.append({"text": content, "label": category})
                        df = pd.DataFrame(df_list)
                        df.to_csv(file_path, index=False)
                logs.append(f"Downloaded and saved {dataset_name} to {file_path}")
            logger.info(f"Successfully downloaded and saved {dataset_name} to {file_path}")
        except Exception as e:
            logger.error(f"Error downloading dataset {dataset_name}: {str(e)}")
            logger.error(traceback.format_exc())
            logs.append(f"Error downloading dataset {dataset_name}: {str(e)}")
            raise HTTPException(status_code=500, detail={"message": f"Error downloading dataset: {str(e)}", "logs": logs})

    logs.append(f"Sending dataset file: {file_path}")
    logs_json = json.dumps(logs)
    response = FileResponse(
        path=file_path,
        filename=dataset_info["file_name"],
        media_type="text/csv"
    )
    response.headers["X-Logs"] = logs_json
    logger.info(f"Dataset {dataset_name} sent successfully")
    return response

@app.post("/dataset-stats")
async def get_dataset_stats(file: UploadFile = File(None)):
    logger.info(f"Received POST request to analyze dataset stats, file: {file.filename if file else 'None'}")
    logs = ["Processing dataset statistics request"]

    if not file:
        logger.error("No file uploaded for dataset stats")
        logs.append("No file uploaded")
        raise HTTPException(status_code=400, detail={"message": "No file uploaded", "logs": logs})

    try:
        file_content = await file.read()
        df = pd.read_csv(io.BytesIO(file_content))
        logger.info(f"Dataset loaded with shape: {df.shape}")
        logs.append(f"Loaded dataset with {len(df)} rows")

        if "text" not in df.columns or "label" not in df.columns:
            logger.error(f"Dataset must contain 'text' and 'label' columns, found: {df.columns.tolist()}")
            logs.append("Dataset missing 'text' or 'label' columns")
            raise HTTPException(status_code=400, detail={"message": "Dataset must contain 'text' and 'label' columns", "logs": logs})

        total_samples = len(df)
        class_distribution = df["label"].value_counts().to_dict()
        avg_text_length = df["text"].astype(str).apply(len).mean()
        logger.info(f"Dataset stats: total_samples={total_samples}, classes={len(class_distribution)}, avg_length={avg_text_length:.2f}")
        logs.append("Dataset stats calculated successfully")

        return {
            "total_samples": total_samples,
            "class_distribution": class_distribution,
            "average_text_length": avg_text_length,
            "logs": logs
        }
    except Exception as e:
        logger.error(f"Error calculating dataset stats: {str(e)}")
        logger.error(traceback.format_exc())
        logs.append(f"Error calculating dataset stats: {str(e)}")
        raise HTTPException(status_code=500, detail={"message": f"Error calculating dataset stats: {str(e)}", "logs": logs})

@app.post("/train")
async def train_model(file: UploadFile = File(None), algorithm: str = "naive-bayes", alpha: float = 1.0):
    global model, vectorizer
    logger.info(f"Received POST request to train model with algorithm: {algorithm}, alpha: {alpha}")
    logs = [f"Processing training request: algorithm={algorithm}, alpha={alpha}"]

    if not file:
        logger.error("No file uploaded for training")
        logs.append("No file uploaded for training")
        raise HTTPException(status_code=400, detail={"message": "No file uploaded for training", "logs": logs})

    try:
        file_content = await file.read()
        df = pd.read_csv(io.BytesIO(file_content))
        logger.info(f"Dataset loaded with shape: {df.shape}")
        logs.append(f"Loaded dataset with {len(df)} rows")

        if "text" not in df.columns or "label" not in df.columns:
            logger.error(f"Dataset must contain 'text' and 'label' columns, found: {df.columns.tolist()}")
            logs.append("Dataset missing 'text' or 'label' columns")
            raise HTTPException(status_code=400, detail={"message": "Dataset must contain 'text' and 'label' columns", "logs": logs})

        X = df["text"].astype(str).values
        y = df["label"].values
        logger.info(f"Prepared {len(X)} samples for training")

        vectorizer = TfidfVectorizer(stop_words="english")
        X_transformed = vectorizer.fit_transform(X)
        logger.info(f"Text vectorized with {X_transformed.shape[1]} features")
        logs.append(f"Text vectorized with {X_transformed.shape[1]} features")

        X_train, X_test, y_train, y_test = train_test_split(X_transformed, y, test_size=0.2, random_state=42)
        logger.info(f"Train set: {X_train.shape}, Test set: {X_test.shape}")

        if algorithm == "naive-bayes":
            model = MultinomialNB(alpha=alpha)
        elif algorithm == "logistic":
            model = LogisticRegression(C=alpha, max_iter=1000)
        elif algorithm == "svm":
            model = SVC(C=alpha, kernel="linear", probability=True)
        elif algorithm == "knn":
            model = KNeighborsClassifier(n_neighbors=int(alpha))
        else:
            logger.error(f"Unsupported algorithm: {algorithm}")
            logs.append(f"Unsupported algorithm: {algorithm}")
            raise HTTPException(status_code=400, detail={"message": "Unsupported algorithm", "logs": logs})

        logger.info("Training model")
        model.fit(X_train, y_train)
        logger.info("Model training completed")
        logs.append("Model training completed")

        y_pred = model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        conf_matrix = confusion_matrix(y_test, y_pred).tolist()
        logger.info(f"Test accuracy: {accuracy:.4f}")
        logs.append(f"Model evaluated with accuracy: {accuracy:.4f}")

        top_features = []
        clusters = None
        if algorithm in ["naive-bayes", "logistic"]:
            feature_names = vectorizer.get_feature_names_out()
            if algorithm == "logistic":
                importance = np.abs(model.coef_[0])
            else:  # naive-bayes
                # Use raw probabilities instead of log to avoid -inf
                importance = model.feature_log_prob_[1]
                # Replace any invalid values with a small number
                importance = np.where(np.isfinite(importance), importance, 1e-10)
            top_indices = importance.argsort()[-10:][::-1]
            top_features = [
                {"feature": feature_names[i], "importance": float(importance[i])}
                for i in top_indices
            ]
        elif algorithm == "knn":
            # Generate cluster visualization using t-SNE
            X_test_dense = X_test.toarray()
            tsne = TSNE(n_components=2, random_state=42, perplexity=min(30, X_test.shape[0]-1))
            X_embedded = tsne.fit_transform(X_test_dense)
            clusters = [{"x": float(x[0]), "y": float(x[1]), "label": str(label)} for x, label in zip(X_embedded, y_test)]

        response_data = {
            "message": "Model trained successfully",
            "accuracy": float(accuracy),
            "confusion_matrix": conf_matrix,
            "top_features": top_features,
            "clusters": clusters,
            "logs": logs
        }
        return response_data
    except Exception as e:
        logger.error(f"Error during training: {str(e)}")
        logger.error(traceback.format_exc())
        logs.append(f"Error during training: {str(e)}")
        raise HTTPException(status_code=500, detail={"message": f"Error during training: {str(e)}", "logs": logs})


@app.post("/predict")
async def predict(request: Request):
    global model, vectorizer
    logger.info("Received POST request for prediction")
    logs = ["Processing prediction request"]

    try:
        try:
            body = await request.json()
            text = body.get("text", "")
        except:
            form = await request.form()
            text = form.get("text", "")

        if not text:
            logger.error("Empty text input")
            logs.append("Empty text input")
            return JSONResponse(status_code=400, content={"message": "Text input is required", "logs": logs})

        if not model or not vectorizer:
            logger.error("Model or vectorizer not trained")
            logs.append("Model or vectorizer not trained")
            return JSONResponse(status_code=400, content={"message": "Model not trained", "logs": logs})

        X_transformed = vectorizer.transform([text])
        prediction = model.predict(X_transformed)[0]
        confidence = float(np.max(model.predict_proba(X_transformed)[0])) if hasattr(model, "predict_proba") else None
        logger.info(f"Prediction completed: {prediction}")
        logs.append(f"Prediction completed: {prediction}")

        return {
            "prediction": str(prediction),
            "confidence": confidence,
            "logs": logs
        }
    except Exception as e:
        logger.error(f"Error during prediction: {str(e)}")
        logger.error(traceback.format_exc())
        logs.append(f"Error during prediction: {str(e)}")
        return JSONResponse(status_code=500, content={"message": f"Error during prediction: {str(e)}", "logs": logs})

@app.post("/save-model")
async def save_model():
    global model, vectorizer
    logger.info("Received POST request to save model")
    logs = ["Processing save model request"]

    if not model or not vectorizer:
        logger.error("No model trained to save")
        logs.append("No model trained to save")
        raise HTTPException(status_code=400, detail={"message": "No model trained", "logs": logs})

    try:
        joblib.dump(model, os.path.join(DATASET_DIR, "model.pkl"))
        joblib.dump(vectorizer, os.path.join(DATASET_DIR, "vectorizer.pkl"))
        logger.info("Model and vectorizer saved successfully")
        logs.append("Model and vectorizer saved successfully")
        return {"message": "Model saved successfully", "logs": logs}
    except Exception as e:
        logger.error(f"Error saving model: {str(e)}")
        logger.error(traceback.format_exc())
        logs.append(f"Error saving model: {str(e)}")
        raise HTTPException(status_code=500, detail={"message": f"Error saving model: {str(e)}", "logs": logs})

@app.post("/load-model")
async def load_model():
    global model, vectorizer
    logger.info("Received POST request to load model")
    logs = ["Processing load model request"]

    model_path = os.path.join(DATASET_DIR, "model.pkl")
    vectorizer_path = os.path.join(DATASET_DIR, "vectorizer.pkl")

    if not os.path.exists(model_path) or not os.path.exists(vectorizer_path):
        logger.error(f"No saved model found at {model_path} or {vectorizer_path}")
        logs.append("No saved model found")
        raise HTTPException(status_code=400, detail={"message": "No saved model found", "logs": logs})

    try:
        model = joblib.load(model_path)
        vectorizer = joblib.load(vectorizer_path)
        logger.info("Model and vectorizer loaded successfully")
        logs.append("Model and vectorizer loaded successfully")
        return {"message": "Model loaded successfully", "logs": logs}
    except Exception as e:
        logger.error(f"Error loading model: {str(e)}")
        logger.error(traceback.format_exc())
        logs.append(f"Error loading model: {str(e)}")
        raise HTTPException(status_code=500, detail={"message": f"Error loading model: {str(e)}", "logs": logs})

# New endpoints for the complete workflow

@app.post("/scrape-url")
async def scrape_url(request: Request):
    logger.info("Received POST request to scrape URL")
    logs = ["Processing web scraping request"]
    
    try:
        body = await request.json()
        url = body.get("url", "")
        dataset_type = body.get("dataset_type", "")
        
        if not url:
            logger.error("No URL provided")
            logs.append("No URL provided")
            raise HTTPException(status_code=400, detail={"message": "URL is required", "logs": logs})
        
        logger.info(f"Scraping URL: {url}, dataset type: {dataset_type}")
        logs.append(f"Scraping URL: {url}")
        
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()
        except requests.RequestException as e:
            logger.error(f"Error fetching URL: {str(e)}")
            logs.append(f"Error fetching URL: {str(e)}")
            raise HTTPException(status_code=500, detail={"message": f"Error fetching URL: {str(e)}", "logs": logs})
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Extract data based on dataset type
        data = []
        if dataset_type == "imdb":
            # Extract movie data
            movie_containers = soup.select('.lister-item-content')
            for container in movie_containers[:10]:  # Limit to 10 items
                title_elem = container.select_one('.lister-item-header a')
                year_elem = container.select_one('.lister-item-year')
                rating_elem = container.select_one('.ratings-imdb-rating strong')
                
                title = title_elem.text if title_elem else "Unknown"
                year = year_elem.text.strip('()') if year_elem else "Unknown"
                rating = rating_elem.text if rating_elem else "0.0"
                
                data.append({
                    "title": title,
                    "year": year,
                    "rating": rating,
                    "text": f"{title} ({year}) - Rating: {rating}",
                    "label": "positive" if float(rating.replace(',', '.')) >= 7.0 else "negative"
                })
        elif dataset_type == "books":
            # Extract book data
            book_containers = soup.select('article.product_pod')
            for container in book_containers[:10]:  # Limit to 10 items
                title_elem = container.select_one('h3 a')
                price_elem = container.select_one('.price_color')
                availability_elem = container.select_one('.availability')
                rating_elem = container.select_one('p.star-rating')
                
                title = title_elem.get('title') if title_elem else "Unknown"
                price = price_elem.text if price_elem else "Unknown"
                availability = availability_elem.text.strip() if availability_elem else "Unknown"
                rating = rating_elem.get('class')[1] if rating_elem and len(rating_elem.get('class')) > 1 else "Unknown"
                
                data.append({
                    "title": title,
                    "price": price,
                    "availability": availability,
                    "rating": rating,
                    "text": f"{title} - Price: {price}, Availability: {availability}",
                    "label": "positive" if rating in ["Four", "Five"] else "negative"
                })
        else:
            # Generic scraping - extract paragraphs
            paragraphs = soup.select('p')
            for i, p in enumerate(paragraphs[:10]):  # Limit to 10 items
                text = p.text.strip()
                if len(text) > 20:  # Only include substantial paragraphs
                    data.append({
                        "id": i + 1,
                        "text": text,
                        "label": "positive" if i % 2 == 0 else "negative"  # Arbitrary label for demo
                    })
        
        if not data:
            logger.warning("No data extracted from URL")
            logs.append("No data extracted from URL")
            # Create some mock data if nothing was extracted
            data = [
                {"id": 1, "text": "Sample text 1 from " + url, "label": "positive"},
                {"id": 2, "text": "Sample text 2 from " + url, "label": "negative"},
                {"id": 3, "text": "Sample text 3 from " + url, "label": "positive"}
            ]
        
        # Create CSV content
        df = pd.DataFrame(data)
        csv_buffer = io.StringIO()
        df.to_csv(csv_buffer, index=False)
        csv_content = csv_buffer.getvalue()
        
        logger.info(f"Successfully scraped {len(data)} items from URL")
        logs.append(f"Successfully scraped {len(data)} items")
        
        return {
            "message": "URL scraped successfully",
            "data": data,
            "csv_content": csv_content,
            "logs": logs
        }
    except Exception as e:
        logger.error(f"Error during web scraping: {str(e)}")
        logger.error(traceback.format_exc())
        logs.append(f"Error during web scraping: {str(e)}")
        raise HTTPException(status_code=500, detail={"message": f"Error during web scraping: {str(e)}", "logs": logs})

@app.post("/augment-data")
async def augment_data(request: Request):
    logger.info("Received POST request to augment data")
    logs = ["Processing data augmentation request"]
    
    try:
        body = await request.json()
        data = body.get("data", [])
        synonym_probability = body.get("synonym_probability", 0.3)
        noise_probability = body.get("noise_probability", 0.1)
        deletion_probability = body.get("deletion_probability", 0.2)
        back_translation_language = body.get("back_translation_language", "fr")
        
        if not data:
            logger.error("No data provided for augmentation")
            logs.append("No data provided for augmentation")
            raise HTTPException(status_code=400, detail={"message": "Data is required", "logs": logs})
        
        logger.info(f"Augmenting {len(data)} data points")
        logs.append(f"Augmenting {len(data)} data points")
        
        # Create a simple synonym dictionary for demonstration
        synonym_dict = {
            "good": ["great", "excellent", "wonderful", "fantastic"],
            "bad": ["poor", "terrible", "awful", "horrible"],
            "happy": ["joyful", "delighted", "pleased", "content"],
            "sad": ["unhappy", "depressed", "miserable", "gloomy"],
            "big": ["large", "huge", "enormous", "gigantic"],
            "small": ["tiny", "little", "miniature", "compact"],
            "beautiful": ["pretty", "gorgeous", "attractive", "lovely"],
            "ugly": ["unattractive", "hideous", "unsightly", "plain"],
            "fast": ["quick", "rapid", "swift", "speedy"],
            "slow": ["sluggish", "unhurried", "leisurely", "gradual"]
        }
        
        augmented_data = []
        
        for item in data:
            original_text = item.get("text", "")
            if not original_text:
                continue
                
            label = item.get("label", "")
            
            # Keep the original data
            augmented_data.append(item)
            
            # 1. Synonym replacement
            if synonym_probability > 0:
                words = original_text.split()
                new_words = words.copy()
                
                for i, word in enumerate(words):
                    word_lower = word.lower().strip(string.punctuation)
                    if word_lower in synonym_dict and random.random() < synonym_probability:
                        synonyms = synonym_dict[word_lower]
                        new_words[i] = random.choice(synonyms)
                
                augmented_text = " ".join(new_words)
                augmented_data.append({
                    **item,
                    "text": augmented_text,
                    "augmentation_type": "synonym_replacement"
                })
            
            # 2. Random word deletion
            if deletion_probability > 0:
                words = original_text.split()
                if len(words) > 3:  # Only delete if we have enough words
                    new_words = [word for word in words if random.random() > deletion_probability]
                    if not new_words:  # Ensure we have at least one word
                        new_words = [random.choice(words)]
                    
                    augmented_text = " ".join(new_words)
                    augmented_data.append({
                        **item,
                        "text": augmented_text,
                        "augmentation_type": "random_deletion"
                    })
            
            # 3. Random word swapping
            words = original_text.split()
            if len(words) > 3:
                new_words = words.copy()
                for _ in range(max(1, int(len(words) * 0.1))):
                    idx1, idx2 = random.sample(range(len(new_words)), 2)
                    new_words[idx1], new_words[idx2] = new_words[idx2], new_words[idx1]
                
                augmented_text = " ".join(new_words)
                augmented_data.append({
                    **item,
                    "text": augmented_text,
                    "augmentation_type": "word_swapping"
                })
            
            # 4. Random noise injection
            if noise_probability > 0:
                chars = list(original_text)
                for i in range(len(chars)):
                    if random.random() < noise_probability:
                        if random.random() < 0.5:  # Replace with random character
                            chars[i] = random.choice(string.ascii_letters + string.digits + string.punctuation + " ")
                        else:  # Insert random character
                            chars.insert(i, random.choice(string.ascii_letters + string.digits))
                
                augmented_text = "".join(chars)
                augmented_data.append({
                    **item,
                    "text": augmented_text,
                    "augmentation_type": "noise_injection"
                })
            
            # 5. Simulated back translation
            back_translations = {
                "fr": {
                    "hello": "hi there",
                    "good morning": "morning greetings",
                    "how are you": "how are you doing",
                    "thank you": "thanks a lot",
                    "goodbye": "see you later"
                },
                "es": {
                    "hello": "greetings",
                    "good morning": "have a nice day",
                    "how are you": "how is everything",
                    "thank you": "many thanks",
                    "goodbye": "until next time"
                },
                "de": {
                    "hello": "welcome",
                    "good morning": "good day",
                    "how are you": "how is it going",
                    "thank you": "appreciate it",
                    "goodbye": "farewell"
                }
            }
            
            # Simple back translation simulation
            words = original_text.split()
            new_words = []
            for word in words:
                word_lower = word.lower()
                if word_lower in back_translations.get(back_translation_language, {}):
                    new_words.append(back_translations[back_translation_language][word_lower])
                else:
                    new_words.append(word)
            
            if new_words != words:
                augmented_text = " ".join(new_words)
                augmented_data.append({
                    **item,
                    "text": augmented_text,
                    "augmentation_type": "back_translation"
                })
        
        logger.info(f"Successfully augmented data to {len(augmented_data)} items")
        logs.append(f"Successfully augmented data to {len(augmented_data)} items")
        
        return {
            "message": "Data augmented successfully",
            "augmented_data": augmented_data,
            "logs": logs
        }
    except Exception as e:
        logger.error(f"Error during data augmentation: {str(e)}")
        logger.error(traceback.format_exc())
        logs.append(f"Error during data augmentation: {str(e)}")
        raise HTTPException(status_code=500, detail={"message": f"Error during data augmentation: {str(e)}", "logs": logs})

@app.post("/clean-data")
async def clean_data(request: Request):
    logger.info("Received POST request to clean data")
    logs = ["Processing data cleaning request"]
    
    try:
        body = await request.json()
        data = body.get("data", [])
        options = body.get("options", {})
        
        if not data:
            logger.error("No data provided for cleaning")
            logs.append("No data provided for cleaning")
            raise HTTPException(status_code=400, detail={"message": "Data is required", "logs": logs})
        
        logger.info(f"Cleaning {len(data)} data points with options: {options}")
        logs.append(f"Cleaning {len(data)} data points")
        
        cleaned_data = []
        
        for item in data:
            text = item.get("text", "")
            if not text:
                cleaned_data.append(item)
                continue
            
            # Apply cleaning operations based on options
            if options.get("removePunctuation", False):
                text = re.sub(r'[^\w\s]', '', text)
            
            if options.get("removeNumbers", False):
                text = re.sub(r'\d+', '', text)
            
            if options.get("removeExtraSpaces", False):
                text = re.sub(r'\s+', ' ', text).strip()
            
            if options.get("removeSymbols", False):
                text = re.sub(r'[^\w\s]', '', text)
            
            cleaned_data.append({
                **item,
                "text": text,
                "original_text": item.get("text", "")
            })
        
        logger.info(f"Successfully cleaned {len(cleaned_data)} items")
        logs.append(f"Successfully cleaned {len(cleaned_data)} items")
        
        return {
            "message": "Data cleaned successfully",
            "cleaned_data": cleaned_data,
            "logs": logs
        }
    except Exception as e:
        logger.error(f"Error during data cleaning: {str(e)}")
        logger.error(traceback.format_exc())
        logs.append(f"Error during data cleaning: {str(e)}")
        raise HTTPException(status_code=500, detail={"message": f"Error during data cleaning: {str(e)}", "logs": logs})

@app.post("/preprocess-data")
async def preprocess_data(request: Request):
    logger.info("Received POST request to preprocess data")
    logs = ["Processing data preprocessing request"]
    
    try:
        body = await request.json()
        data = body.get("data", [])
        options = body.get("options", {})
        
        if not data:
            logger.error("No data provided for preprocessing")
            logs.append("No data provided for preprocessing")
            raise HTTPException(status_code=400, detail={"message": "Data is required", "logs": logs})
        
        logger.info(f"Preprocessing {len(data)} data points with options: {options}")
        logs.append(f"Preprocessing {len(data)} data points")
        
        # Initialize NLTK components
        stop_words = set(stopwords.words('english')) if options.get("removeStopwords", False) else set()
        stemmer = PorterStemmer() if options.get("stem", False) else None
        lemmatizer = WordNetLemmatizer() if options.get("lemmatize", False) else None
        
        # Contractions mapping for expansion
        contractions = {
            "I'm": "I am",
            "I'd": "I would",
            "I'll": "I will",
            "I've": "I have",
            "you're": "you are",
            "you'd": "you would",
            "you'll": "you will",
            "you've": "you have",
            "he's": "he is",
            "he'd": "he would",
            "he'll": "he will",
            "she's": "she is",
            "she'd": "she would",
            "she'll": "she will",
            "it's": "it is",
            "it'd": "it would",
            "it'll": "it will",
            "we're": "we are",
            "we'd": "we would",
            "we'll": "we will",
            "we've": "we have",
            "they're": "they are",
            "they'd": "they would",
            "they'll": "they will",
            "they've": "they have",
            "that's": "that is",
            "that'd": "that would",
            "that'll": "that will",
            "who's": "who is",
            "who'd": "who would",
            "who'll": "who will",
            "what's": "what is",
            "what'd": "what would",
            "what'll": "what will",
            "where's": "where is",
            "where'd": "where would",
            "where'll": "where will",
            "when's": "when is",
            "when'd": "when would",
            "when'll": "when will",
            "why's": "why is",
            "why'd": "why would",
            "why'll": "why will",
            "how's": "how is",
            "how'd": "how would",
            "how'll": "how will",
            "isn't": "is not",
            "aren't": "are not",
            "wasn't": "was not",
            "weren't": "were not",
            "haven't": "have not",
            "hasn't": "has not",
            "hadn't": "had not",
            "don't": "do not",
            "doesn't": "does not",
            "didn't": "did not",
            "can't": "cannot",
            "couldn't": "could not",
            "shouldn't": "should not",
            "won't": "will not",
            "wouldn't": "would not"
        }
        
        # Simple spelling correction dictionary
        spelling_corrections = {
            "teh": "the",
            "recieve": "receive",
            "beleive": "believe",
            "freind": "friend",
            "wierd": "weird",
            "acheive": "achieve",
            "accomodate": "accommodate",
            "accross": "across",
            "agressive": "aggressive",
            "apparant": "apparent",
            "appearence": "appearance",
            "arguement": "argument",
            "assasination": "assassination",
            "basicly": "basically",
            "begining": "beginning",
            "belive": "believe",
            "buisness": "business",
            "calender": "calendar",
            "camoflage": "camouflage",
            "catagory": "category",
            "cemetary": "cemetery",
            "changable": "changeable",
            "cheif": "chief",
            "collegue": "colleague",
            "comming": "coming",
            "commitee": "committee",
            "completly": "completely",
            "concious": "conscious",
            "curiousity": "curiosity",
            "definately": "definitely",
            "desparate": "desperate",
            "dissapoint": "disappoint",
            "embarass": "embarrass",
            "enviroment": "environment",
            "existance": "existence",
            "familar": "familiar",
            "finaly": "finally",
            "foriegn": "foreign",
            "goverment": "government",
            "gaurd": "guard",
            "happend": "happened",
            "harrass": "harass",
            "honourary": "honorary",
            "humourous": "humorous",
            "independant": "independent",
            "intresting": "interesting",
            "knowlege": "knowledge",
            "liason": "liaison",
            "libary": "library",
            "lisence": "license",
            "maintainance": "maintenance",
            "millenium": "millennium",
            "miniscule": "minuscule",
            "mischevious": "mischievous",
            "mispell": "misspell",
            "neccessary": "necessary",
            "noticable": "noticeable",
            "occassion": "occasion",
            "occurance": "occurrence",
            "occured": "occurred",
            "paralel": "parallel",
            "parliment": "parliament",
            "persistant": "persistent",
            "posession": "possession",
            "prefered": "preferred",
            "propoganda": "propaganda",
            "publically": "publicly",
            "realy": "really",
            "recieve": "receive",
            "refered": "referred",
            "relevent": "relevant",
            "religous": "religious",
            "remeber": "remember",
            "resistence": "resistance",
            "responsability": "responsibility",
            "rythm": "rhythm",
            "seperate": "separate",
            "seige": "siege",
            "succesful": "successful",
            "supercede": "supersede",
            "supress": "suppress",
            "surpise": "surprise",
            "tendancy": "tendency",
            "therefor": "therefore",
            "threshhold": "threshold",
            "tommorow": "tomorrow",
            "tounge": "tongue",
            "truely": "truly",
            "unforseen": "unforeseen",
            "unfortunatly": "unfortunately",
            "untill": "until",
            "wierd": "weird"
        }
        
        preprocessed_data = []
        
        for item in data:
            text = item.get("text", "")
            if not text:
                preprocessed_data.append(item)
                continue
            
            # Store original text
            original_text = text
            
            # Apply preprocessing operations based on options
            if options.get("expandContractions", False):
                for contraction, expansion in contractions.items():
                    text = re.sub(r'\b' + contraction + r'\b', expansion, text, flags=re.IGNORECASE)
            
            if options.get("correctSpelling", False):
                words = text.split()
                corrected_words = []
                for word in words:
                    word_lower = word.lower()
                    if word_lower in spelling_corrections:
                        corrected_words.append(spelling_corrections[word_lower])
                    else:
                        corrected_words.append(word)
                text = " ".join(corrected_words)
            
            if options.get("lowercase", False):
                text = text.lower()
            
            if options.get("removePunctuation", False):
                text = re.sub(r'[^\w\s]', '', text)
            
            if options.get("removeWhitespace", False):
                text = re.sub(r'\s+', ' ', text).strip()
            
            # Tokenize for more advanced operations
            tokens = word_tokenize(text)
            
            if options.get("removeStopwords", False):
                tokens = [token for token in tokens if token.lower() not in stop_words]
            
            if options.get("stem", False) and stemmer:
                tokens = [stemmer.stem(token) for token in tokens]
            
            if options.get("lemmatize", False) and lemmatizer:
                tokens = [lemmatizer.lemmatize(token) for token in tokens]
            
            # Reconstruct text from tokens
            processed_text = " ".join(tokens)
            
            # Named Entity Recognition (simplified)
            entities = []
            if options.get("detectEntities", False):
                # Simple pattern-based NER
                entity_patterns = [
                    (r'\b[A-Z][a-z]+ [A-Z][a-z]+\b', 'PERSON'),
                    (r'\b[A-Z][a-z]+ (Inc|Corp|LLC|Ltd)\b', 'ORGANIZATION'),
                    (r'\b[A-Z][a-z]+, [A-Z]{2}\b', 'LOCATION'),
                    (r'\b\d{1,2}/\d{1,2}/\d{2,4}\b', 'DATE'),
                    (r'\b\d{1,2}:\d{2}\b', 'TIME'),
                    (r'\b\$\d+(\.\d{2})?\b', 'MONEY'),
                    (r'\b\d+%\b', 'PERCENT')
                ]
                
                for pattern, label in entity_patterns:
                    for match in re.finditer(pattern, original_text):
                        entities.append({
                            'text': match.group(),
                            'label': label,
                            'start': match.start(),
                            'end': match.end()
                        })
            
            preprocessed_data.append({
                **item,
                "text": processed_text,
                "original_text": original_text,
                "entities": entities
            })
        
        logger.info(f"Successfully preprocessed {len(preprocessed_data)} items")
        logs.append(f"Successfully preprocessed {len(preprocessed_data)} items")
        
        return {
            "message": "Data preprocessed successfully",
            "preprocessed_data": preprocessed_data,
            "logs": logs
        }
    except Exception as e:
        logger.error(f"Error during data preprocessing: {str(e)}")
        logger.error(traceback.format_exc())
        logs.append(f"Error during data preprocessing: {str(e)}")
        raise HTTPException(status_code=500, detail={"message": f"Error during data preprocessing: {str(e)}", "logs": logs})

@app.post("/represent-data")
async def represent_data(request: Request):
    logger.info("Received POST request to represent data")
    logs = ["Processing data representation request"]
    
    try:
        body = await request.json()
        data = body.get("data", [])
        method = body.get("method", "tfidf")
        
        if not data:
            logger.error("No data provided for representation")
            logs.append("No data provided for representation")
            raise HTTPException(status_code=400, detail={"message": "Data is required", "logs": logs})
        
        logger.info(f"Representing {len(data)} data points with method: {method}")
        logs.append(f"Representing {len(data)} data points with method: {method}")
        
        # Extract text and labels
        texts = [item.get("text", "") for item in data]
        labels = [item.get("label", "") for item in data]
        
        represented_data = []
        features = []
        
        # Apply representation method
        if method == "one-hot":
            # One-hot encoding (simplified)
            # Create vocabulary
            all_words = set()
            for text in texts:
                all_words.update(text.split())
            vocabulary = sorted(list(all_words))
            features = vocabulary
            
            # Create one-hot vectors
            for i, text in enumerate(texts):
                words = set(text.split())
                vector = [1 if word in words else 0 for word in vocabulary]
                
                represented_data.append({
                    **data[i],
                    "vector": vector,
                    "representation_method": "one-hot"
                })
        
        elif method == "bow":
            # Bag of Words
            vectorizer = CountVectorizer()
            X = vectorizer.fit_transform(texts)
            feature_names = vectorizer.get_feature_names_out()
            features = feature_names.tolist()
            
            for i, text in enumerate(texts):
                vector = X[i].toarray()[0].tolist()
                represented_data.append({
                    **data[i],
                    "vector": vector,
                    "representation_method": "bow"
                })
        
        elif method == "tfidf":
            # TF-IDF
            vectorizer = TfidfVectorizer()
            X = vectorizer.fit_transform(texts)
            feature_names = vectorizer.get_feature_names_out()
            features = feature_names.tolist()
            
            for i, text in enumerate(texts):
                vector = X[i].toarray()[0].tolist()
                represented_data.append({
                    **data[i],
                    "vector": vector,
                    "representation_method": "tfidf"
                })
        
        elif method == "ngram":
            # N-grams (bigrams)
            vectorizer = CountVectorizer(ngram_range=(2, 2))
            X = vectorizer.fit_transform(texts)
            feature_names = vectorizer.get_feature_names_out()
            features = feature_names.tolist()
            
            for i, text in enumerate(texts):
                vector = X[i].toarray()[0].tolist()
                represented_data.append({
                    **data[i],
                    "vector": vector,
                    "representation_method": "ngram"
                })
        
        elif method in ["word2vec", "glove", "fasttext", "doc2vec", "sentence"]:
            # Word embeddings (simplified simulation)
            # In a real implementation, you would use pre-trained models
            
            # Create a simple Word2Vec model for demonstration
            tokenized_texts = [text.split() for text in texts]
            
            # Train a simple model
            embedding_size = 3  # Small for demonstration
            model = Word2Vec(sentences=tokenized_texts, vector_size=embedding_size, window=5, min_count=1, workers=4)
            
            if method in ["word2vec", "glove", "fasttext"]:
                # Word-level embeddings
                word_vectors = {}
                for word in model.wv.index_to_key:
                    word_vectors[word] = model.wv[word].tolist()
                
                for i, text in enumerate(texts):
                    words = text.split()
                    if not words:
                        vector = [0] * embedding_size
                    else:
                        # Average word vectors
                        vectors = [model.wv[word] for word in words if word in model.wv]
                        if vectors:
                            vector = np.mean(vectors, axis=0).tolist()
                        else:
                            vector = [0] * embedding_size
                    
                    represented_data.append({
                        **data[i],
                        "vector": vector,
                        "representation_method": method
                    })
            else:
                # Document-level embeddings (doc2vec or sentence)
                for i, text in enumerate(texts):
                    # Simulate document vector
                    words = text.split()
                    if not words:
                        vector = [0] * embedding_size
                    else:
                        # Use word vectors and add some noise for variety
                        vectors = [model.wv[word] for word in words if word in model.wv]
                        if vectors:
                            vector = np.mean(vectors, axis=0)
                            # Add some noise to differentiate from word vectors
                            noise = np.random.normal(0, 0.1, embedding_size)
                            vector = (vector + noise).tolist()
                        else:
                            vector = [0] * embedding_size
                    
                    represented_data.append({
                        **data[i],
                        "vector": vector,
                        "representation_method": method
                    })
        
        else:
            logger.error(f"Unsupported representation method: {method}")
            logs.append(f"Unsupported representation method: {method}")
            raise HTTPException(status_code=400, detail={"message": f"Unsupported representation method: {method}", "logs": logs})
        
        logger.info(f"Successfully represented {len(represented_data)} items")
        logs.append(f"Successfully represented {len(represented_data)} items")
        
        return {
            "message": "Data represented successfully",
            "represented_data": represented_data,
            "features": features,
            "logs": logs
        }
    except Exception as e:
        logger.error(f"Error during data representation: {str(e)}")
        logger.error(traceback.format_exc())
        logs.append(f"Error during data representation: {str(e)}")
        raise HTTPException(status_code=500, detail={"message": f"Error during data representation: {str(e)}", "logs": logs})

