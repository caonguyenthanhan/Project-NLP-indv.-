"use client"

import React, { useState, useRef, useEffect } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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

export default function ChatBoxPage() {
  const t = useTranslations("chatBox")

  return (
    <div className="container mx-auto py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">{t("title")}</h1>
        <p className="text-xl text-muted-foreground">{t("description")}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Context API Card */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>{t("contextApi.title")}</CardTitle>
            <CardDescription>{t("contextApi.description")}</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li>{t("contextApi.features.1")}</li>
              <li>{t("contextApi.features.2")}</li>
              <li>{t("contextApi.features.3")}</li>
            </ul>
            <Link href="/chat-box/context-api" className="w-full">
              <Button className="w-full">
                {t("tryNow")}
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Fine-tuned Card */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>{t("fineTuned.title")}</CardTitle>
            <CardDescription>{t("fineTuned.description")}</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li>{t("fineTuned.features.1")}</li>
              <li>{t("fineTuned.features.2")}</li>
              <li>{t("fineTuned.features.3")}</li>
            </ul>
            <Link href="/chat-box/fine-tuned" className="w-full">
              <Button className="w-full">
                {t("tryNow")}
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* General API Card */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>{t("generalApi.title")}</CardTitle>
            <CardDescription>{t("generalApi.description")}</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li>{t("generalApi.features.1")}</li>
              <li>{t("generalApi.features.2")}</li>
              <li>{t("generalApi.features.3")}</li>
            </ul>
            <Link href="/chat-box/general-api" className="w-full">
              <Button className="w-full">
                {t("tryNow")}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 