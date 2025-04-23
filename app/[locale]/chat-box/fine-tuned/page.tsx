"use client"

import React, { useState, useRef, useEffect } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import { Plus, Save, Trash2, Loader2, Send, Edit } from "lucide-react"
import Link from "next/link"

interface Message {
  role: "user" | "assistant" | "system"
  content: string
  confidence?: number
  category?: string
}

interface ChatHistory {
  chat_name: string
  messages: Message[]
}

export default function FineTunedChatBox() {
  const t = useTranslations("chatBox")
  const { theme } = useTheme()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [chatName, setChatName] = useState<string>("Default Chat")
  const [availableChats, setAvailableChats] = useState<string[]>([])
  const [isEditingChatName, setIsEditingChatName] = useState<boolean>(false)
  const [newChatName, setNewChatName] = useState<string>("")
  const [sessionId, setSessionId] = useState<string>("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    setMessages([])
    setInput("")
    setIsLoading(false)
    setChatName("Default Chat")
    setAvailableChats([])
    setIsEditingChatName(false)
    setNewChatName("")
    setSessionId(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
    fetchAvailableChats()

    // Cleanup function when component unmounts
    return () => {
      setMessages([])
      setInput("")
      setIsLoading(false)
      setChatName("Default Chat")
      setAvailableChats([])
      setIsEditingChatName(false)
      setNewChatName("")
    }
  }, [])

  useEffect(() => {
    if (chatName) {
      fetchChatHistory(chatName)
    }
  }, [chatName])

  useEffect(() => {
    console.log("Current available chats:", availableChats)
  }, [availableChats])

  const fetchAvailableChats = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/chat/history")
      const data = await response.json()
      console.log("API Response:", data)
      console.log("Chat names from API:", data.chat_names)
      setAvailableChats(data.chat_names || [])
      console.log("Available chats after setting:", availableChats)
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
      const newChatName = `Fine-tuned Chat ${timestamp}`;

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
    if (!newChatName.trim() || newChatName === chatName) {
      setIsEditingChatName(false)
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
            chat_name: newChatName
          })
        })
      }

      setChatName(newChatName)
      await fetchAvailableChats()
      setIsEditingChatName(false)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev: Message[]) => [...prev, userMessage]);
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
        const newChatName = `Fine-tuned Chat ${timestamp}`;
        setChatName(newChatName);
      }

      const response = await fetch("http://localhost:8000/api/chat/fine-tuned", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          sessionId: sessionId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage: Message = {
        role: "assistant",
        content: data.response,
        confidence: data.confidence,
        category: data.category
      };

      setMessages((prev: Message[]) => [...prev, assistantMessage]);

      // Save both messages to chat history
      await fetch("http://localhost:8000/api/chat/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_name: chatName,
          messages: [
            { role: "user", content: input },
            { role: "assistant", content: data.response, confidence: data.confidence, category: data.category }
          ]
        })
      });

    } catch (error) {
      console.error("Error:", error);
      const errorMessage: Message = {
        role: "assistant",
        content: t("errorMessage")
      };
      setMessages((prev: Message[]) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-5xl mx-auto px-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          {isEditingChatName ? (
            <>
              <Input
                value={newChatName}
                onChange={(e) => setNewChatName(e.target.value)}
                className="w-64"
              />
              <Button onClick={updateChatName} size="icon" variant="ghost">
                <Save className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold">{chatName}</h2>
              <Button
                onClick={() => {
                  setIsEditingChatName(true);
                  setNewChatName(chatName);
                }}
                size="icon"
                variant="ghost"
              >
                <Edit className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
        <Button onClick={createNewChat}>
          <Plus className="h-4 w-4 mr-2" />
          {t("newChat")}
        </Button>
      </div>

      <div className="flex flex-1 gap-4">
        <Card className="w-64 p-4">
          <ScrollArea className="h-[calc(100vh-12rem)]">
            <div className="space-y-2">
              {availableChats.map((chat, index) => (
                <div key={index} className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    className="w-full justify-start truncate"
                    onClick={() => setChatName(chat)}
                  >
                    {chat}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => deleteChat(chat)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>

        <Card className="flex-1 p-4">
          <ScrollArea className="h-[calc(100vh-16rem)]">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex w-max max-w-[80%] flex-col gap-2 rounded-lg px-3 py-2 text-sm",
                    message.role === "user"
                      ? "ml-auto bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  {message.content}
                  {message.confidence && (
                    <div className="text-xs opacity-50">
                      {t("confidence")}: {(message.confidence * 100).toFixed(2)}%
                    </div>
                  )}
                  {message.category && (
                    <div className="text-xs opacity-50">
                      {t("category")}: {message.category}
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{t("thinking")}</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <form onSubmit={handleSubmit} className="mt-4">
            <div className="flex gap-4">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t("typeMessage")}
                disabled={isLoading}
              />
              <Button type="submit" disabled={isLoading}>
                <Send className="h-4 w-4 mr-2" />
                {t("send")}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
} 