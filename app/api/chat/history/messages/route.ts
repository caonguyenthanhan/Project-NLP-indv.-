import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

const CHAT_HISTORY_FILE = path.join(process.cwd(), 'server', 'data', 'chat_history.csv');

interface ChatMessage {
  chat_name: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

function readChatHistory(): ChatMessage[] {
  try {
    if (!fs.existsSync(CHAT_HISTORY_FILE)) {
      return [];
    }

    const fileContent = fs.readFileSync(CHAT_HISTORY_FILE, 'utf-8');
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true
    });

    return records as ChatMessage[];
  } catch (error) {
    console.error('Error reading chat history:', error);
    return [];
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const chatName = searchParams.get('chat_name');

    if (!chatName) {
      return NextResponse.json(
        { error: 'Chat name is required' },
        { status: 400 }
      );
    }

    const history = readChatHistory();
    const chatMessages = history
      .filter(msg => msg.chat_name === chatName)
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }));

    return NextResponse.json({ messages: chatMessages });
  } catch (error) {
    console.error('Error getting chat messages:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve chat messages' },
      { status: 500 }
    );
  }
} 