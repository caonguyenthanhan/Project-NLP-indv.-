import json
import os
from googletrans import Translator
from typing import Dict, Any

def load_json_file(file_path: str) -> Dict[str, Any]:
    """Load a JSON file and return its content as a dictionary."""
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json_file(data: Dict[str, Any], file_path: str):
    """Save a dictionary as a JSON file."""
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def translate_text(text: str, target_lang: str) -> str:
    """Translate text to target language using Google Translate."""
    translator = Translator()
    try:
        result = translator.translate(text, dest=target_lang)
        return result.text
    except Exception as e:
        print(f"Error translating text: {e}")
        return text

def translate_json(data: Dict[str, Any], target_lang: str) -> Dict[str, Any]:
    """Recursively translate all string values in a dictionary."""
    translated = {}
    for key, value in data.items():
        if isinstance(value, str):
            translated[key] = translate_text(value, target_lang)
        elif isinstance(value, dict):
            translated[key] = translate_json(value, target_lang)
        elif isinstance(value, list):
            translated[key] = [translate_json(item, target_lang) if isinstance(item, dict) else item for item in value]
        else:
            translated[key] = value
    return translated

def main():
    # Path to the source English JSON file
    source_file = "messages/en.json"
    
    # Target languages to translate to
    target_languages = {
        "vi": "Vietnamese",
        "fr": "French",
        "es": "Spanish",
        "de": "German",
        "ja": "Japanese",
        "ko": "Korean",
        "zh": "Chinese"
    }
    
    # Load the source JSON file
    source_data = load_json_file(source_file)
    
    # Create messages directory if it doesn't exist
    os.makedirs("messages", exist_ok=True)
    
    # Translate to each target language
    for lang_code, lang_name in target_languages.items():
        print(f"Translating to {lang_name}...")
        target_file = f"messages/{lang_code}.json"
        
        # Skip if target file already exists
        if os.path.exists(target_file):
            print(f"File {target_file} already exists. Skipping...")
            continue
        
        # Translate the data
        translated_data = translate_json(source_data, lang_code)
        
        # Save the translated data
        save_json_file(translated_data, target_file)
        print(f"Translation to {lang_name} completed and saved to {target_file}")

if __name__ == "__main__":
    main() 