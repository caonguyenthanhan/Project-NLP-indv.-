# app.py
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from sklearn.naive_bayes import MultinomialNB
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import accuracy_score, confusion_matrix
import pandas as pd
import numpy as np
import logging
import os
from huggingface_hub import hf_hub_download
from datasets import load_dataset
from typing import Optional

# Cấu hình logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

app = FastAPI()

# Biến toàn cục để lưu mô hình và vectorizer
model = None
vectorizer = None

# Thư mục lưu datasets
DATASET_DIR = "datasets"
if not os.path.exists(DATASET_DIR):
    os.makedirs(DATASET_DIR)

# Mapping giữa tên dataset và thông tin tải
DATASET_MAPPING = {
    "imdb": {
        "huggingface_name": "imdb",
        "split": "train",
        "file_name": "imdb.csv",
    },
    "ag_news": {
        "huggingface_name": "ag_news",
        "split": "train",
        "file_name": "ag_news.csv",
    },
    "twitter": {
        "huggingface_name": "sentiment140",
        "split": "train",
        "file_name": "twitter.csv",
    },
    "sms": {
        "url": "https://archive.ics.uci.edu/ml/machine-learning-databases/00228/smsspamcollection.zip",
        "file_name": "sms.csv",
        "download_method": "url",
    },
    "bbc": {
        "url": "http://mlg.ucd.ie/files/datasets/bbc-fulltext.zip",
        "file_name": "bbc.csv",
        "download_method": "url",
    },
    "yelp": {
        "huggingface_name": "yelp_review_full",
        "split": "train",
        "file_name": "yelp.csv",
    },
}

@app.get("/get-dataset/{dataset_name}")
async def get_dataset(dataset_name: str):
    logger.info(f"Received request to get dataset: {dataset_name}")

    # Kiểm tra dataset có trong mapping không
    if dataset_name not in DATASET_MAPPING:
        logger.error(f"Dataset not supported: {dataset_name}")
        raise HTTPException(status_code=400, detail="Dataset not supported")

    dataset_info = DATASET_MAPPING[dataset_name]
    file_path = os.path.join(DATASET_DIR, dataset_info["file_name"])

    # Kiểm tra file đã tồn tại chưa
    if not os.path.exists(file_path):
        logger.info(f"Dataset {dataset_name} not found locally, downloading...")

        try:
            if "huggingface_name" in dataset_info:
                # Tải từ Hugging Face
                dataset = load_dataset(dataset_info["huggingface_name"], split=dataset_info["split"])
                df = pd.DataFrame(dataset)
                df.to_csv(file_path, index=False)
                logger.info(f"Downloaded and saved {dataset_name} to {file_path}")
            elif "url" in dataset_info:
                # Tải từ URL (ví dụ: SMS Spam, BBC News)
                import requests
                import zipfile
                import io

                response = requests.get(dataset_info["url"])
                if response.status_code != 200:
                    logger.error(f"Failed to download dataset {dataset_name}: HTTP {response.status_code}")
                    raise HTTPException(status_code=500, detail="Failed to download dataset")

                # Giả sử file tải về là ZIP
                with zipfile.ZipFile(io.BytesIO(response.content)) as z:
                    # Xử lý file cụ thể tùy dataset
                    if dataset_name == "sms":
                        with z.open("SMSSpamCollection") as f:
                            df = pd.read_csv(f, sep="\t", names=["label", "text"])
                            df.to_csv(file_path, index=False)
                    elif dataset_name == "bbc":
                        # BBC dataset có nhiều thư mục, cần xử lý thêm
                        # Đây là ví dụ đơn giản, bạn có thể cần xử lý chi tiết hơn
                        df_list = []
                        for file_name in z.namelist():
                            if file_name.endswith(".txt"):
                                with z.open(file_name) as f:
                                    content = f.read().decode("utf-8")
                                    category = file_name.split("/")[0]
                                    df_list.append({"text": content, "label": category})
                        df = pd.DataFrame(df_list)
                        df.to_csv(file_path, index=False)
                logger.info(f"Downloaded and saved {dataset_name} to {file_path}")
        except Exception as e:
            logger.error(f"Error downloading dataset {dataset_name}: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error downloading dataset: {str(e)}")

    # Trả file về cho client
    logger.info(f"Sending dataset file: {file_path}")
    return FileResponse(file_path, filename=dataset_info["file_name"])

@app.post("/train")
async def train_model(file: UploadFile = File(None), algorithm: str = "naive-bayes", alpha: float = 1.0):
    global model, vectorizer

    # Kiểm tra xem có file được gửi lên không
    if not file:
        logger.error("No file uploaded for training")
        raise HTTPException(status_code=400, detail="No file uploaded for training")

    logger.info(f"Received training request with algorithm: {algorithm}, alpha: {alpha}")

    try:
        # Đọc file CSV
        df = pd.read_csv(file.file)
        logger.info(f"Dataset loaded with shape: {df.shape}")

        # Kiểm tra các cột cần thiết
        if "text" not in df.columns or "label" not in df.columns:
            logger.error("Dataset must contain 'text' and 'label' columns")
            raise HTTPException(status_code=400, detail="Dataset must contain 'text' and 'label' columns")

        # Chuẩn bị dữ liệu
        X = df["text"].astype(str).values
        y = df["label"].values

        # Vector hóa văn bản
        vectorizer = TfidfVectorizer(stop_words="english")
        X_transformed = vectorizer.fit_transform(X)
        logger.info("Text vectorization completed")

        # Huấn luyện mô hình
        if algorithm == "naive-bayes":
            model = MultinomialNB(alpha=alpha)
            model.fit(X_transformed, y)
            logger.info("Model training completed")

            # Đánh giá mô hình (ví dụ: accuracy trên tập huấn luyện)
            y_pred = model.predict(X_transformed)
            accuracy = accuracy_score(y, y_pred)
            logger.info(f"Training accuracy: {accuracy}")

            return {"message": "Model trained successfully", "accuracy": accuracy}
        else:
            logger.error(f"Unsupported algorithm: {algorithm}")
            raise HTTPException(status_code=400, detail="Unsupported algorithm")
    except Exception as e:
        logger.error(f"Error during training: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error during training: {str(e)}")

@app.post("/predict")
async def predict(text: str):
    global model, vectorizer

    if not model or not vectorizer:
        logger.error("Model not trained")
        raise HTTPException(status_code=400, detail="Model not trained")

    try:
        # Vector hóa văn bản đầu vào
        X_transformed = vectorizer.transform([text])
        prediction = model.predict(X_transformed)[0]
        logger.info(f"Prediction for text '{text}': {prediction}")

        return {"prediction": str(prediction)}
    except Exception as e:
        logger.error(f"Error during prediction: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error during prediction: {str(e)}")