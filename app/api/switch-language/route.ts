import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { Translator } from '@google-cloud/translate';

const translator = new Translator();

async function translateJson(data: any, targetLang: string): Promise<any> {
  const translated: any = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      try {
        const [translation] = await translator.translate(value, { to: targetLang });
        translated[key] = translation;
      } catch (error) {
        console.error(`Error translating ${key}:`, error);
        translated[key] = value;
      }
    } else if (typeof value === 'object' && value !== null) {
      translated[key] = await translateJson(value, targetLang);
    } else {
      translated[key] = value;
    }
  }
  
  return translated;
}

export async function POST(request: Request) {
  try {
    const { language } = await request.json();
    
    // Check if the language file exists
    const messagesDir = path.join(process.cwd(), 'messages');
    const targetFile = path.join(messagesDir, `${language}.json`);
    
    try {
      // Try to access the file
      await fs.access(targetFile);
      return NextResponse.json({ 
        status: 'success', 
        message: `Using existing translation for ${language}` 
      });
    } catch {
      // If file doesn't exist, create it by translating from English
      const sourceFile = path.join(messagesDir, 'en.json');
      const sourceData = JSON.parse(await fs.readFile(sourceFile, 'utf-8'));
      
      // Translate the data
      const translatedData = await translateJson(sourceData, language);
      
      // Save the translated data
      await fs.writeFile(
        targetFile, 
        JSON.stringify(translatedData, null, 2),
        'utf-8'
      );
      
      return NextResponse.json({ 
        status: 'success', 
        message: `Created new translation for ${language}` 
      });
    }
  } catch (error) {
    console.error('Error switching language:', error);
    return NextResponse.json(
      { error: 'Failed to switch language' },
      { status: 500 }
    );
  }
} 