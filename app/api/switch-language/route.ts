import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { v2 } from '@google-cloud/translate';

const translate = new v2.Translate({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  credentials: {
    client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
});

async function translateJson(data: any, targetLang: string): Promise<any> {
  const translated: any = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      try {
        const [translation] = await translate.translate(value, targetLang);
        translated[key] = translation;
      } catch (error) {
        console.error(`Error translating ${key}:`, error);
        translated[key] = value; // Keep original if translation fails
      }
    } else if (typeof value === 'object' && value !== null) {
      translated[key] = await translateJson(value, targetLang);
    } else {
      translated[key] = value;
    }
  }
  
  return translated;
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function findTranslationFile(language: string): Promise<{ exists: boolean; path?: string }> {
  const messagesDir = path.join(process.cwd(), 'messages');
  const autoTranslationsDir = path.join(messagesDir, 'auto-translations');
  
  // Check in main messages directory first (for committed translations)
  const mainPath = path.join(messagesDir, `${language}.json`);
  if (await fileExists(mainPath)) {
    return { exists: true, path: mainPath };
  }
  
  // Then check in auto-translations directory
  const autoPath = path.join(autoTranslationsDir, `${language}.json`);
  if (await fileExists(autoPath)) {
    return { exists: true, path: autoPath };
  }
  
  return { exists: false };
}

export async function POST(request: Request) {
  try {
    const { language } = await request.json();
    
    // First, check if we already have a translation file
    const translationFile = await findTranslationFile(language);
    
    if (translationFile.exists && translationFile.path) {
      // If we have a translation file, use it
      console.log(`Using existing translation file: ${translationFile.path}`);
      return NextResponse.json({ 
        status: 'success', 
        message: `Using existing translation for ${language}`,
        path: translationFile.path
      });
    }
    
    // If no translation exists, create one
    console.log(`No translation found for ${language}, creating new translation...`);
    
    // Ensure auto-translations directory exists
    const autoTranslationsDir = path.join(process.cwd(), 'messages', 'auto-translations');
    await fs.mkdir(autoTranslationsDir, { recursive: true });
    
    // Read English messages as source
    const sourceFile = path.join(process.cwd(), 'messages', 'en.json');
    const sourceData = JSON.parse(await fs.readFile(sourceFile, 'utf-8'));
    
    // Translate the data
    const translatedData = await translateJson(sourceData, language);
    
    // Save translated messages to auto-translations directory
    const targetFile = path.join(autoTranslationsDir, `${language}.json`);
    await fs.writeFile(
      targetFile, 
      JSON.stringify(translatedData, null, 2),
      'utf-8'
    );
    
    return NextResponse.json({ 
      status: 'success', 
      message: `Created new translation for ${language}`,
      path: targetFile
    });
    
  } catch (error) {
    console.error('Error switching language:', error);
    return NextResponse.json(
      { error: 'Failed to switch language' },
      { status: 500 }
    );
  }
} 