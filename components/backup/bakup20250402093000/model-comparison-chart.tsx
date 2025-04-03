"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useTranslations } from "next-intl"
import { AlertCircle } from "lucide-react"

export default function ModelComparisonChart() {
  const t = useTranslations("textClassification")
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    // Reset states when component mounts
    setImageLoaded(false)
    setImageError(false)
  }, [])

  const handleImageLoad = () => {
    setImageLoaded(true)
    setImageError(false)
  }

  const handleImageError = () => {
    setImageLoaded(false)
    setImageError(true)
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{t("modelComparisonChart")}</CardTitle>
        <CardDescription>{t("modelComparisonDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        {imageError ? (
          <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-md flex items-start">
            <AlertCircle className="h-5 w-5 text-destructive mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-destructive">{t("errorLoadingChart")}</p>
              <p className="text-sm mt-1">
                Không thể tải biểu đồ so sánh mô hình. Vui lòng kiểm tra kết nối đến máy chủ.
              </p>
            </div>
          </div>
        ) : (
          <div className="w-full border rounded-md overflow-hidden p-2">
            {!imageLoaded && (
              <div className="flex justify-center items-center h-[300px] bg-muted/30">
                <div className="animate-pulse text-muted-foreground">Đang tải biểu đồ...</div>
              </div>
            )}
            <img
              src="http://localhost:8000/models/model_comparison.png"
              alt="Model comparison chart"
              className={`w-full max-h-[400px] object-contain mx-auto ${!imageLoaded ? "hidden" : ""}`}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

