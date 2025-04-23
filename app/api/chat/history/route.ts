import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';

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
      const dir = path.dirname(CHAT_HISTORY_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(CHAT_HISTORY_FILE, 'chat_name,role,content,timestamp\n');
      return [];
    }

    const fileContent = fs.readFileSync(CHAT_HISTORY_FILE, 'utf-8');
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      quote: '"',
      escape: '\\',
      relax_column_count: true,
      trim: true
    });

    return records as ChatMessage[];
  } catch (error) {
    console.error('Error reading chat history:', error);
    return [];
  }
}

function writeChatHistory(messages: ChatMessage[]) {
  try {
    const csvContent = stringify(messages, {
      header: true,
      columns: ['chat_name', 'role', 'content', 'timestamp'],
      quote: true,
      escape: '\\',
      quoted: true,
      quoted_empty: true
    });
    fs.writeFileSync(CHAT_HISTORY_FILE, csvContent);
  } catch (error) {
    console.error('Error writing chat history:', error);
    throw error;
  }
}

export async function GET() {
  try {
    const history = readChatHistory();
    // Lấy danh sách các cuộc trò chuyện duy nhất
    const chatNames = [...new Set(history.map(msg => msg.chat_name))];
    return NextResponse.json({ chat_names: chatNames });
  } catch (error) {
    console.error('Error getting chat history:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve chat history' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { chat_name, role, content } = body;

    if (!chat_name || !role || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const newMessage: ChatMessage = {
      chat_name,
      role,
      content,
      timestamp: new Date().toISOString()
    };

    const history = readChatHistory();
    history.push(newMessage);
    writeChatHistory(history);

    return NextResponse.json({ message: 'Message added successfully' });
  } catch (error) {
    console.error('Error processing chat message:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const chatName = searchParams.get('chat_name');

    if (!chatName) {
      return NextResponse.json(
        { error: 'Chat name is required' },
        { status: 400 }
      );
    }

    const records = readChatHistory();
    const filteredRecords = records.filter(record => record.chat_name !== chatName);
    writeChatHistory(filteredRecords);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting chat history:', error);
    return NextResponse.json(
      { error: 'Failed to delete chat history' },
      { status: 500 }
    );
  }
} 