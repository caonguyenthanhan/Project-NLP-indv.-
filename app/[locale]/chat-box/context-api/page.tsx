"use client"

import React, { useState, useRef, useEffect } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import { Plus, Save, Trash2, Loader2, Send } from "lucide-react"
import Link from "next/link"

interface Message {
  role: "user" | "assistant" | "system"
  content: string
}

interface ChatHistory {
  chat_name: string
  messages: Message[]
}

export default function ContextAPIChatBox() {
  const t = useTranslations("chatBox")
  const { theme } = useTheme()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [chatName, setChatName] = useState("Default Chat")
  const [availableChats, setAvailableChats] = useState<string[]>([])
  const [isEditingName, setIsEditingName] = useState(false)
  const [editedName, setEditedName] = useState("")
  const [sessionId, setSessionId] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Tạo sessionId mới khi component mount
    setSessionId(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
    fetchAvailableChats()
  }, [])

  useEffect(() => {
    if (chatName) {
      fetchChatHistory(chatName)
    }
  }, [chatName])

  const fetchAvailableChats = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/chat/history")
      const data = await response.json()
      setAvailableChats(data.chat_names || [])
    } catch (error) {
      console.error("Error fetching available chats:", error)
    }
  }

  const fetchChatHistory = async (selectedChatName: string) => {
    try {
      const response = await fetch(`http://localhost:3000/api/chat/history/messages?chat_name=${encodeURIComponent(selectedChatName)}`)
      const data = await response.json()
      setMessages(data.messages || [])
    } catch (error) {
      console.error("Error fetching chat history:", error)
    }
  }

  const createNewChat = async () => {
    try {
      const timestamp = new Date().toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
      const newChatName = `Context API Chat ${timestamp}`;

      const welcomeMessage = { role: "system" as const, content: t("welcomeMessage") };
      setMessages([welcomeMessage]);

      await fetch("http://localhost:3000/api/chat/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_name: newChatName,
          role: "system",
          content: t("welcomeMessage")
        })
      })

      setChatName(newChatName)
      await fetchAvailableChats()
    } catch (error) {
      console.error("Error creating new chat:", error)
    }
  }

  const updateChatName = async () => {
    if (!editedName.trim() || editedName === chatName) {
      setIsEditingName(false)
      return
    }

    try {
      const response = await fetch(`http://localhost:3000/api/chat/history?chat_name=${encodeURIComponent(chatName)}`)
      const data = await response.json()
      
      await fetch(`http://localhost:3000/api/chat/history?chat_name=${encodeURIComponent(chatName)}`, {
        method: "DELETE"
      })

      for (const record of data.history) {
        await fetch("http://localhost:3000/api/chat/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...record,
            chat_name: editedName
          })
        })
      }

      setChatName(editedName)
      await fetchAvailableChats()
      setIsEditingName(false)
    } catch (error) {
      console.error("Error updating chat name:", error)
    }
  }

  const deleteChat = async (chatNameToDelete: string) => {
    try {
      await fetch(`http://localhost:3000/api/chat/history?chat_name=${encodeURIComponent(chatNameToDelete)}`, {
        method: "DELETE"
      })
      await fetchAvailableChats()
      if (chatName === chatNameToDelete) {
        setChatName("Default Chat")
      }
    } catch (error) {
      console.error("Error deleting chat:", error)
    }
  }

  const sendMessageToChatbot = async (message: string) => {
    try {
      const response = await fetch("http://localhost:8000/api/chat/context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: message
            }
          ],
          chat_name: chatName
        })
      });

      if (!response.ok) throw new Error("Failed to get response from chatbot");

      const data = await response.json();
      return data.message;
    } catch (error) {
      console.error("Error sending message to chatbot:", error);
      throw error;
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = { role: "user" as const, content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      if (!chatName || chatName === "Default Chat") {
        const timestamp = new Date().toLocaleString('vi-VN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
        const newChatName = `Context API Chat ${timestamp}`;

        const welcomeMessage = { role: "system" as const, content: t("welcomeMessage") };
        setMessages([welcomeMessage, userMessage]);

        // Lưu tin nhắn chào mừng
        await fetch("http://localhost:3000/api/chat/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_name: newChatName,
            role: "system",
            content: t("welcomeMessage")
          })
        });

        setChatName(newChatName);
        await fetchAvailableChats();
      }

      // Gọi API chatbot
      const botResponse = await sendMessageToChatbot(input);
      const assistantMessage = { role: "assistant" as const, content: botResponse };
      setMessages(prev => [...prev, assistantMessage]);

      // Lưu tin nhắn người dùng
      await fetch("http://localhost:3000/api/chat/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_name: chatName,
          role: "user",
          content: input
        })
      });

      // Lưu phản hồi của bot
      await fetch("http://localhost:3000/api/chat/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_name: chatName,
          role: "assistant",
          content: botResponse
        })
      });

    } catch (error) {
      console.error("Error in handleSubmit:", error);
      // Hiển thị thông báo lỗi cho người dùng
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: t("errorMessage") 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-3xl mx-auto">
      <div className="flex-none p-4">
        {/* Navigation Bar */}
        <div className="flex items-center justify-center gap-4 mb-4">
          <Link 
            href="/chat-box/context-api"
            className={cn(
              "px-4 py-2 rounded-md transition-colors",
              "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            Context API
          </Link>
          <Link 
            href="/chat-box/fine-tuned"
            className="px-4 py-2 rounded-md bg-primary/10 hover:bg-primary/20 transition-colors"
          >
            Fine-tuned
          </Link>
          <Link 
            href="/chat-box/general-api"
            className="px-4 py-2 rounded-md bg-primary/10 hover:bg-primary/20 transition-colors"
          >
            General API
          </Link>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 flex-1 mr-2">
            {isEditingName ? (
              <div className="flex gap-2 flex-1">
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="p-2 border-2 rounded-md flex-1 bg-transparent dark:border-gray-600 text-foreground dark:text-foreground"
                  placeholder={t("enterNewName")}
                  autoFocus
                />
                <Button
                  onClick={updateChatName}
                  variant="outline"
                  className="text-primary hover:text-primary-foreground hover:bg-primary"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {t("save")}
                </Button>
                <Button
                  onClick={() => setIsEditingName(false)}
                  variant="outline"
                  className="text-muted-foreground hover:text-muted-foreground/80"
                >
                  {t("cancel")}
                </Button>
              </div>
            ) : (
              <>
                <select
                  value={chatName}
                  onChange={(e) => setChatName(e.target.value)}
                  className="p-2 border-2 rounded-md flex-1 bg-transparent dark:border-gray-600 text-foreground dark:text-foreground"
                >
                  {availableChats.map((chat) => (
                    <option key={chat} value={chat}>{chat}</option>
                  ))}
                </select>
                {chatName !== "Default Chat" && (
                  <Button
                    onClick={() => {
                      setEditedName(chatName)
                      setIsEditingName(true)
                    }}
                    variant="ghost"
                    size="icon"
                  >
                    ✏️
                  </Button>
                )}
              </>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={createNewChat}
              variant="outline"
              className="text-primary hover:text-primary-foreground hover:bg-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t("newChat")}
            </Button>
            {chatName !== "Default Chat" && (
              <Button
                onClick={() => deleteChat(chatName)}
                variant="outline"
                className="text-destructive hover:text-destructive-foreground hover:bg-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {t("deleteChat")}
              </Button>
            )}
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 px-4 mb-24">
        <div className="border-2 rounded-md p-4 dark:border-gray-600">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400">{t("startConversation")}</div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "mb-4 p-3 rounded-lg flex border dark:border-gray-700",
                  message.role === "user"
                    ? "ml-auto max-w-[80%] flex-row-reverse"
                    : "mr-auto max-w-[80%]"
                )}
              >
                {message.role !== "user" && (
                  <div className="w-1 bg-primary rounded-full mr-3 self-stretch" />
                )}
                <div className="whitespace-pre-wrap text-foreground">{message.content}</div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="text-center text-gray-500 dark:text-gray-400">
              <div className="animate-pulse">{t("messages.loading")}</div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="fixed bottom-0 left-0 right-0 bg-background dark:bg-background border-t-2 dark:border-gray-600">
        <div className="max-w-3xl mx-auto p-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("inputPlaceholder")}
              className="flex-1 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            />
            <Button
              type="submit"
              disabled={isLoading}
              variant="outline"
              className="text-primary hover:text-primary-foreground hover:bg-primary"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
} 