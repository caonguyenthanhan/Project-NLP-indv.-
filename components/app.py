from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from sklearn.naive_bayes import MultinomialNB
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import accuracy_score, confusion_matrix
from sklearn.model_selection import train_test_split
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

# Cấu hình logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Chỉ dùng trong phát triển
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = None
vectorizer = None

DATASET_DIR = "./datasets"
if not os.path.exists(DATASET_DIR):
    os.makedirs(DATASET_DIR)

DATASET_MAPPING = {
    "imdb": {"huggingface_name": "imdb", "split": "train", "file_name": "imdb.csv"},
    "ag_news": {"huggingface_name": "ag_news", "split": "train", "file_name": "ag_news.csv"},
    "twitter": {"huggingface_name": "sentiment140", "split": "train", "file_name": "twitter.csv", "trust_remote_code": True},
    "sms": {"url": "https://archive.ics.uci.edu/ml/machine-learning-databases/00228/smsspamcollection.zip", "file_name": "sms.csv", "download_method": "url"},
    "bbc": {"url": "http://mlg.ucd.ie/files/datasets/bbc-fulltext.zip", "file_name": "bbc.csv", "download_method": "url"},
    "yelp": {"huggingface_name": "yelp_review_full", "split": "train", "file_name": "yelp.csv"},
}

@app.get("/get-dataset/{dataset_name}")
async def get_dataset(dataset_name: str):
    logger.info(f"Received GET request for dataset: {dataset_name}")
    logs = [f"Received GET request for dataset: {dataset_name}"]

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
                            logger.info(f"Saving SMS dataset to {file_path}")
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
                        logger.info(f"Saving BBC dataset to {file_path}")
                        df.to_csv(file_path, index=False)
                logs.append(f"Downloaded and saved {dataset_name} to {file_path}")
            logger.info(f"Successfully downloaded and saved {dataset_name} to {file_path}")
        except Exception as e:
            logger.error(f"Error downloading dataset {dataset_name}: {str(e)}")
            logs.append(f"Error downloading dataset {dataset_name}: {str(e)}")
            raise HTTPException(status_code=500, detail={"message": f"Error downloading dataset: {str(e)}", "logs": logs})

    logger.info(f"Preparing to send dataset file: {file_path}")
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
    logs = [f"Received POST request to analyze dataset stats"]

    if not file:
        logger.error("No file uploaded for dataset stats")
        logs.append("No file uploaded")
        raise HTTPException(status_code=400, detail={"message": "No file uploaded", "logs": logs})

    try:
        logger.info(f"Reading uploaded file: {file.filename}")
        df = pd.read_csv(file.file)
        logger.info(f"Dataset loaded with shape: {df.shape}")
        logs.append(f"Loaded dataset with {len(df)} rows")

        if "text" not in df.columns or "label" not in df.columns:
            logger.error("Dataset must contain 'text' and 'label' columns")
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
        logs.append(f"Error calculating dataset stats: {str(e)}")
        raise HTTPException(status_code=500, detail={"message": f"Error calculating dataset stats: {str(e)}", "logs": logs})

@app.post("/train")
async def train_model(file: UploadFile = File(None), algorithm: str = "naive-bayes", alpha: float = 1.0):
    global model, vectorizer
    logger.info(f"Received POST request to train model with algorithm: {algorithm}, alpha: {alpha}, file: {file.filename if file else 'None'}")
    logs = [f"Received POST request to train model with algorithm: {algorithm}, alpha: {alpha}"]

    if not file:
        logger.error("No file uploaded for training")
        logs.append("No file uploaded for training")
        raise HTTPException(status_code=400, detail={"message": "No file uploaded for training", "logs": logs})

    try:
        logger.info(f"Reading uploaded file: {file.filename}")
        df = pd.read_csv(file.file)
        logger.info(f"Dataset loaded with shape: {df.shape}")
        logs.append(f"Loaded dataset with {len(df)} rows")

        if "text" not in df.columns or "label" not in df.columns:
            logger.error("Dataset must contain 'text' and 'label' columns")
            logs.append("Dataset missing 'text' or 'label' columns")
            raise HTTPException(status_code=400, detail={"message": "Dataset must contain 'text' and 'label' columns", "logs": logs})

        X = df["text"].astype(str).values
        y = df["label"].values
        logger.info("Preparing data for training")
        logs.append("Preparing data for training")

        vectorizer = TfidfVectorizer(stop_words="english")
        X_transformed = vectorizer.fit_transform(X)
        logger.info("Text vectorization completed")
        logs.append("Text vectorization completed")

        X_train, X_test, y_train, y_test = train_test_split(X_transformed, y, test_size=0.2, random_state=42)
        logger.info(f"Dataset split: train={X_train.shape[0]}, test={X_test.shape[0]}")
        logs.append(f"Dataset split into train ({X_train.shape[0]}) and test ({X_test.shape[0]})")

        logger.info(f"Initializing model with algorithm: {algorithm}")
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

        logger.info("Evaluating model on test data")
        y_pred = model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        conf_matrix = confusion_matrix(y_test, y_pred).tolist()
        logger.info(f"Test accuracy: {accuracy}")
        logs.append(f"Model evaluated with accuracy: {accuracy:.4f}")

        top_features = []
        if algorithm in ["naive-bayes", "logistic"]:
            logger.info("Extracting top features")
            feature_names = vectorizer.get_feature_names_out()
            importance = np.abs(model.coef_[0]) if algorithm == "logistic" else np.log(model.feature_log_prob_[1])
            top_indices = importance.argsort()[-10:][::-1]
            top_features = [{"feature": feature_names[i], "importance": float(importance[i])} for i in top_indices]
            logs.append("Top features extracted")

        logger.info("Training process completed successfully")
        return {
            "message": "Model trained successfully",
            "accuracy": accuracy,
            "confusion_matrix": conf_matrix,
            "top_features": top_features,
            "logs": logs
        }
    except Exception as e:
        logger.error(f"Error during training: {str(e)}")
        logs.append(f"Error during training: {str(e)}")
        raise HTTPException(status_code=500, detail={"message": f"Error during training: {str(e)}", "logs": logs})

@app.post("/predict")
async def predict(text: str):
    global model, vectorizer
    logger.info(f"Received POST request to predict text: '{text[:50]}{'...' if len(text) > 50 else ''}'")
    logs = [f"Received POST request to predict text: '{text[:50]}{'...' if len(text) > 50 else ''}'"]

    if not model or not vectorizer:
        logger.error("Model or vectorizer not trained")
        logs.append("Model or vectorizer not trained")
        raise HTTPException(status_code=400, detail={"message": "Model not trained", "logs": logs})

    try:
        logger.info("Transforming input text for prediction")
        X_transformed = vectorizer.transform([text])
        logger.info("Text transformation completed")
        logs.append("Text transformation completed")

        logger.info("Making prediction")
        prediction = model.predict(X_transformed)[0]
        logger.info(f"Prediction completed: {prediction}")
        logs.append(f"Prediction completed: {prediction}")

        logger.info("Prediction process completed successfully")
        return {"prediction": str(prediction), "logs": logs}
    except Exception as e:
        logger.error(f"Error during prediction: {str(e)}")
        logs.append(f"Error during prediction: {str(e)}")
        raise HTTPException(status_code=500, detail={"message": f"Error during prediction: {str(e)}", "logs": logs})

@app.post("/save-model")
async def save_model():
    global model, vectorizer
    logger.info("Received POST request to save model")
    logs = ["Received POST request to save model"]

    if not model or not vectorizer:
        logger.error("No model trained to save")
        logs.append("No model trained to save")
        raise HTTPException(status_code=400, detail={"message": "No model trained", "logs": logs})

    try:
        logger.info("Saving model and vectorizer")
        joblib.dump(model, os.path.join(DATASET_DIR, "model.pkl"))
        joblib.dump(vectorizer, os.path.join(DATASET_DIR, "vectorizer.pkl"))
        logger.info("Model and vectorizer saved successfully")
        logs.append("Model and vectorizer saved successfully")
        return {"message": "Model saved successfully", "logs": logs}
    except Exception as e:
        logger.error(f"Error saving model: {str(e)}")
        logs.append(f"Error saving model: {str(e)}")
        raise HTTPException(status_code=500, detail={"message": f"Error saving model: {str(e)}", "logs": logs})

@app.post("/load-model")
async def load_model():
    global model, vectorizer
    logger.info("Received POST request to load model")
    logs = ["Received POST request to load model"]

    model_path = os.path.join(DATASET_DIR, "model.pkl")
    vectorizer_path = os.path.join(DATASET_DIR, "vectorizer.pkl")

    if not os.path.exists(model_path) or not os.path.exists(vectorizer_path):
        logger.error("No saved model found")
        logs.append("No saved model found")
        raise HTTPException(status_code=400, detail={"message": "No saved model found", "logs": logs})

    try:
        logger.info("Loading model and vectorizer")
        model = joblib.load(model_path)
        vectorizer = joblib.load(vectorizer_path)
        logger.info("Model and vectorizer loaded successfully")
        logs.append("Model and vectorizer loaded successfully")
        return {"message": "Model loaded successfully", "logs": logs}
    except Exception as e:
        logger.error(f"Error loading model: {str(e)}")
        logs.append(f"Error loading model: {str(e)}")
        raise HTTPException(status_code=500, detail={"message": f"Error loading model: {str(e)}", "logs": logs})