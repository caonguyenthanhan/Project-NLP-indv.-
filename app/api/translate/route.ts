import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { messages, targetLocale } = await request.json();

    // Gọi đến Python translation server
    const response = await fetch('http://localhost:8000/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        targetLanguage: targetLocale
      }),
    });

    if (!response.ok) {
      throw new Error('Translation server error');
    }

    const translatedMessages = await response.json();
    return NextResponse.json({ messages: translatedMessages });
    
  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json(
      { error: 'Translation failed: ' + (error as Error).message }, 
      { status: 500 }
    );
  }
} 