"use client"

import { useTranslations } from "next-intl"

export default function RecSys() {
  const t = useTranslations("RecSys")

  return (
    <div className="container mx-auto py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>
    </div>
  )
} 