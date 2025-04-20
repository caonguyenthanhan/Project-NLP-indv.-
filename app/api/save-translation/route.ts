import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { locale, messages } = await request.json();

    if (!locale || !messages) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Create messages directory if it doesn't exist
    const messagesDir = path.join(process.cwd(), 'messages');
    await fs.mkdir(messagesDir, { recursive: true });

    // Save translated messages to a new file
    const filePath = path.join(messagesDir, `${locale}.json`);
    await fs.writeFile(filePath, JSON.stringify(messages, null, 2));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Save translation error:', error);
    return NextResponse.json(
      { error: 'Failed to save translation' },
      { status: 500 }
    );
  }
} 