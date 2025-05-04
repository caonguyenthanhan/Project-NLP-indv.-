"use client"

import React from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function RecSys() {
  const t = useTranslations("RecSys")

  return (
    <div className="container mx-auto py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Chào mừng đến với Demo Hệ thống Gợi ý</h1>
        <p className="text-xl text-muted-foreground">
          Khám phá các hệ thống gợi ý khác nhau: Lọc cộng tác, Dựa trên nội dung và Dựa trên ngữ cảnh
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {/* Collaborative Filtering Card */}
        <Card className="flex flex-col h-full">
          <CardHeader>
            <CardTitle>Lọc Cộng tác (Collaborative Filtering)</CardTitle>
            <CardDescription className="text-lg font-semibold text-primary">
              Gợi ý phim dựa trên đánh giá của bạn và người dùng khác
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <p className="text-sm text-muted-foreground mb-4">
              Nhận gợi ý phim dựa trên đánh giá của bạn và những người dùng khác.
            </p>
            <div className="mt-auto">
              <Link href="/RecSys/collaborative" className="w-full">
                <Button className="w-full">
                  Thử ngay
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Content-Based Card */}
        <Card className="flex flex-col h-full">
          <CardHeader>
            <CardTitle>Gợi ý Dựa trên Nội dung</CardTitle>
            <CardDescription className="text-lg font-semibold text-primary">
              Mô tả ý tưởng phim để nhận gợi ý
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <p className="text-sm text-muted-foreground mb-4">
              Mô tả ý tưởng phim của bạn để dự đoán đánh giá và nhận tư vấn.
            </p>
            <div className="mt-auto">
              <Link href="/RecSys/content-based" className="w-full">
                <Button className="w-full">
                  Thử ngay
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Context-Aware Card */}
        <Card className="flex flex-col h-full">
          <CardHeader>
            <CardTitle>Gợi ý Dựa trên Ngữ cảnh</CardTitle>
            <CardDescription className="text-lg font-semibold text-primary">
              Gợi ý phù hợp với tình huống hiện tại
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <p className="text-sm text-muted-foreground mb-4">
              Nhận gợi ý (Du lịch, Phim, Nhạc, Món ăn) phù hợp với tình huống hiện tại của bạn.
            </p>
            <div className="mt-auto">
              <Link href="/RecSys/context-aware" className="w-full">
                <Button className="w-full">
                  Thử ngay
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 