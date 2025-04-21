import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { messages, chat_name } = await req.json();

    const apiKey = process.env.AIMLAPI_KEY;
    if (!apiKey) {
      throw new Error('AIMLAPI key is not configured');
    }

    const response = await fetch('https://api.aimlapi.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })),
      temperature: 0.7,
      max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('AIMLAPI Error Response:', errorData);
      throw new Error('Failed to get response from AI');
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // Save the conversation to history
    const lastUserMessage = messages[messages.length - 1];
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    await fetch(`${baseUrl}/api/chat/history`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_name: chat_name || 'Default Chat',
        role: 'user',
        content: lastUserMessage.content
      })
    });

    await fetch(`${baseUrl}/api/chat/history`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_name: chat_name || 'Default Chat',
        role: 'assistant',
        content: aiResponse
      })
    });

    return NextResponse.json({
      message: aiResponse,
      role: 'assistant'
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process chat request' },
      { status: 500 }
    );
  }
} 