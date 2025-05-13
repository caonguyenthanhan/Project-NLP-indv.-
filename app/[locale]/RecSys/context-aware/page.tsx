"use client"

import React, { useState, useEffect, useRef, KeyboardEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Loader2, Send } from "lucide-react"
import { motion } from "framer-motion"
import { ScrollArea } from "@/components/ui/scroll-area"
import Head from 'next/head'

// --- Types ---
type MessageSender = 'bot' | 'user'

interface Message {
  id: number
  text: string | React.ReactNode
  sender: MessageSender
  options?: { label: string; value: string }[]
  requiresTextInput?: boolean
}

interface Context {
  recommendationType?: string
  mood?: string
  timeOfDay?: string
  location?: string
  companionship?: string
}

interface RecommendationItem {
  name: string
  description?: string
  type?: string
  suitability?: string
  rating?: number
  image_url?: string
  link?: string
}

// --- Dynamic Question Templates ---
const subjectMap: Record<string, { label: string; verb: string; noun: string }> = {
  music: { label: 'nhạc', verb: 'nghe', noun: 'bản nhạc' },
  movie: { label: 'phim', verb: 'xem', noun: 'bộ phim' },
  food: { label: 'món ăn', verb: 'thưởng thức', noun: 'món ăn' },
  travel: { label: 'du lịch', verb: 'đi', noun: 'địa điểm' },
};

function getDynamicQuestion(step: number, ctx: Context): string {
  const subject = ctx.recommendationType && subjectMap[ctx.recommendationType] ? subjectMap[ctx.recommendationType] : subjectMap['movie'];
  switch (step) {
    case 0:
      return 'Chào bạn! Bạn muốn tôi gợi ý về chủ đề gì hôm nay?';
    case 1:
      return `Bạn muốn ${subject.verb} ${subject.label} với tâm trạng thế nào?`;
    case 2:
      return `Bạn dự định ${subject.verb} ${subject.label} một mình hay cùng ai?`;
    case 3:
      return `Bạn đang ở đâu hoặc khu vực bạn muốn ${subject.verb} ${subject.label}? (Ví dụ: Thành thị, Nông thôn, Vùng núi, ...)`;
    case 4:
      return `Bạn muốn ${subject.verb} ${subject.label} vào thời điểm nào trong ngày?`;
    default:
      return '';
  }
}

// --- Conversation Flow Configuration ---
interface StepConfig {
  id: number
  contextKey: keyof Context
  options?: { label: string; value: string }[]
  requiresTextInput?: boolean
}

const conversationFlow: StepConfig[] = [
  {
    id: 0,
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
    contextKey: "location",
    options: [
      { label: "🏙️ Thành thị", value: "thanh_thi" },
      { label: "🌾 Nông thôn", value: "nong_thon" },
      { label: "⛰️ Vùng núi", value: "vung_nui" },
      { label: "🏝️ Vùng biển", value: "vung_bien" },
      { label: "🌳 Vùng ven đô", value: "ven_do" }
    ]
  },
  {
    id: 4,
    contextKey: "timeOfDay",
    options: [
      { label: "Sáng", value: "morning" },
      { label: "Chiều", value: "afternoon" },
      { label: "Tối", value: "evening" },
      { label: "Đêm khuya", value: "night" }
    ]
  }
]

const ContextAwarePage: React.FC = () => {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [currentContext, setCurrentContext] = useState<Context>({})
  const [currentStep, setCurrentStep] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [userTextInput, setUserTextInput] = useState<string>('')
  const chatEndRef = useRef<HTMLDivElement>(null)
  const [statusMessage, setStatusMessage] = useState<string>("")

  useEffect(() => {
    if (messages.length === 0) {
      console.log('[Chatbot] Bắt đầu hội thoại context-aware');
      const firstStep = conversationFlow[0]
      addBotMessage(getDynamicQuestion(0, {}), firstStep.options)
    }
  }, [messages.length])

  const addMessage = (text: string | React.ReactNode, sender: MessageSender, options?: { label: string; value: string }[], requiresTextInput?: boolean) => {
    setMessages(prev => [...prev, { id: Date.now() + Math.random(), text, sender, options, requiresTextInput }])
  }

  const addBotMessage = (text: string | React.ReactNode, options?: { label: string; value: string }[], requiresTextInput?: boolean) => {
    addMessage(text, 'bot', options, requiresTextInput)
  }

  const addUserMessage = (text: string) => {
    addMessage(text, 'user')
  }

  const handleUserResponse = (value: string, label?: string) => {
    console.log(`[Chatbot] User chọn: ${label || value} (step ${currentStep})`);
    const stepConfig = conversationFlow[currentStep]
    addUserMessage(label || value)
    const updatedContext = { ...currentContext, [stepConfig.contextKey]: value }
    setCurrentContext(updatedContext)
    const nextStepIndex = currentStep + 1

    if (stepConfig.requiresTextInput) {
      setUserTextInput('')
    }

    if (nextStepIndex >= conversationFlow.length) {
      setCurrentStep(nextStepIndex)
      const currentTimeOfDay = getCurrentTimeOfDay()
      const finalContext = { ...updatedContext, timeOfDay: currentTimeOfDay }
      setCurrentContext(finalContext)
      console.log('[Chatbot] Đã thu thập đủ context, gửi request:', finalContext)
      fetchRecommendations(finalContext)
    } else {
      setCurrentStep(nextStepIndex)
      const nextStepConfig = conversationFlow[nextStepIndex]
      setTimeout(() => {
        addBotMessage(getDynamicQuestion(nextStepIndex, updatedContext), nextStepConfig.options, nextStepConfig.requiresTextInput)
      }, 500)
    }
  }

  const handleTextInputSubmit = () => {
    if (!userTextInput.trim()) return
    handleUserResponse(userTextInput.trim())
  }

  const handleKeyPress = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !isLoading) {
      handleTextInputSubmit()
    }
  }

  const getCurrentTimeOfDay = (): string => {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 12) return 'morning'
    if (hour >= 12 && hour < 17) return 'afternoon'
    if (hour >= 17 && hour < 21) return 'evening'
    return 'night'
  }

  const fetchRecommendations = async (context: Context) => {
    setIsLoading(true)
    setError(null)
    setStatusMessage("Đang gửi yêu cầu tới hệ thống...")
    addBotMessage("Ok, để tôi xem nào... 🤔")
    console.log("[Frontend] Sending context to backend:", context)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout
    try {
      const response = await fetch('http://localhost:8000/recommend/context-aware', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(context),
        signal: controller.signal,
      })
      if (!response.ok) {
        const errorData = await response.text()
        console.error(`[Frontend] Backend error (${response.status}):`, errorData)
        setStatusMessage("Có lỗi khi kết nối hệ thống!")
        throw new Error(`Server error (${response.status}): ${errorData || 'Could not get recommendations'}`)
      }
      const data: RecommendationItem[] = await response.json()
      console.log("[Frontend] Received recommendations:", data)
      setStatusMessage("Đã nhận phản hồi từ hệ thống!")
      
      if (Array.isArray(data) && data.length > 0) {
        const recommendationText: React.ReactNode = (
          <div className="space-y-4">
            <p>Dựa trên những gì bạn chia sẻ, đây là một vài gợi ý:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.map((item, index) => {
                const CardContent = (
                  <div className="bg-white dark:bg-gray-700 rounded-lg shadow p-4 transition hover:shadow-lg cursor-pointer">
                    {item.image_url && (
                      <img 
                        src={item.image_url} 
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
                    {item.rating !== undefined && (
                      <div className="flex items-center mt-2">
                        {(() => {
                          let rating = Number(item.rating);
                          if (isNaN(rating) || rating < 0) rating = 0;
                          if (rating > 10) rating = 10;
                          const ratingIn5Scale = rating / 2;
                          const clampedRating = Math.min(Math.max(Math.round(ratingIn5Scale), 0), 5);
                          const emptyStars = Math.max(5 - clampedRating, 0);
                          return (
                            <>
                              <span className="text-yellow-400">{'★'.repeat(clampedRating)}</span>
                              <span className="text-gray-300">{'★'.repeat(emptyStars)}</span>
                              <span className="text-sm ml-1">({rating.toFixed(1)})</span>
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                );
                return item.link ? (
                  <a
                    key={index}
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block hover:no-underline"
                  >
                    {CardContent}
                  </a>
                ) : (
                  <div key={index}>{CardContent}</div>
                );
              })}
            </div>
          </div>
        )
        addBotMessage(recommendationText)
      } else {
        console.warn('[Frontend] Không tìm thấy gợi ý phù hợp với context:', context)
        addBotMessage(
          <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900 rounded-lg">
            <p className="text-yellow-800 dark:text-yellow-200">
              ❗ Không tìm thấy gợi ý phù hợp với lựa chọn của bạn.
            </p>
            <p className="text-sm text-yellow-600 dark:text-yellow-300 mt-2">
              Vui lòng thử lại với lựa chọn khác hoặc liên hệ hỗ trợ nếu cần!
            </p>
          </div>
        )
      }
    } catch (err: any) {
      clearTimeout(timeoutId)
      setError(err.message.includes('abort') ? 'Yêu cầu timeout, vui lòng thử lại!' : err.message)
      setStatusMessage("Có lỗi khi kết nối hệ thống!")
      console.error('[Frontend] Lỗi khi gửi request hoặc nhận response:', err)
      addBotMessage(`Rất tiếc, đã có lỗi xảy ra: ${err.message} 😥`)
    } finally {
      clearTimeout(timeoutId)
      setIsLoading(false)
      setTimeout(() => setStatusMessage(""), 3000)
    }
  }

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const isWaitingForTextInput = messages[messages.length - 1]?.sender === 'bot' && 
                               messages[messages.length - 1]?.requiresTextInput && 
                               currentStep < conversationFlow.length

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
                  <p className="text-sm italic">Đang suy nghĩ... (Đang gửi yêu cầu tới hệ thống)</p>
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

        {/* Trạng thái giao tiếp backend */}
        {statusMessage && (
          <div className="text-center text-xs text-blue-600 dark:text-blue-300 mb-2 animate-pulse">{statusMessage}</div>
        )}
      </div>
    </>
  )
}

export default ContextAwarePage 