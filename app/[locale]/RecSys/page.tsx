"use client"

import React from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function RecSysPage() {
  const t = useTranslations("RecSys")

  return (
    <div className="container mx-auto py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">{t("title")}</h1>
        <p className="text-xl text-muted-foreground">{t("description")}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {/* Collaborative Filtering Card */}
        <Card className="flex flex-col h-full">
          <CardHeader>
            <CardTitle>{t("collaborative.title")}</CardTitle>
            <CardDescription className="text-lg font-semibold text-primary">
              {t("description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <p className="text-sm text-muted-foreground mb-4">
              {t("collaborative.description")}
            </p>
            <div className="mt-auto">
              <Link href="/RecSys/collaborative" className="w-full">
                <Button className="w-full">
                  {t("tryNow")}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Content-based Card */}
        <Card className="flex flex-col h-full">
          <CardHeader>
            <CardTitle>{t("contentBased.title")}</CardTitle>
            <CardDescription className="text-lg font-semibold text-primary">
              {t("contentBased.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <p className="text-sm text-muted-foreground mb-4">
              {t("contentBased.description")}
            </p>
            <div className="mt-auto">
              <Link href="/RecSys/content-based" className="w-full">
                <Button className="w-full">
                  {t("tryNow")}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Context-aware Card */}
        <Card className="flex flex-col h-full">
          <CardHeader>
            <CardTitle>{t("contextAware.title")}</CardTitle>
            <CardDescription className="text-lg font-semibold text-primary">
              {t("contextAware.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <p className="text-sm text-muted-foreground mb-4">
              {t("contextAware.description")}
            </p>
            <div className="mt-auto">
              <Link href="/RecSys/context-aware" className="w-full">
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