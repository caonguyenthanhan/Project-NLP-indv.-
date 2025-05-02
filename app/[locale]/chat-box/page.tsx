"use client"

import React from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import styles from "./styles.module.css"

export default function ChatBoxPage() {
  const t = useTranslations("chatBox")

  return (
    <div className="container mx-auto py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">{t("title")}</h1>
        <p className="text-xl text-muted-foreground">{t("description")}</p>
      </div>

      <div className={`grid grid-cols-1 gap-6 max-w-7xl mx-auto ${styles.cardGrid}`}>
        {/* Domain Based API Card */}
        <Card className="flex flex-col h-full">
          <CardHeader>
            <CardTitle>{t("domainBasedApi.title")}</CardTitle>
            <CardDescription className="text-lg font-semibold text-primary">
              {t("domainBasedApi.subtitle")}
            </CardDescription>
            <p className="text-sm text-muted-foreground mt-2">
              {t("domainBasedApi.description")}
            </p>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li>{t("domainBasedApi.features.1")}</li>
              <li>{t("domainBasedApi.features.2")}</li>
              <li>{t("domainBasedApi.features.3")}</li>
            </ul>
            <div className="mt-auto">
              <Link href="/chat-box/domain-based-api" className="w-full">
                <Button className="w-full">
                  {t("tryNow")}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Fine-tuned Card */}
        <Card className="flex flex-col h-full">
          <CardHeader>
            <CardTitle>{t("fineTuned.title")}</CardTitle>
            <CardDescription className="text-lg font-semibold text-primary">
              {t("fineTuned.subtitle")}
            </CardDescription>
            <p className="text-sm text-muted-foreground mt-2">
              {t("fineTuned.description")}
            </p>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li>{t("fineTuned.features.1")}</li>
              <li>{t("fineTuned.features.2")}</li>
              <li>{t("fineTuned.features.3")}</li>
            </ul>
            <div className="mt-auto">
              <Link href="/chat-box/fine-tuned" className="w-full">
                <Button className="w-full">
                  {t("tryNow")}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* General API Card */}
        <Card className="flex flex-col h-full">
          <CardHeader>
            <CardTitle>{t("generalApi.title")}</CardTitle>
            <CardDescription className="text-lg font-semibold text-primary">
              {t("generalApi.subtitle")}
            </CardDescription>
            <p className="text-sm text-muted-foreground mt-2">
              {t("generalApi.description")}
            </p>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li>{t("generalApi.features.1")}</li>
              <li>{t("generalApi.features.2")}</li>
              <li>{t("generalApi.features.3")}</li>
            </ul>
            <div className="mt-auto">
              <Link href="/chat-box/general-api" className="w-full">
                <Button className="w-full">
                  {t("tryNow")}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 