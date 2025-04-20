import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { v2 } from '@google-cloud/translate';

// Check required environment variables
const requiredEnvVars = [
  'GOOGLE_CLOUD_PROJECT_ID',
  'GOOGLE_CLOUD_CLIENT_EMAIL',
  'GOOGLE_CLOUD_PRIVATE_KEY'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

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
  const mainPath = path.join(messagesDir, `${language}.json`);
  
  if (await fileExists(mainPath)) {
    return { exists: true, path: mainPath };
  }
  
  return { exists: false };
}

async function createTranslation(language: string): Promise<string> {
  const messagesDir = path.join(process.cwd(), 'messages');
  
  // Read English source file
  const sourcePath = path.join(messagesDir, 'en.json');
  if (!await fileExists(sourcePath)) {
    throw new Error('English source file not found');
  }
  
  const sourceContent = await fs.readFile(sourcePath, 'utf-8');
  const sourceData = JSON.parse(sourceContent);
  
  // Translate content
  const translatedData = await translateJson(sourceData, language);
  
  // Write translated file directly to messages directory
  const targetPath = path.join(messagesDir, `${language}.json`);
  await fs.writeFile(targetPath, JSON.stringify(translatedData, null, 2), 'utf-8');
  
  return targetPath;
}

export async function POST(request: Request) {
  try {
    const { language } = await request.json();
    
    if (!language) {
      return NextResponse.json(
        { error: 'Language parameter is required' },
        { status: 400 }
      );
    }
    
    // Check if translation exists
    const { exists, path: existingPath } = await findTranslationFile(language);
    
    if (exists && existingPath) {
      return NextResponse.json({
        status: 'success',
        message: `Using existing translation for ${language}`,
        path: existingPath
      });
    }
    
    // Create new translation
    console.log(`No translation found for ${language}, creating new translation...`);
    const newPath = await createTranslation(language);
    
    return NextResponse.json({
      status: 'success',
      message: `Created new translation for ${language}`,
      path: newPath
    });
    
  } catch (error) {
    console.error('Error in switch-language:', error);
    return NextResponse.json(
      { error: 'Failed to switch language' },
      { status: 500 }
    );
  }
} 