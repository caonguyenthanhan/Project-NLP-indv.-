"use client"

import React, { useState, useEffect } from 'react'
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, ArrowLeft, ArrowRight, SkipForward, RefreshCw, Send } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"

// Types
interface Movie {
  id: string
  title: string
  genres: string | string[]
  posterUrl: string
  watchUrl: string
  description: string
  year: number
  country: string
  director: string
  duration: number
  rating: string
}

interface RatingPayload {
  [movieId: string]: number
}

interface Recommendation {
  id: string
  title: string
  genres?: string
  score?: number
  posterUrl?: string
  watchUrl?: string
  description?: string
}

const DEFAULT_POSTER = "D:/desktop/xu ly ngon ngu tu nhien/image/mac_dinh.png"

const getGenresArray = (genres: string | string[]): string[] => {
  return typeof genres === 'string' ? genres.split('|') : genres
}

const getGenresString = (genres: string | string[]): string => {
  return getGenresArray(genres).join(' • ')
}

const CollaborativeFilteringPage: React.FC = () => {
  const t = useTranslations("RecSys")
  const router = useRouter()
  const [movies, setMovies] = useState<Movie[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [ratings, setRatings] = useState<RatingPayload>({})
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isLoadingMovies, setIsLoadingMovies] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [showResults, setShowResults] = useState(false)

  const MIN_RATINGS = 5
  const currentMovie = movies[currentIndex]
  const ratingCount = Object.keys(ratings).length
  const canSubmit = ratingCount >= MIN_RATINGS

  // Load movie data from API
  useEffect(() => {
    const loadMovies = async () => {
      setIsLoadingMovies(true)
      setError(null)
      try {
        const response = await fetch('/api/movies')
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        if (!data || !Array.isArray(data.movies)) {
          throw new Error('Dữ liệu phim không đúng định dạng')
        }
        setMovies(data.movies)
      } catch (err) {
        console.error('Error loading movie data:', err)
        setError('Không thể tải dữ liệu phim. Vui lòng thử lại sau. Lỗi: ' + (err instanceof Error ? err.message : String(err)))
      } finally {
        setIsLoadingMovies(false)
      }
    }

    loadMovies()
  }, [])

  const handleRatingChange = (movieId: string, newRating: number) => {
    setRatings(prev => ({
      ...prev,
      [movieId]: newRating
    }))
  }

  const handleNext = () => {
    if (currentIndex < movies.length - 1) {
      setCurrentIndex(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
    }
  }

  const handleSubmitRatings = async () => {
    if (!canSubmit) {
      setError(`Vui lòng đánh giá ít nhất ${MIN_RATINGS} phim.`)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('http://localhost:8000/recommend/collaborative', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ratings }),
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`Lỗi từ server (${response.status}): ${errorData || 'Không thể lấy gợi ý'}`)
      }

      const data: Recommendation[] = await response.json()
      setRecommendations(data)
      setShowResults(true)
    } catch (err: any) {
      if (err instanceof TypeError) {
        setError('Không thể kết nối đến server gợi ý. Vui lòng kiểm tra lại.')
      } else {
        setError(err.message || 'Đã có lỗi xảy ra khi lấy gợi ý.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSkip = () => {
    router.push('/vi/RecSys/content-based')
  }

  const handleBack = () => {
    router.push('/vi/RecSys')
  }

  if (isLoadingMovies) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mb-4" />
          <p className="text-muted-foreground">Đang tải danh sách phim...</p>
        </div>
      </div>
    )
  }

  if (error && !currentMovie) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="p-4 mb-4 text-sm text-destructive bg-destructive/10 rounded-md">
            {error}
          </div>
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Thử lại
          </Button>
        </div>
      </div>
    )
  }

  if (showResults) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <Button 
            variant="outline" 
            onClick={() => setShowResults(false)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại đánh giá
          </Button>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-4">Phim gợi ý dành cho bạn:</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recommendations.map((rec) => (
            <Card 
              key={rec.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => window.open(rec.watchUrl || '', '_blank')}
            >
              <div className="relative w-full h-64">
                <Image
                  src={rec.posterUrl || DEFAULT_POSTER}
                  alt={rec.title}
                  fill
                  className="object-cover rounded-t-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = DEFAULT_POSTER
                  }}
                />
              </div>
              <CardHeader>
                <CardTitle>{rec.title}</CardTitle>
                {rec.genres && (
                  <CardDescription>
                    {rec.genres.split('|').join(' • ')}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                {rec.description && (
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-3">
                    {rec.description}
                  </p>
                )}
                {rec.score && (
                  <p className="text-sm text-muted-foreground">
                    Điểm dự đoán: {rec.score.toFixed(2)}/5
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <Button 
          variant="outline" 
          onClick={handleBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </Button>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => router.push('/vi/RecSys/collaborative/all-movie')}
            className="flex items-center gap-2"
          >
            Xem toàn bộ phim
          </Button>
          <Button 
            variant="outline" 
            onClick={handleSkip}
            className="flex items-center gap-2"
          >
            Bỏ qua
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">Gợi ý Phim theo Lọc Cộng tác</h1>
        <p className="text-lg text-muted-foreground">
          Vui lòng đánh giá ít nhất {MIN_RATINGS} phim bằng cách chọn sao (1 đến 5).
          Hệ thống sẽ dựa vào đánh giá của bạn để gợi ý những phim phù hợp.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Phim {currentIndex + 1} / {movies.length} | Đã đánh giá: {ratingCount} phim
        </p>
      </div>

      {currentMovie && (
        <div className="max-w-2xl mx-auto">
          <Card className="mb-6">
            <div className="relative w-full h-96">
              <Image
                src={currentMovie.posterUrl || DEFAULT_POSTER}
                alt={currentMovie.title}
                fill
                className="object-cover rounded-t-lg"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = DEFAULT_POSTER
                }}
              />
            </div>
            <CardHeader>
              <CardTitle>{currentMovie.title}</CardTitle>
              {currentMovie.genres && (
                <CardDescription>
                  {getGenresString(currentMovie.genres)}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {currentMovie.description && (
                <p className="text-sm text-muted-foreground mb-4">
                  {currentMovie.description}
                </p>
              )}
              <div className="flex justify-center space-x-2 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleRatingChange(currentMovie.id, star)}
                    className={`text-3xl transition-colors duration-150 ${
                      (ratings[currentMovie.id] || 0) >= star
                        ? 'text-yellow-400'
                        : 'text-gray-300 hover:text-yellow-300'
                    }`}
                    aria-label={`Đánh giá ${star} sao cho phim ${currentMovie.title}`}
                  >
                    ★
                  </button>
                ))}
              </div>
              {ratings[currentMovie.id] && (
                <p className="text-sm text-primary text-center">
                  Bạn đã đánh giá: {ratings[currentMovie.id]} sao
                </p>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-between items-center gap-4">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="flex-1"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Phim trước
            </Button>
            
            {canSubmit ? (
              <Button
                onClick={handleSubmitRatings}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Nhận gợi ý
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={currentIndex === movies.length - 1}
                className="flex-1"
              >
                Phim tiếp
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>

          {error && (
            <div className="mt-4 p-4 text-sm text-destructive bg-destructive/10 rounded-md">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default CollaborativeFilteringPage 