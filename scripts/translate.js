const axios = require('axios');
const fs = require('fs').promises';
const path = require('path');

const API_KEY = 'AIzaSyBOti4mM-6x9WDnZIjIeyEU21OpBXqWBgw';
const API_URL = 'https://translation.googleapis.com/language/translate/v2';

async function translateText(text, targetLang = 'vi') {
  try {
    const response = await axios.post(`${API_URL}?key=${API_KEY}`, {
      q: text,
      target: targetLang,
    });
    return response.data.data.translations[0].translatedText;
  } catch (error) {
    console.error('Translation error:', error.message);
    return text; // Return original text if translation fails
  }
}

async function translateObject(obj) {
  const translated = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'object' && value !== null) {
      translated[key] = await translateObject(value);
    } else if (typeof value === 'string' && !value.includes('{') && !value.includes('}')) {
      // Only translate strings that don't contain placeholders
      translated[key] = await translateText(value);
    } else {
      translated[key] = value;
    }
  }
  
  return translated;
}

async function main() {
  try {
    // Read English messages
    const enMessages = JSON.parse(
      await fs.readFile(path.join(__dirname, '../messages/en.json'), 'utf8')
    );

    // Translate to Vietnamese
    console.log('Translating messages to Vietnamese...');
    const viMessages = await translateObject(enMessages);

    // Write Vietnamese messages
    await fs.writeFile(
      path.join(__dirname, '../messages/vi.json'),
      JSON.stringify(viMessages, null, 2),
      'utf8'
    );

    console.log('Translation completed successfully!');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main(); 