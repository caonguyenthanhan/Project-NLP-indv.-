from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from googletrans import Translator
from typing import Dict, Any
import json
import os

app = FastAPI()

# Cấu hình CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Model cho request body
class TranslationRequest(BaseModel):
    messages: Dict
    targetLanguage: str

# Khởi tạo translator
translator = Translator()

def translate_messages(messages: Dict[str, Any], target_language: str) -> Dict[str, Any]:
    """
    Dịch một dictionary messages sang ngôn ngữ đích.
    
    Args:
        messages: Dictionary chứa các message cần dịch
        target_language: Mã ngôn ngữ đích (vd: 'zh', 'ja', etc.)
    
    Returns:
        Dictionary với cùng cấu trúc nhưng đã được dịch
    """
    translated_messages = {}
    
    # Duyệt qua từng key trong messages
    for key, value in messages.items():
        if isinstance(value, dict):
            # Nếu value là dict, dịch đệ quy
            translated_messages[key] = {}
            for sub_key, sub_value in value.items():
                if isinstance(sub_value, str):
                    translated = translator.translate(
                        sub_value,
                        dest=target_language
                    )
                    translated_messages[key][sub_key] = translated.text
        elif isinstance(value, str):
            # Nếu value là string, dịch trực tiếp
            translated = translator.translate(
                value,
                dest=target_language
            )
            translated_messages[key] = translated.text
            
    return translated_messages

def translate_and_save_file(source_file: str, target_language: str) -> bool:
    """
    Dịch một file json sang ngôn ngữ đích và lưu kết quả.
    
    Args:
        source_file: Đường dẫn đến file nguồn (en.json)
        target_language: Mã ngôn ngữ đích (vd: 'zh', 'ja', etc.)
    
    Returns:
        bool: True nếu dịch và lưu thành công, False nếu thất bại
    """
    try:
        # Đọc file nguồn
        with open(source_file, 'r', encoding='utf-8') as f:
            messages = json.load(f)
        
        # Dịch messages
        translated_messages = translate_messages(messages, target_language)
        
        # Tạo tên file đích
        dir_name = os.path.dirname(source_file)
        target_file = os.path.join(dir_name, f"{target_language}.json")
        
        # Lưu kết quả dịch
        with open(target_file, 'w', encoding='utf-8') as f:
            json.dump(translated_messages, f, ensure_ascii=False, indent=2)
            
        return True
        
    except Exception as e:
        print(f"Error translating file: {str(e)}")
        return False

def check_translation_exists(target_language: str, messages_dir: str = "messages") -> bool:
    """
    Kiểm tra xem file dịch cho ngôn ngữ đích đã tồn tại chưa.
    
    Args:
        target_language: Mã ngôn ngữ đích (vd: 'zh', 'ja', etc.)
        messages_dir: Thư mục chứa các file dịch
    
    Returns:
        bool: True nếu file đã tồn tại, False nếu chưa
    """
    target_file = os.path.join(messages_dir, f"{target_language}.json")
    return os.path.exists(target_file)

@app.post("/translate")
async def translate_messages(request: TranslationRequest):
    try:
        translated_messages = translate_messages(request.messages, request.targetLanguage)
        return translated_messages
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="localhost", port=8000) 