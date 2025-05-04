'use client';

import React, { useState, useEffect, useRef, KeyboardEvent } from 'react';
import Head from 'next/head';

// --- Types ---
type MessageSender = 'bot' | 'user';

interface Message {
  id: number;
  text: string | React.ReactNode;
  sender: MessageSender;
  options?: { label: string; value: string }[];
  requiresTextInput?: boolean;
}

interface Context {
  recommendationType?: string;
  mood?: string;
  timeOfDay?: string;
  location?: string;
  companionship?: string;
}

interface RecommendationItem {
  name: string;
  description?: string;
  type?: string;
  suitability?: string;
  rating?: number;
  imageUrl?: string;
}

// --- Conversation Flow Configuration ---
interface StepConfig {
  id: number;
  question: string;
  contextKey: keyof Context;
  options?: { label: string; value: string }[];
  requiresTextInput?: boolean;
}

const conversationFlow: StepConfig[] = [
  {
    id: 0,
    question: "Chào bạn! Bạn muốn tôi gợi ý về chủ đề gì hôm nay?",
    contextKey: "recommendationType",
    options: [
      { label: "🗺️ Du lịch", value: "travel" },
      { label: "🎬 Phim", value: "movie" },
      { label: "🎵 Nhạc", value: "music" },
      { label: "🍜 Món ăn", value: "food" },
    ],
  },
  {
    id: 1,
    question: "Bạn đang có tâm trạng hay muốn làm gì?",
    contextKey: "mood",
    options: [
      { label: "😌 Thư giãn", value: "relaxing" },
      { label: "🎉 Vui vẻ", value: "fun" },
      { label: "🤔 Học hỏi", value: "learning" },
      { label: "🥳 Ăn mừng", value: "celebrating" },
      { label: "💖 Lãng mạn", value: "romantic" },
    ],
  },
  {
    id: 2,
    question: "Bạn dự định đi/xem/nghe/ăn một mình hay cùng ai?",
    contextKey: "companionship",
    options: [
      { label: "👤 Một mình", value: "alone" },
      { label: "💑 Cặp đôi", value: "couple" },
      { label: "👨‍👩‍👧‍👦 Gia đình", value: "family" },
      { label: "🧑‍🤝‍🧑 Nhóm bạn", value: "friends" },
    ],
  },
  {
    id: 3,
    question: "Bạn đang ở đâu hoặc khu vực bạn quan tâm là gì? (Ví dụ: Quận 1, Đà Lạt...)",
    contextKey: "location",
    requiresTextInput: true,
  },
  { id: 4, question: "", contextKey: "timeOfDay" }
];

const ContextAwarePage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentContext, setCurrentContext] = useState<Context>({});
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [userTextInput, setUserTextInput] = useState<string>('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length === 0) {
      const firstStep = conversationFlow[0];
      addBotMessage(firstStep.question, firstStep.options);
    }
  }, [messages.length]);

  const addMessage = (text: string | React.ReactNode, sender: MessageSender, options?: { label: string; value: string }[], requiresTextInput?: boolean) => {
    setMessages(prev => [...prev, { id: Date.now() + Math.random(), text, sender, options, requiresTextInput }]);
  };

  const addBotMessage = (text: string | React.ReactNode, options?: { label: string; value: string }[], requiresTextInput?: boolean) => {
    addMessage(text, 'bot', options, requiresTextInput);
  };

  const addUserMessage = (text: string) => {
    addMessage(text, 'user');
  };

  const handleUserResponse = (value: string, label?: string) => {
    const stepConfig = conversationFlow[currentStep];
    addUserMessage(label || value);
    setCurrentContext(prev => ({ ...prev, [stepConfig.contextKey]: value }));
    const nextStepIndex = currentStep + 1;

    if (stepConfig.requiresTextInput) {
      setUserTextInput('');
    }

    if (nextStepIndex < conversationFlow.length) {
      setCurrentStep(nextStepIndex);
      const nextStepConfig = conversationFlow[nextStepIndex];
      setTimeout(() => {
        addBotMessage(nextStepConfig.question, nextStepConfig.options, nextStepConfig.requiresTextInput);
      }, 500);
    } else {
      setCurrentStep(nextStepIndex);
      const currentTimeOfDay = getCurrentTimeOfDay();
      const finalContext = { ...currentContext, [stepConfig.contextKey]: value, timeOfDay: currentTimeOfDay };
      setCurrentContext(finalContext);
      fetchRecommendations(finalContext);
    }
  };

  const handleTextInputSubmit = () => {
    if (!userTextInput.trim()) return;
    handleUserResponse(userTextInput.trim());
  };

  const handleKeyPress = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !isLoading) {
      handleTextInputSubmit();
    }
  };

  const getCurrentTimeOfDay = (): string => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  };

  const fetchRecommendations = async (context: Context) => {
    setIsLoading(true);
    setError(null);
    addBotMessage("Ok, để tôi xem nào... 🤔");
    console.log("Sending context to server:", context);

    try {
      const response = await fetch('http://localhost:8000/recommend/context-aware', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(context),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Server error (${response.status}): ${errorData || 'Could not get recommendations'}`);
      }

      const data: RecommendationItem[] = await response.json();
      console.log("Received recommendations:", data);

      if (data && data.length > 0) {
        const recommendationText: React.ReactNode = (
          <div className="space-y-4">
            <p>Dựa trên những gì bạn chia sẻ, đây là một vài gợi ý:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.map((item, index) => (
                <div key={index} className="bg-white dark:bg-gray-700 rounded-lg shadow p-4">
                  {item.imageUrl && (
                    <img 
                      src={item.imageUrl} 
                      alt={item.name}
                      className="w-full h-48 object-cover rounded-t-lg mb-2"
                    />
                  )}
                  <h3 className="font-bold text-lg">{item.name}</h3>
                  {item.type && (
                    <span className="inline-block bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100 text-xs px-2 py-1 rounded-full mb-2">
                      {item.type}
                    </span>
                  )}
                  {item.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-300">{item.description}</p>
                  )}
                  {item.suitability && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Phù hợp: {item.suitability}
                    </p>
                  )}
                  {item.rating && (
                    <div className="flex items-center mt-2">
                      <span className="text-yellow-400">{'★'.repeat(Math.floor(item.rating))}</span>
                      <span className="text-gray-300">{'★'.repeat(5 - Math.floor(item.rating))}</span>
                      <span className="text-sm ml-1">({item.rating.toFixed(1)})</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
        addBotMessage(recommendationText);
      } else {
        addBotMessage("Rất tiếc, tôi không tìm thấy gợi ý nào phù hợp với yêu cầu của bạn lúc này. 😔");
      }
    } catch (err: any) {
      console.error("Error fetching recommendations:", err);
      setError(err.message);
      addBotMessage(`Rất tiếc, đã có lỗi xảy ra: ${err.message} 😥`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const isWaitingForTextInput = messages[messages.length - 1]?.sender === 'bot' && 
                               messages[messages.length - 1]?.requiresTextInput && 
                               currentStep < conversationFlow.length;

  return (
    <>
      <Head>
        <title>Gợi ý theo Ngữ cảnh | RecSys Demo</title>
        <meta name="description" content="Chatbot gợi ý dựa trên ngữ cảnh của bạn" />
      </Head>

      <div className="container mx-auto p-4 flex flex-col h-[calc(100vh-100px)] max-w-3xl">
        <h1 className="text-2xl font-bold mb-4 text-center">Gợi ý theo Ngữ cảnh (Chatbot)</h1>

        <div className="flex-grow overflow-y-auto border dark:border-gray-700 rounded-lg p-4 mb-4 bg-white dark:bg-gray-800 shadow-inner space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] p-3 rounded-lg shadow ${
                msg.sender === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
              }`}>
                {typeof msg.text === 'string' ? <p className="text-sm break-words">{msg.text}</p> : msg.text}
                
                {msg.sender === 'bot' && msg.options && msg.id === messages[messages.length - 1].id && 
                 currentStep < conversationFlow.length && !isLoading && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {msg.options.map(option => (
                      <button
                        key={option.value}
                        onClick={() => handleUserResponse(option.value, option.label)}
                        disabled={isLoading}
                        className="px-3 py-1 bg-blue-100 dark:bg-blue-600 text-blue-700 dark:text-white 
                                 rounded-full text-xs hover:bg-blue-200 dark:hover:bg-blue-700 disabled:opacity-50"
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[75%] p-3 rounded-lg shadow bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                <div className="flex items-center space-x-2">
                  <div className="animate-bounce">⏳</div>
                  <p className="text-sm italic">Đang suy nghĩ...</p>
                </div>
              </div>
            </div>
          )}
          
          <div ref={chatEndRef} />
        </div>

        {isWaitingForTextInput && !isLoading && (
          <div className="flex gap-2 p-2 border-t dark:border-gray-700">
            <input
              type="text"
              value={userTextInput}
              onChange={(e) => setUserTextInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Nhập câu trả lời của bạn..."
              disabled={isLoading}
              className="flex-grow px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 
                       dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              onClick={handleTextInputSubmit}
              disabled={isLoading || !userTextInput.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              Gửi
            </button>
          </div>
        )}

        {error && (
          <p className="text-red-500 text-sm text-center mt-2">
            {error}
          </p>
        )}
      </div>
    </>
  );
};

export default ContextAwarePage; 