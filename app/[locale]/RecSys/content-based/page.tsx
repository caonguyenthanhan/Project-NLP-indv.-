"use client"

import React, { useState, ChangeEvent, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Loader2 } from "lucide-react"

interface FormData {
  genres: string[]
  description: string
}

interface PredictionResult {
  predicted_rating: number
  suggestions: string[]
}

const AVAILABLE_GENRES = [
  'Action', 'Adventure', 'Animation', 'Children', 'Comedy', 'Crime',
  'Documentary', 'Drama', 'Fantasy', 'Film-Noir', 'Horror', 'IMAX',
  'Musical', 'Mystery', 'Romance', 'Sci-Fi', 'Thriller', 'War', 'Western'
]

const ContentBasedPage: React.FC = () => {
  const router = useRouter()
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [description, setDescription] = useState<string>('')
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenreChange = (genre: string, checked: boolean) => {
    setSelectedGenres(prev => 
      checked ? [...prev, genre] : prev.filter(g => g !== genre)
    )
  }

  const handleDescriptionChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(event.target.value)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)
    setError(null)
    setPredictionResult(null)

    const formData: FormData = {
      genres: selectedGenres,
      description: description,
    }

    try {
      const response = await fetch('http://localhost:8000/recommend/content-based', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`Lỗi từ server (${response.status}): ${errorData || 'Không thể lấy dự đoán'}`)
      }

      const data: PredictionResult = await response.json()
      setPredictionResult(data)
    } catch (err: any) {
      if (err instanceof TypeError) {
        setError('Không thể kết nối đến server dự đoán. Vui lòng kiểm tra lại.')
      } else {
        setError(err.message || 'Đã có lỗi xảy ra khi lấy dự đoán.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <Button 
          variant="outline" 
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </Button>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Dự đoán & Tư vấn Phim theo Nội dung</CardTitle>
          <CardDescription>
            Hãy cung cấp thông tin về ý tưởng phim của bạn. Hệ thống sẽ dự đoán mức độ yêu thích 
            (thang điểm 5) và đưa ra gợi ý cải thiện dựa trên dữ liệu đã học.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Thể loại (Chọn một hoặc nhiều):
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {AVAILABLE_GENRES.map((genre) => (
                  <div key={genre} className="flex items-center space-x-2">
                    <Checkbox
                      id={genre}
                      checked={selectedGenres.includes(genre)}
                      onCheckedChange={(checked) => handleGenreChange(genre, checked as boolean)}
                    />
                    <label
                      htmlFor={genre}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {genre}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Mô tả / Từ khóa chính:
              </label>
              <Textarea
                value={description}
                onChange={handleDescriptionChange}
                placeholder="Ví dụ: Một nhà khảo cổ học dấn thân vào cuộc phiêu lưu tìm kiếm cổ vật bị mất trong rừng rậm..."
                className="min-h-[100px]"
              />
            </div>

            <div className="flex justify-center">
              <Button
                type="submit"
                disabled={isLoading || !description.trim() || selectedGenres.length === 0}
                className="min-w-[200px]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang phân tích...
                  </>
                ) : (
                  'Dự đoán & Nhận Tư vấn'
                )}
              </Button>
            </div>

            {(!description.trim() || selectedGenres.length === 0) && !isLoading && (
              <p className="text-sm text-destructive text-center">
                Vui lòng chọn ít nhất 1 thể loại và nhập mô tả.
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      {error && (
        <Card className="mb-8 border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Lỗi</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      )}

      {predictionResult && !isLoading && (
        <Card>
          <CardHeader>
            <CardTitle>Kết quả Phân tích</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-primary/10 p-4 rounded-lg">
              <p className="text-lg font-semibold">
                Đánh giá dự đoán:{' '}
                <span className="text-xl font-bold">
                  {predictionResult.predicted_rating.toFixed(1)} / 5.0
                </span>
              </p>
            </div>

            {predictionResult.suggestions && predictionResult.suggestions.length > 0 ? (
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Gợi ý cải thiện tiềm năng:</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {predictionResult.suggestions.map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-green-600 dark:text-green-400">
                Không có gợi ý cụ thể nào, ý tưởng của bạn có vẻ khá tốt!
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default ContentBasedPage 