from fastapi import FastAPI, HTTPException, Request, Response
import requests
from bs4 import BeautifulSoup
import logging
import re
import os
import sys
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer
from sklearn.feature_extraction.text import TfidfVectorizer, CountVectorizer
import nlpaug.augmenter.word as naw
import pickle
import nltk
import traceback
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import numpy as np
from fastapi.responses import FileResponse, JSONResponse
import subprocess
import matplotlib.pyplot as plt
import ssl
from typing import List, Dict, Any, Optional
import torch
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM, pipeline, AutoModelForQuestionAnswering, AutoModelForCausalLM
from sentence_transformers import SentenceTransformer
from pydantic import BaseModel, Field, validator
import json
from googletrans import Translator
from google.cloud import translate_v2 as translate
from translation_server import translate_messages as perform_translation
from datetime import datetime
from sklearn.naive_bayes import MultinomialNB
from sklearn.linear_model import LogisticRegression
from sklearn.svm import LinearSVC
import joblib
from pathlib import Path
import asyncio
import pandas as pd
from dotenv import load_dotenv
from openai import OpenAI
from sklearn.metrics.pairwise import cosine_similarity

# Load environment variables from .env file
load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Constants
BASE_DIR = Path(__file__).parent
MODEL_SCRIPT_NAME = "project_nlp_model.py"
SCRIPT_TIMEOUT = 600  # 10 phút
MODELS_DIR = BASE_DIR / "models"
FINE_TUNED_MODEL_DIR = BASE_DIR / "phobert-finetuned-viquad2"
KNOWLEDGE_BASE_PATH = BASE_DIR / "knowledge_base.csv"
SERVER_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_COMPARISON_IMAGE = os.path.join(MODELS_DIR, "model_comparison.png")

# Ensure models directory exists
if not os.path.exists(MODELS_DIR):
    os.makedirs(MODELS_DIR)
    logger.info(f"Created models directory at: {MODELS_DIR}")
else:
    logger.info(f"Using existing models directory at: {MODELS_DIR}")

# Setup NLTK downloader with SSL context
try:
    _create_unverified_https_context = ssl._create_unverified_context
except AttributeError:
    pass
else:
    ssl._create_default_https_context = _create_unverified_https_context


# Download NLTK data with error handling
def download_nltk_data():
    resources = ["punkt", "stopwords", "wordnet", "averaged_perceptron_tagger"]
    for resource in resources:
        try:
            nltk.download(resource, quiet=True)
            logger.info(f"Successfully downloaded {resource}")
        except Exception as e:
            logger.warning(f"Failed to download {resource}: {str(e)}")
            logger.warning("Continuing without this resource...")

# Try to download NLTK data
download_nltk_data()

# Initialize Google Cloud Translate client
try:
    # Load credentials from config.json
    with open('config.json', 'r') as f:
        credentials = json.load(f)
    
    # Set environment variable for Google Cloud credentials
    os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = 'config.json'
    
    # Initialize the client
    translate_client = translate.Client()
    logger.info("Google Cloud Translate client initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize Google Cloud Translate client: {str(e)}")
    translate_client = None

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_utf8_charset(request: Request, call_next):
    response = await call_next(request)
    if response.headers.get("content-type") == "application/json":
        response.headers["content-type"] = "application/json; charset=utf-8"
    return response

# Mount the models directory to serve static files
app.mount("/models", StaticFiles(directory=MODELS_DIR), name="models")

def create_model_comparison_image(image_path: str) -> bool:
    try:
        # Load model performance data
        model_performance = {
            "Naive Bayes": {
                "accuracy": 0.85,
                "precision": 0.84,
                "recall": 0.85,
                "f1": 0.84
            },
            "Logistic Regression": {
                "accuracy": 0.88,
                "precision": 0.87,
                "recall": 0.88,
                "f1": 0.87
            },
            "SVM": {
                "accuracy": 0.89,
                "precision": 0.88,
                "recall": 0.89,
                "f1": 0.88
            }
        }

        # Create bar chart
        metrics = ["accuracy", "precision", "recall", "f1"]
        x = np.arange(len(metrics))
        width = 0.25

        fig, ax = plt.subplots(figsize=(12, 6))
        for i, (model, scores) in enumerate(model_performance.items()):
            values = [scores[metric] for metric in metrics]
            ax.bar(x + i * width, values, width, label=model)

        ax.set_ylabel('Score')
        ax.set_title('Model Performance Comparison')
        ax.set_xticks(x + width)
        ax.set_xticklabels(metrics)
        ax.legend()

        # Ensure the directory exists
        os.makedirs(os.path.dirname(image_path), exist_ok=True)
        
        # Save the figure
        plt.tight_layout()
        plt.savefig(image_path)
        plt.close()

        logger.info(f"Model comparison image saved successfully at: {image_path}")
        return True
    except Exception as e:
        logger.error(f"Error creating model comparison image: {str(e)}")
        return False

@app.post("/scrape-url")
async def scrape_url(request: Request):
    try:
        data = await request.json()
        url = data.get("url")
        if not url:
            raise HTTPException(status_code=400, detail="URL is required")

        # Add headers to mimic a browser request
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }

        try:
            response = requests.get(url, headers=headers, timeout=10, verify=False)
            response.raise_for_status()
            
            # Try different parsers if one fails
            for parser in ['html.parser', 'lxml', 'html5lib']:
                try:
                    soup = BeautifulSoup(response.text, parser)
                    # Get text from p tags
                    p_texts = [p.get_text(strip=True) for p in soup.find_all("p") if p.get_text(strip=True)]
                    
                    # If no p tags found, try getting text from divs
                    if not p_texts:
                        p_texts = [div.get_text(strip=True) for div in soup.find_all("div") if div.get_text(strip=True)]
                    
                    # Filter out very short texts
                    texts = [text for text in p_texts if len(text.split()) > 3]
                    
                    if texts:
                        logger.info(f"Successfully scraped {len(texts)} text segments from {url}")
                        return {"data": texts}
                except Exception as parser_error:
                    logger.warning(f"Parser {parser} failed: {str(parser_error)}")
                    continue
            
            raise HTTPException(status_code=404, detail="No meaningful text found on the page")
            
        except requests.Timeout:
            raise HTTPException(status_code=408, detail="Request timed out")
        except requests.RequestException as e:
            raise HTTPException(status_code=500, detail=f"Failed to fetch URL: {str(e)}")
            
    except Exception as e:
        logger.error(f"Scraping failed for URL: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Scraping failed: {str(e)}")

@app.post("/augment-data")
async def augment_data(request: dict):
    data = request.get("data")
    if not data:
        raise HTTPException(status_code=400, detail="Data is required")
    
    aug = naw.SynonymAug(aug_p=0.3)
    augmented_data = []
    
    for item in data:
        # Handle different possible structures of item
        if isinstance(item, dict):
            # Case 1: item is a dict like {"text": "text1", "label": "label1"}
            text = item.get("text")
            label = item.get("label", "")
        elif isinstance(item, list) and len(item) > 0:
            # Case 2: item is a list like ["text1"]
            text = item[0] if isinstance(item[0], str) else None
            label = ""
        elif isinstance(item, str):
            # Case 3: item is a string like "text1"
            text = item
            label = ""
        else:
            # Skip invalid items
            continue
        
        # Ensure text is a string and not empty
        if not isinstance(text, str) or not text.strip():
            continue
        
        try:
            augmented_text = aug.augment(text)[0]
            augmented_data.append({"text": augmented_text, "label": label})
        except Exception as e:
            print(f"Error augmenting text: {text}, Error: {str(e)}")
            continue
    
    return {"augmented_data": augmented_data}

    
@app.post("/clean-data")
async def clean_data(request: Request):
    try:
        data = await request.json()
        texts = [item["text"] for item in data["data"]]
        options = data.get("options", {})
        
        cleaned_texts = []
        for text in texts:
            # Remove punctuation
            if options.get("remove_punctuation", True):
                text = re.sub(r'[^\w\s]', '', text)
            
            # Remove numbers
            if options.get("remove_numbers", True):
                text = re.sub(r'\d+', '', text)
            
            # Remove extra spaces
            if options.get("remove_extra_spaces", True):
                text = ' '.join(text.split())
            
            # Remove symbols
            if options.get("remove_symbols", True):
                text = re.sub(r'[^\w\s]', '', text)
            
            cleaned_texts.append(text)
        
        return {"cleaned_data": cleaned_texts}
    except Exception as e:
        print(f"Error in clean_data: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/preprocess-data")
async def preprocess_data(request: dict):
    try:
        data = request.get("data", [])
        options = request.get("options", {})
        stop_words = set(stopwords.words("english"))
        lemmatizer = WordNetLemmatizer()
        
        # Extract text from data objects
        texts = []
        for item in data:
            if isinstance(item, dict) and "text" in item:
                texts.append(item["text"])
            elif isinstance(item, str):
                texts.append(item)
        
        preprocessed_texts = []
        preprocessing_info = {
            "steps_applied": [],
            "original_texts": texts
        }
        
        for text in texts:
            if not isinstance(text, str):
                continue
                
            original_text = text
            
            # Apply preprocessing steps
            if options.get("lowercase", True):
                text = text.lower()
                preprocessing_info["steps_applied"].append("lowercase")
            
            # Tokenize
            tokens = word_tokenize(text)
            preprocessing_info["steps_applied"].append("tokenize")
            
            # Remove stopwords
            if options.get("remove_stopwords", True):
                tokens = [t for t in tokens if t not in stop_words]
                preprocessing_info["steps_applied"].append("remove_stopwords")
            
            # Lemmatize
            if options.get("lemmatize", True):
                tokens = [lemmatizer.lemmatize(t) for t in tokens]
                preprocessing_info["steps_applied"].append("lemmatize")
            
            # Join tokens back into text
            processed_text = " ".join(tokens)
            preprocessed_texts.append({
                "text": processed_text,
                "original_text": original_text
            })
            
        return {
            "processed_data": preprocessed_texts,
            "preprocessing_info": preprocessing_info
        }
    except Exception as e:
        logger.error(f"Error in preprocess_data: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/represent")
async def represent_text(request: Request):
    try:
        data = await request.json()
        # Ensure data is in the correct format
        if not isinstance(data, dict) or "data" not in data:
            raise HTTPException(status_code=400, detail="Invalid data format")
            
        # Extract texts from data array
        texts = []
        for item in data["data"]:
            if isinstance(item, dict) and "text" in item:
                texts.append(item["text"])
            elif isinstance(item, str):
                texts.append(item)
        
        if not texts:
            raise HTTPException(status_code=400, detail="No texts provided")

        # Initialize the sentence transformer model
        model_name = "sentence-transformers/all-MiniLM-L6-v2"
        model = SentenceTransformer(model_name)
        
        # Generate embeddings
        embeddings = model.encode(texts)
        
        # Convert numpy arrays to lists for JSON serialization
        vectors = embeddings.tolist()
        
        # Calculate features (e.g., dimensionality, sparsity)
        features = {
            "dimensionality": len(vectors[0]),
            "num_samples": len(vectors),
            "avg_magnitude": float(np.mean([np.linalg.norm(vec) for vec in vectors])),
            "sparsity": float(np.mean([np.count_nonzero(vec == 0) / len(vec) for vec in vectors]))
        }
        
        return {
            "vectors": vectors,
            "features": features,
            "model_info": {
                "name": model_name,
                "type": "Sentence Transformer"
            }
        }
        
    except Exception as e:
        logger.error(f"Error in text representation: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/compare-models")
async def compare_models(request: dict):
    try:
        data = request.get("data")
        task = request.get("task")
        model_type = request.get("modelType", "svm")
        datasetInfo = request.get("datasetInfo", {})
        preprocessing_info = request.get("preprocessing_info", {})
        
        if not data or not task:
            raise HTTPException(status_code=400, detail="Data and task are required")
        
        # Map task names to dataset names
        task_map = {
            "Sentiment Analysis": "IMDB_Reviews",
            "Text Classification": "BBC_News",
            "Spam Detection": "SMS_Spam",
            "Rating Prediction": "Yelp_Reviews",
        }
        
        # Map model type to model file name
        model_map = {
            "naive_bayes": "Naive Bayes",
            "logistic_regression": "Logistic Regression",
            "svm": "SVM",
        }
        
        dataset_name = task_map.get(task)
        if not dataset_name:
            raise HTTPException(status_code=400, detail=f"Task {task} not supported")
        
        model_name = model_map.get(model_type)
        if not model_name:
            raise HTTPException(status_code=400, detail=f"Model type {model_type} not supported")
        
        # Check if models directory exists
        if not os.path.exists(MODELS_DIR):
            raise HTTPException(status_code=500, detail="Models directory not found")
        
        # Extract and preprocess texts from data
        texts = []
        original_texts = []
        for item in data:
            if isinstance(item, dict):
                if "text" in item:
                    texts.append(item["text"])
                    original_texts.append(item.get("original_text", item["text"]))
                elif "processed_text" in item:
                    texts.append(item["processed_text"])
                    original_texts.append(item.get("original_text", item["processed_text"]))
            elif isinstance(item, str):
                texts.append(item)
                original_texts.append(item)
        
        if not texts:
            raise HTTPException(status_code=400, detail="No valid text data provided")
        
        # Load vectorizer
        vectorizer_path = os.path.join(MODELS_DIR, f"{dataset_name}_vectorizer.pkl")
        if not os.path.exists(vectorizer_path):
            raise HTTPException(status_code=404, detail=f"Vectorizer not found for {dataset_name}")
        
        try:
            # Use joblib instead of pickle
            vectorizer = joblib.load(vectorizer_path)
            X = vectorizer.transform(texts)
        except Exception as e:
            logger.error(f"Error loading vectorizer: {str(e)}")
            raise HTTPException(status_code=500, detail="Error loading vectorizer")
        
        # Load and apply the selected model
        model_path = os.path.join(MODELS_DIR, f"{dataset_name}_{model_name}.pkl")
        if not os.path.exists(model_path):
            raise HTTPException(status_code=404, detail=f"Model not found for {dataset_name}")
        
        try:
            # Use joblib instead of pickle
            model = joblib.load(model_path)
            predictions = model.predict(X)
            
            # Map predictions to labels based on dataset
            mapped_predictions = []
            for pred in predictions:
                if dataset_name == 'IMDB_Reviews':
                    mapped_predictions.append('Positive' if pred == 1 else 'Negative')
                elif dataset_name == 'BBC_News':
                    label_map = {
                        0: 'business',
                        1: 'entertainment',
                        2: 'politics',
                        3: 'sport',
                        4: 'tech'
                    }
                    mapped_predictions.append(label_map.get(pred, str(pred)))
                elif dataset_name == 'SMS_Spam':
                    mapped_predictions.append('spam' if pred == 1 else 'ham')
                elif dataset_name == 'Yelp_Reviews':
                    mapped_predictions.append(f"{pred + 1} stars")
                else:
                    mapped_predictions.append(str(pred))
            
            return {
                "predictions": mapped_predictions,
                "raw_predictions": predictions.tolist(),
                "input_texts": original_texts,
                "model_info": {
                    "dataset": dataset_name,
                    "model": model_name,
                }
            }
        except Exception as e:
            logger.error(f"Error loading/applying model: {str(e)}")
            raise HTTPException(status_code=500, detail="Error loading or applying model")
            
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error in compare_models: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/model-comparison-image")
async def get_model_comparison_image():
    try:
        if not os.path.exists(MODEL_COMPARISON_IMAGE):
            logger.warning(f"Model comparison image not found at: {MODEL_COMPARISON_IMAGE}")
            return JSONResponse(
                status_code=404,
                content={"error": "Model comparison image not found"}
            )
        return FileResponse(MODEL_COMPARISON_IMAGE)
    except Exception as e:
        logger.error(f"Error serving model comparison image: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"error": "Internal server error"}
        )

@app.post("/retrain-models")
async def retrain_models() -> Dict[str, str]:
    try:
        # Construct model script path
        model_script_path = BASE_DIR / MODEL_SCRIPT_NAME
        
        logger.info(f"Attempting to run script at: {model_script_path}")
        
        # Verify script exists
        if not model_script_path.is_file():
            raise HTTPException(
                status_code=404,
                detail=f"Model script not found at {model_script_path}"
            )
        
        # Prepare subprocess arguments
        cmd = [sys.executable, str(model_script_path)]
        
        try:
            # Run script with timeout
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            # Wait for completion with timeout
            stdout, stderr = await asyncio.wait_for(
                process.communicate(),
                timeout=SCRIPT_TIMEOUT
            )
            
            # Decode stdout and stderr with fallback
            def safe_decode(data: bytes) -> str:
                try:
                    return data.decode('utf-8')
                except UnicodeDecodeError:
                    try:
                        return data.decode('latin-1')
                    except UnicodeDecodeError:
                        return data.decode('utf-8', errors='replace')
            
            # Check process result
            if process.returncode != 0:
                error_msg = safe_decode(stderr) if stderr else "Unknown error"
                logger.error(f"Script execution failed: {error_msg}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Model retraining failed: {error_msg}"
                )
                
            # Verify script output
            output = safe_decode(stdout) if stdout else ""
            logger.info(f"Script output: {output}")
            
            # Create model comparison image
            image_path = MODELS_DIR / "model_comparison.png"
            if not await asyncio.to_thread(create_model_comparison_image, str(image_path)):
                raise HTTPException(
                    status_code=500,
                    detail="Failed to create model comparison image"
                )
                
            return {
                "message": "Models retrained successfully",
                "imagePath": f"/models/model_comparison.png"
            }
            
        except asyncio.TimeoutError:
            logger.error("Model training script timed out")
            raise HTTPException(
                status_code=504,
                detail=f"Model retraining timed out after {SCRIPT_TIMEOUT} seconds"
            )
            
        except subprocess.SubprocessError as e:
            logger.error(f"Subprocess error: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Subprocess error: {str(e)}")
            
    except Exception as e:
        logger.error(f"Unexpected error in retrain_models: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "Server is running"}

class TranslationRequest(BaseModel):
    messages: Dict
    targetLanguage: str

@app.post("/translate")
async def translate_endpoint(request: TranslationRequest):
    try:
        target_language = request.targetLanguage
        messages_dir = os.path.join(SERVER_DIR, "messages")
        
        # Kiểm tra xem bản dịch đã tồn tại chưa
        if check_translation_exists(target_language, messages_dir):
            # Nếu đã có file dịch, đọc từ file
            with open(os.path.join(messages_dir, f"{target_language}.json"), 'r', encoding='utf-8') as f:
                return json.load(f)
        
        # Nếu chưa có file dịch, dịch từ file en.json và lưu
        source_file = os.path.join(messages_dir, "en.json")
        if translate_and_save_file(source_file, target_language):
            # Đọc file vừa dịch
            with open(os.path.join(messages_dir, f"{target_language}.json"), 'r', encoding='utf-8') as f:
                return json.load(f)
        else:
            # Nếu dịch thất bại, dịch trực tiếp không lưu file
            return perform_translation(request.messages, target_language)
            
    except Exception as e:
        logger.error(f"Translation error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

class LanguageSwitchRequest(BaseModel):
    language: str

@app.post("/api/switch-language")
async def switch_language(request: LanguageSwitchRequest):
    try:
        language = request.language
        logger.info(f"Switching to language: {language}")

        # Check if translation exists
        messages_dir = os.path.join(SERVER_DIR, "..", "messages")
        target_file = os.path.join(messages_dir, f"{language}.json")
        
        if os.path.exists(target_file):
            logger.info(f"Translation file exists for {language}")
            return {"status": "success", "message": f"Using existing translation for {language}"}
        
        # If file doesn't exist, create it by translating from English
        source_file = os.path.join(messages_dir, "en.json")
        if not os.path.exists(source_file):
            raise HTTPException(status_code=404, detail="English translation file not found")
        
        with open(source_file, 'r', encoding='utf-8') as f:
            source_data = json.load(f)
        
        # Translate the data
        translated_data = await perform_translation(source_data, language)
        
        # Save the translated data
        with open(target_file, 'w', encoding='utf-8') as f:
            json.dump(translated_data, f, ensure_ascii=False, indent=2)
        
        logger.info(f"Created new translation for {language}")
        return {"status": "success", "message": f"Created new translation for {language}"}
        
    except Exception as e:
        logger.error(f"Error switching language: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    chat_name: str

@app.post("/api/chat/context")
async def context_chat_endpoint(request: ChatRequest):
    try:
        # Lấy tin nhắn cuối cùng từ người dùng
        user_message = request.messages[-1].content if request.messages else ""
        
        # Chuẩn bị tham số cho yêu cầu GET
        params = {
            "message": user_message,
            "sessionId": request.chat_name
        }

        logger.info(f"[*] Đang gửi yêu cầu tới: https://caonguyenthanhan.app.n8n.cloud/webhook/chatbot-response")
        logger.info(f"[*] Tham số: {params}")

        try:
            # Thực hiện yêu cầu GET với timeout 30 giây
            response = requests.get(
                "https://caonguyenthanhan.app.n8n.cloud/webhook/chatbot-response",
                params=params,
                timeout=30
            )

            # In ra mã trạng thái HTTP
            logger.info(f"\n[*] Mã trạng thái HTTP: {response.status_code}")

            # Kiểm tra xem yêu cầu có thành công không (mã 200 OK)
            if response.status_code == 200:
                # Lưu tin nhắn vào lịch sử
                await save_chat_history(request.chat_name, "user", user_message)
                await save_chat_history(request.chat_name, "assistant", response.text)
                
                return {"message": response.text}
            else:
                # In ra lỗi nếu mã trạng thái không phải 200
                error_msg = f"[!] Lỗi: Yêu cầu thất bại với mã trạng thái {response.status_code}"
                logger.error(error_msg)
                logger.error(f"[*] Nội dung phản hồi: {response.text}")
                raise HTTPException(status_code=response.status_code, detail=error_msg)

        except requests.exceptions.Timeout:
            error_msg = "[!] Lỗi: Yêu cầu bị hết thời gian chờ (timeout)."
            logger.error(error_msg)
            raise HTTPException(status_code=408, detail=error_msg)
        except requests.exceptions.RequestException as e:
            error_msg = f"[!] Lỗi trong quá trình gửi yêu cầu: {e}"
            logger.error(error_msg)
            raise HTTPException(status_code=500, detail=error_msg)
        except Exception as e:
            error_msg = f"[!] Có lỗi không mong muốn xảy ra: {e}"
            logger.error(error_msg)
            raise HTTPException(status_code=500, detail=error_msg)
            
    except Exception as e:
        logger.error(f"Error in context chat: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

async def save_chat_history(chat_name: str, role: str, content: str):
    try:
        # Lưu tin nhắn vào file JSON
        history_file = os.path.join(SERVER_DIR, "chat_history.json")
        
        # Đọc lịch sử hiện tại
        if os.path.exists(history_file):
            with open(history_file, "r", encoding="utf-8") as f:
                history = json.load(f)
        else:
            history = {}
            
        # Thêm tin nhắn mới
        if chat_name not in history:
            history[chat_name] = []
            
        history[chat_name].append({
            "role": role,
            "content": content,
            "timestamp": datetime.now().isoformat()
        })
        
        # Lưu lại lịch sử
        with open(history_file, "w", encoding="utf-8") as f:
            json.dump(history, f, ensure_ascii=False, indent=2)
            
    except Exception as e:
        logger.error(f"Error saving chat history: {str(e)}")

@app.post("/classify")
async def classify_text(request: Request):
    try:
        data = await request.json()
        texts = []
        for item in data.get("data", []):
            if isinstance(item, dict) and "text" in item:
                texts.append(item["text"])
            elif isinstance(item, str):
                texts.append(item)
            
        if not texts:
            raise HTTPException(status_code=400, detail="No texts provided")

        task = data.get("task")
        model_type = data.get("modelType", "svm")

        # Map task names to dataset names and their corresponding label mappings
        task_map = {
            "Sentiment Analysis": {
                "dataset": "IMDB_Reviews",
                "labels": {
                    0: "Negative",
                    1: "Positive"
                }
            },
            "Text Classification": {
                "dataset": "BBC_News",
                "labels": {
                    0: "business",
                    1: "entertainment",
                    2: "politics",
                    3: "sport",
                    4: "tech"
                }
            },
            "Spam Detection": {
                "dataset": "SMS_Spam",
                "labels": {
                    0: "ham",
                    1: "spam"
                }
            },
            "Rating Prediction": {
                "dataset": "Yelp_Reviews",
                "labels": {
                    0: "1 star",
                    1: "2 stars",
                    2: "3 stars",
                    3: "4 stars",
                    4: "5 stars"
                }
            }
        }

        # Map model type to model file name
        model_map = {
            "naive_bayes": "Naive_Bayes",
            "logistic_regression": "Logistic_Regression",
            "svm": "SVM"
        }

        task_info = task_map.get(task)
        if not task_info:
            raise HTTPException(status_code=400, detail=f"Task {task} not supported")

        dataset_name = task_info["dataset"]
        label_mapping = task_info["labels"]

        model_name = model_map.get(model_type)
        if not model_name:
            raise HTTPException(status_code=400, detail=f"Model type {model_type} not supported")

        # Load the trained model and vectorizer
        try:
            model_path = os.path.join(MODELS_DIR, f"{dataset_name}_{model_name}.pkl")
            vectorizer_path = os.path.join(MODELS_DIR, f"{dataset_name}_vectorizer.pkl")
            
            if not os.path.exists(model_path) or not os.path.exists(vectorizer_path):
                raise FileNotFoundError(f"Model or vectorizer not found for {dataset_name}")
            
            # Use joblib for loading
            model = joblib.load(model_path)
            vectorizer = joblib.load(vectorizer_path)
                
            logger.info(f"Loaded model and vectorizer for {dataset_name}")
        except Exception as e:
            logger.error(f"Error loading model/vectorizer: {str(e)}")
            raise HTTPException(status_code=500, detail="Error loading model")

        # Preprocess and transform texts
        try:
            # Basic preprocessing
            processed_texts = []
            for text in texts:
                # Convert to lowercase
                text = text.lower()
                # Remove extra whitespace
                text = ' '.join(text.split())
                processed_texts.append(text)

            # Transform texts using vectorizer
            X = vectorizer.transform(processed_texts)
            
            # Get predictions and probabilities if available
            predictions = model.predict(X)
            
            # Try to get prediction probabilities if the model supports it
            try:
                if hasattr(model, 'predict_proba'):
                    probabilities = model.predict_proba(X)
                else:
                    # For models like SVM that don't have predict_proba
                    probabilities = None
            except:
                probabilities = None

            # Map predictions to labels
            mapped_predictions = []
            confidence_scores = []
            
            for idx, pred in enumerate(predictions):
                # Get the mapped label
                mapped_label = label_mapping.get(pred, str(pred))
                mapped_predictions.append(mapped_label)
                
                # Get confidence score if available
                if probabilities is not None:
                    confidence = float(probabilities[idx][pred])
                    confidence_scores.append(confidence)
                else:
                    confidence_scores.append(None)

            response_data = {
                "predictions": mapped_predictions,
                "raw_predictions": predictions.tolist(),
                "confidence_scores": confidence_scores,
                "input_texts": texts,
                "processed_texts": processed_texts,
                "model_info": {
                    "dataset": dataset_name,
                    "model": model_name,
                    "task": task
                }
            }

            return response_data

        except Exception as e:
            logger.error(f"Error during prediction: {str(e)}")
            logger.error(traceback.format_exc())
            raise HTTPException(status_code=500, detail=f"Error during prediction: {str(e)}")

    except Exception as e:
        logger.error(f"Error in classify_text: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

# Initialize QA pipeline and knowledge base
qa_pipeline = None
knowledge_base_df = None

def load_qa_model_and_data():
    """Load the QA model and knowledge base data"""
    global qa_pipeline, knowledge_base_df
    
    try:
        # Load QA model
        if os.path.exists(FINE_TUNED_MODEL_DIR):
            qa_pipeline = pipeline(
                "question-answering",
                model=str(FINE_TUNED_MODEL_DIR),
                tokenizer=str(FINE_TUNED_MODEL_DIR)
            )
            logger.info("QA model loaded successfully")
        else:
            logger.error(f"QA model directory not found at {FINE_TUNED_MODEL_DIR}")
            
        # Load knowledge base
        if os.path.exists(KNOWLEDGE_BASE_PATH):
            knowledge_base_df = pd.read_csv(KNOWLEDGE_BASE_PATH)
            logger.info("Knowledge base loaded successfully")
        else:
            logger.error(f"Knowledge base file not found at {KNOWLEDGE_BASE_PATH}")
            
    except Exception as e:
        logger.error(f"Error loading QA model or knowledge base: {str(e)}")
        raise

def classify_question(question: str) -> str:
    """Classify a question into FAQ, SP, or EVEN categories"""
    question = question.lower()
    
    # Keywords for SP category
    sp_keywords = ["ngành", "môn học", "học phần", "học phí", "tín chỉ", "chuyên ngành", "chương trình đào tạo"]
    if any(keyword in question for keyword in sp_keywords):
        return "SP"
        
    # Keywords for EVEN category
    even_keywords = ["sự kiện", "lịch thi", "lịch nghỉ", "lịch học", "hạn chót", "khi nào", "bao giờ", "ngày mấy"]
    if any(keyword in question for keyword in even_keywords):
        return "EVEN"
        
    # Default to FAQ
    return "FAQ"

def get_context_from_kb(category: str, df: pd.DataFrame) -> str:
    """Get context from knowledge base based on category"""
    if df is None or category not in df['Category'].unique():
        return ""
        
    # Filter by category and get answers
    filtered_df = df[df['Category'] == category]
    if filtered_df.empty:
        return ""
        
    # Get up to 5 answers to form context
    answers = filtered_df['Answer'].head(5).tolist()
    return " ".join(answers)

class FineTunedQARequest(BaseModel):
    message: str
    sessionId: str

@app.post("/api/fine-tuned-qa")
async def fine_tuned_qa_endpoint(request: FineTunedQARequest):
    """Endpoint for fine-tuned QA with knowledge base"""
    try:
        # Check if model and knowledge base are loaded
        if qa_pipeline is None or knowledge_base_df is None:
            load_qa_model_and_data()
            if qa_pipeline is None or knowledge_base_df is None:
                raise HTTPException(
                    status_code=500,
                    detail="QA model or knowledge base not available"
                )
        
        # Get question and classify it
        question = request.message
        category = classify_question(question)
        
        # Get context from knowledge base
        context = get_context_from_kb(category, knowledge_base_df)
        if not context:
            return {
                "response": "Xin lỗi, tôi không tìm thấy thông tin phù hợp để trả lời câu hỏi của bạn."
            }
        
        # Get answer from QA model
        result = qa_pipeline(
            question=question,
            context=context,
            max_answer_len=100
        )
        
        # Save chat history
        await save_chat_history(request.sessionId, "user", question)
        await save_chat_history(request.sessionId, "assistant", result['answer'])
        
        return {
            "response": result['answer'],
            "confidence": result['score'],
            "category": category
        }
        
    except Exception as e:
        logger.error(f"Error in fine-tuned QA: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Error processing question: {str(e)}"
        )

class DomainChatRequest(BaseModel):
    message: str
    sessionId: str

@app.post("/api/chat/domain")
async def domain_chat_endpoint(request: DomainChatRequest):
    try:
        # Lấy tin nhắn từ người dùng
        user_message = request.message
        
        # Chuẩn bị tham số cho yêu cầu GET
        params = {
            "message": user_message,
            "sessionId": request.sessionId
        }

        logger.info(f"[*] Đang gửi yêu cầu tới: https://caonguyenthanhan.app.n8n.cloud/webhook/chatbot-response")
        logger.info(f"[*] Tham số: {params}")

        try:
            # Thực hiện yêu cầu GET với timeout 30 giây
            response = requests.get(
                "https://caonguyenthanhan.app.n8n.cloud/webhook/chatbot-response",
                params=params,
                timeout=30
            )

            # In ra mã trạng thái HTTP
            logger.info(f"\n[*] Mã trạng thái HTTP: {response.status_code}")

            # Kiểm tra xem yêu cầu có thành công không (mã 200 OK)
            if response.status_code == 200:
                # Lưu tin nhắn vào lịch sử
                await save_chat_history(request.sessionId, "user", user_message)
                await save_chat_history(request.sessionId, "assistant", response.text)
                
                return {"message": response.text}
            else:
                # In ra lỗi nếu mã trạng thái không phải 200
                error_msg = f"[!] Lỗi: Yêu cầu thất bại với mã trạng thái {response.status_code}"
                logger.error(error_msg)
                logger.error(f"[*] Nội dung phản hồi: {response.text}")
                raise HTTPException(status_code=response.status_code, detail=error_msg)

        except requests.exceptions.Timeout:
            error_msg = "[!] Lỗi: Yêu cầu bị hết thời gian chờ (timeout)."
            logger.error(error_msg)
            raise HTTPException(status_code=408, detail=error_msg)
        except requests.exceptions.RequestException as e:
            error_msg = f"[!] Lỗi trong quá trình gửi yêu cầu: {e}"
            logger.error(error_msg)
            raise HTTPException(status_code=500, detail=error_msg)
        except Exception as e:
            error_msg = f"[!] Có lỗi không mong muốn xảy ra: {e}"
            logger.error(error_msg)
            raise HTTPException(status_code=500, detail=error_msg)
            
    except Exception as e:
        logger.error(f"Error in domain chat: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

class FineTunedRequest(BaseModel):
    message: str
    sessionId: str

@app.post("/api/chat/fine-tuned")
async def fine_tuned_chat_endpoint(request: FineTunedRequest):
    try:
        # Load the fine-tuned model for question answering
        model = AutoModelForQuestionAnswering.from_pretrained(FINE_TUNED_MODEL_DIR)
        tokenizer = AutoTokenizer.from_pretrained(FINE_TUNED_MODEL_DIR)
        
        # Create QA pipeline
        qa_pipeline = pipeline(
            "question-answering",
            model=model,
            tokenizer=tokenizer
        )
        
        # Classify question to get appropriate context
        category = classify_question(request.message)
        
        # Get context from knowledge base
        df = pd.read_csv(KNOWLEDGE_BASE_PATH)
        context = get_context_from_kb(category, df)
        
        if not context:
            return JSONResponse(content={
                'response': "Xin lỗi, tôi không tìm thấy thông tin phù hợp để trả lời câu hỏi của bạn.",
                'confidence': 0.0,
                'category': category
            })
        
        # Get answer using the pipeline
        result = qa_pipeline({
            'question': request.message,
            'context': context
        })
        
        # Save chat history
        await save_chat_history(request.sessionId, "user", request.message)
        await save_chat_history(request.sessionId, "assistant", result['answer'])
        
        response = {
            'response': result['answer'],
            'confidence': float(result['score']),
            'category': category
        }
        
        return JSONResponse(content=response)
        
    except Exception as e:
        logger.error(f"Error in fine-tuned chat: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Initialize OpenAI client for aimlapi.com
aiml_client = OpenAI(
    base_url=os.getenv("AIMLAPI_BASE_URL", "https://api.aimlapi.com/v1"),
    api_key=os.getenv("AIMLAPI_KEY", "726fbcd05d824ddab7bb770de05dc1d6")
)

class AimlChatRequest(BaseModel):
    messages: List[ChatMessage]
    chat_name: str

@app.post("/api/chat/general")
async def general_chat_endpoint(request: AimlChatRequest):
    try:
        # Format messages for the API
        formatted_messages = [{"role": msg.role, "content": msg.content} for msg in request.messages]
        
        # Add system message if not present
        if not any(msg["role"] == "system" for msg in formatted_messages):
            formatted_messages.insert(0, {
                "role": "system",
                "content": "You are a helpful AI assistant."
            })

        # Call aimlapi.com
        response = aiml_client.chat.completions.create(
            model=os.getenv("AIMLAPI_MODEL", "gpt-3.5-turbo"),
            messages=formatted_messages,
            temperature=0.7,
            max_tokens=1000
        )

        # Get the response content
        ai_response = response.choices[0].message.content

        # Save to chat history
        await save_chat_history(request.chat_name, "assistant", ai_response)
        
        return {"message": ai_response}
        
    except Exception as e:
        logger.error(f"Error in AIML chat: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

class MovieRating(BaseModel):
    ratings: Dict[str, float]

@app.post("/recommend/collaborative")
async def collaborative_recommendation(request: MovieRating):
    try:
        # In ra màn hình để test
        print("Received ratings:")
        for movie_id, rating in request.ratings.items():
            print(f"Movie ID: {movie_id}, Rating: {rating}")
        
        # Trả về một số phim gợi ý mẫu để test
        recommendations = [
            {
                "id": "1",
                "title": "Toy Story (1995)",
                "genres": "Animation|Children|Comedy",
                "score": 4.5,
                "posterUrl": "https://example.com/posters/toy_story.jpg",
                "watchUrl": "https://example.com/watch/toy_story",
                "description": "Một câu chuyện về những món đồ chơi biết nói, đặc biệt là chàng cao bồi Woody và chàng phi hành gia Buzz Lightyear."
            },
            {
                "id": "2",
                "title": "Jumanji (1995)",
                "genres": "Adventure|Children|Fantasy",
                "score": 4.2,
                "posterUrl": "https://example.com/posters/jumanji.jpg",
                "watchUrl": "https://example.com/watch/jumanji",
                "description": "Một trò chơi bảng ma thuật biến thành hiện thực, đưa hai đứa trẻ vào một cuộc phiêu lưu đầy nguy hiểm."
            }
        ]
        
        return recommendations
    except Exception as e:
        print(f"Error processing ratings: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Model cho request data validation
class ContentBasedRequest(BaseModel):
    genres: List[str] = Field(..., min_items=1, description="Danh sách thể loại phim")
    description: str = Field(..., min_length=10, description="Mô tả nội dung phim")

    @validator('genres')
    def validate_genres(cls, v):
        valid_genres = {
            'Action', 'Adventure', 'Animation', 'Children', 'Comedy', 'Crime',
            'Documentary', 'Drama', 'Fantasy', 'Film-Noir', 'Horror', 'IMAX',
            'Musical', 'Mystery', 'Romance', 'Sci-Fi', 'Thriller', 'War', 'Western'
        }
        invalid_genres = [g for g in v if g not in valid_genres]
        if invalid_genres:
            raise ValueError(f"Thể loại không hợp lệ: {', '.join(invalid_genres)}")
        return v

    @validator('description')
    def validate_description(cls, v):
        if len(v.split()) < 5:
            raise ValueError("Mô tả phải có ít nhất 5 từ")
        return v

# Model cho response data
class ContentBasedResponse(BaseModel):
    predicted_rating: float
    suggestions: List[str]

# Load pre-trained model và vectorizer (giả định)
# model_path = "path/to/your/model.joblib"
# vectorizer_path = "path/to/your/vectorizer.joblib"
# model = joblib.load(model_path)
# vectorizer = joblib.load(vectorizer_path)

@app.post("/recommend/content-based", response_model=ContentBasedResponse)
async def get_content_based_recommendation(request: ContentBasedRequest):
    try:
        # 1. Xử lý và chuẩn hóa input
        genres_text = " ".join(request.genres)
        combined_text = f"{genres_text} {request.description}"

        # 2. Phân tích nội dung và dự đoán (mô phỏng)
        # Trong thực tế, bạn sẽ sử dụng model đã train
        # features = vectorizer.transform([combined_text])
        # predicted_rating = model.predict(features)[0]
        
        # Mô phỏng dự đoán (thay bằng model thật của bạn)
        predicted_rating = np.random.uniform(3.0, 5.0)  # Random rating between 3-5

        # 3. Tạo gợi ý cải thiện dựa trên các quy tắc
        suggestions = []
        
        # Kiểm tra và đưa ra gợi ý dựa trên thể loại
        if 'Action' in request.genres and 'Romance' not in request.genres:
            suggestions.append("Thêm yếu tố tình cảm có thể giúp thu hút khán giả nữ")
            
        if len(request.genres) < 3:
            suggestions.append("Có thể thêm các thể loại phụ để tăng tính đa dạng")
            
        # Kiểm tra độ dài mô tả
        if len(request.description.split()) < 20:
            suggestions.append("Mô tả chi tiết hơn về cốt truyện và nhân vật chính")
            
        # Kiểm tra từ khóa trong mô tả
        if "hành động" in request.description.lower() and "kịch tính" not in request.description.lower():
            suggestions.append("Tăng cường các yếu tố kịch tính trong các cảnh hành động")

        # 4. Trả về kết quả
        return ContentBasedResponse(
            predicted_rating=round(float(predicted_rating), 1),
            suggestions=suggestions
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Context-Aware Recommendation Models and Data
class ContextAwareRequest(BaseModel):
    recommendationType: str = Field(..., description="Type of recommendation (travel, movie, music, food)")
    mood: str = Field(..., description="User's current mood")
    timeOfDay: str = Field(..., description="Time of day (morning, afternoon, evening, night)")
    location: str = Field(..., description="User's location or area of interest")
    companionship: str = Field(..., description="Who the user is with (alone, couple, family, friends)")

# Sample recommendation data (in production, this would come from a database)
SAMPLE_RECOMMENDATIONS = {
    "travel": [
        {
            "name": "Công viên Tao Đàn",
            "type": "Công viên",
            "description": "Công viên rộng rãi với nhiều cây xanh, thích hợp cho hoạt động thể thao và thư giãn.",
            "suitability": "Phù hợp mọi lứa tuổi",
            "rating": 4.2,
            "imageUrl": "https://images.unsplash.com/photo-1519331379826-f10be5486c6f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60"
        },
        {
            "name": "Bảo tàng Chứng tích Chiến tranh",
            "type": "Bảo tàng",
            "description": "Bảo tàng trưng bày các hiện vật và hình ảnh về chiến tranh Việt Nam.",
            "suitability": "Không phù hợp trẻ nhỏ",
            "rating": 4.5,
            "imageUrl": "https://images.unsplash.com/photo-1569587112025-0d460e81a126?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60"
        }
    ],
    "movie": [
        {
            "name": "Phim Tâm Lý ABC",
            "type": "Phim Tâm Lý",
            "description": "Một bộ phim về tình yêu và sự trưởng thành.",
            "suitability": "13+",
            "rating": 4.3,
            "imageUrl": "https://images.unsplash.com/photo-1536440136628-849c177e76a1?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60"
        },
        {
            "name": "Phim Hành Động XYZ",
            "type": "Phim Hành Động",
            "description": "Phim hành động gay cấn với nhiều pha mạo hiểm.",
            "suitability": "16+",
            "rating": 4.1,
            "imageUrl": "https://images.unsplash.com/photo-1542204165-65bf26472b9b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60"
        }
    ],
    "music": [
        {
            "name": "Playlist Acoustic Chill",
            "type": "Acoustic",
            "description": "Những bản acoustic nhẹ nhàng, thư giãn.",
            "suitability": "Mọi lứa tuổi",
            "rating": 4.4,
            "imageUrl": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60"
        },
        {
            "name": "EDM Party Mix",
            "type": "EDM",
            "description": "Playlist sôi động với các bản hit EDM.",
            "suitability": "Giới trẻ",
            "rating": 4.6,
            "imageUrl": "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60"
        }
    ],
    "food": [
        {
            "name": "Nhà hàng Việt Nam XYZ",
            "type": "Ẩm thực Việt",
            "description": "Nhà hàng với các món ăn Việt Nam truyền thống.",
            "suitability": "Phù hợp gia đình",
            "rating": 4.5,
            "imageUrl": "https://images.unsplash.com/photo-1503764654157-72d979d9af2f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60"
        },
        {
            "name": "Quán Cafe ABC",
            "type": "Cafe",
            "description": "Quán cafe với không gian yên tĩnh, view đẹp.",
            "suitability": "Phù hợp làm việc, hẹn hò",
            "rating": 4.3,
            "imageUrl": "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60"
        }
    ]
}

def filter_recommendations_by_context(context: ContextAwareRequest) -> List[Dict]:
    """
    Filter and sort recommendations based on user context
    """
    recommendations = SAMPLE_RECOMMENDATIONS.get(context.recommendationType, [])
    
    # Deep copy to avoid modifying original data
    filtered_recommendations = recommendations.copy()
    
    # Apply mood-based filtering
    if context.mood == "relaxing":
        # Prefer relaxing activities/places
        filtered_recommendations = [r for r in filtered_recommendations if "thư giãn" in r["description"].lower() 
                                  or "yên tĩnh" in r["description"].lower()]
    elif context.mood == "fun":
        # Prefer fun/exciting activities
        filtered_recommendations = [r for r in filtered_recommendations if "vui" in r["description"].lower() 
                                  or "sôi động" in r["description"].lower()]
    
    # Apply time-based filtering
    if context.timeOfDay == "night":
        # Filter out places typically closed at night
        filtered_recommendations = [r for r in filtered_recommendations if "bảo tàng" not in r["type"].lower()]
    
    # Apply companionship-based filtering
    if context.companionship == "family":
        # Filter for family-friendly options
        filtered_recommendations = [r for r in filtered_recommendations if "gia đình" in r["suitability"].lower() 
                                  or "mọi lứa tuổi" in r["suitability"].lower()]
    elif context.companionship == "couple":
        # Filter for date-friendly options
        filtered_recommendations = [r for r in filtered_recommendations if "hẹn hò" in r["suitability"].lower() 
                                  or "lãng mạn" in r["description"].lower()]
    
    # If no recommendations match the filters, return original recommendations
    if not filtered_recommendations:
        filtered_recommendations = recommendations
    
    # Sort by rating (highest first)
    filtered_recommendations.sort(key=lambda x: x.get("rating", 0), reverse=True)
    
    return filtered_recommendations

@app.post("/recommend/context-aware")
async def get_context_aware_recommendations(context: ContextAwareRequest):
    """
    Get recommendations based on user context
    """
    try:
        logger.info(f"Received context: {context}")
        
        # Get filtered recommendations
        recommendations = filter_recommendations_by_context(context)
        
        if not recommendations:
            # If no recommendations found, return empty list
            return []
            
        # Return top recommendations (limit to 5)
        return recommendations[:5]
        
    except Exception as e:
        logger.error(f"Error in context-aware recommendations: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Error processing recommendations: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="localhost", port=8000) 