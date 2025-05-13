"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, ArrowLeft, ArrowRight, SkipForward, RefreshCw, Send } from "lucide-react"
import Image from "next/image"

interface Movie {
  id: string
  title: string
  genres: string[]
  posterUrl: string
  watchUrl: string
  description: string
}

interface RatingPayload {
  [key: string]: number
}

interface Recommendation {
  movie: Movie
  score: number
}

const DEFAULT_POSTER = "D:/desktop/xu ly ngon ngu tu nhien/image/mac_dinh.png"

// Thêm hàm xáo trộn mảng
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const getGenresArray = (genres: string | string[]): string[] => {
  return typeof genres === 'string' ? genres.split('|') : genres
}

const getGenresString = (genres: string | string[]): string => {
  return getGenresArray(genres).join(' • ')
}

const CollaborativeFilteringPage: React.FC = () => {
  const t = useTranslations("RecSys.collaborative")
  const router = useRouter()
  const [movies, setMovies] = useState<Movie[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [ratings, setRatings] = useState<RatingPayload>({})
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const MIN_RATINGS = 5
  const ratingCount = Object.keys(ratings).length
  const canSubmit = ratingCount >= MIN_RATINGS

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const response = await fetch('/api/movies')
        const data = await response.json()
        // Xáo trộn danh sách phim khi tải
        setMovies(shuffleArray(data.movies))
      } catch (err) {
        console.error('Error fetching movies:', err)
        setError(t("loadingMovies"))
      }
    }
    fetchMovies()
  }, [])

  const handleRating = (rating: number) => {
    const currentMovie = movies[currentIndex]
    setRatings(prev => ({
      ...prev,
      [currentMovie.id]: rating
    }))
  }

  const handleSubmitRatings = async () => {
    if (!canSubmit) {
      console.log("Not enough ratings:", ratingCount, "< MIN_RATINGS:", MIN_RATINGS)
      setError(t("notEnoughRatings", { min: MIN_RATINGS }))
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      console.log("Sending ratings to backend:", ratings)
      console.log("Number of ratings being sent:", Object.keys(ratings).length)

      if (Object.keys(ratings).length === 0) {
        throw new Error("No valid ratings to send")
      }

      const response = await fetch('http://localhost:8000/recommend/collaborative', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ratings }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("Raw server response:", data)
      
      // Kiểm tra và chuyển đổi dữ liệu nếu cần
      let recommendations = []
      
      // Kiểm tra cấu trúc dữ liệu từ server
      if (data && Array.isArray(data)) {
        recommendations = data.map((rec: any) => ({
          movie: {
            id: rec.id?.toString() || '',
            title: rec.title || '',
            genres: Array.isArray(rec.genres) ? rec.genres : [],
            posterUrl: rec.posterUrl || DEFAULT_POSTER,
            watchUrl: rec.watchUrl || '#',
            description: rec.description || ''
          },
          score: parseFloat(rec.score) || 0
        }))
      } else if (data && data.recommendations && Array.isArray(data.recommendations)) {
        recommendations = data.recommendations.map((rec: any) => ({
          movie: {
            id: rec.movie?.id?.toString() || '',
            title: rec.movie?.title || '',
            genres: Array.isArray(rec.movie?.genres) ? rec.movie.genres : [],
            posterUrl: rec.movie?.posterUrl || DEFAULT_POSTER,
            watchUrl: rec.movie?.watchUrl || '#',
            description: rec.movie?.description || ''
          },
          score: parseFloat(rec.score) || 0
        }))
      }
      
      console.log("Processed recommendations:", recommendations)
      
      if (recommendations.length === 0) {
        throw new Error("No valid recommendations received")
      }
      
      setRecommendations(recommendations)
      setIsLoading(false)
    } catch (err) {
      console.error('Error getting recommendations:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      setIsLoading(false)
    }
  }

  const handleNext = () => {
    if (currentIndex < movies.length - 1) {
      setCurrentIndex(prev => prev + 1)
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
    }
  }

  const handleSkip = () => {
    handleNext()
  }

  const handleViewAllMovies = () => {
    router.push('/RecSys/collaborative/all-movie')
  }

  const handleTryAgain = () => {
    setRatings({})
    setRecommendations([])
    setCurrentIndex(0)
    setError(null)
    // Xáo trộn lại danh sách phim khi thử lại
    setMovies(prevMovies => shuffleArray(prevMovies))
  }

  if (movies.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>{t("loadingMovies")}</p>
        </div>
      </div>
    )
  }

  const currentMovie = movies[currentIndex]

  return (
    <div className="container mx-auto py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">{t("title")}</h1>
        <p className="text-xl text-muted-foreground">{t("description")}</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>{t("processing")}</p>
          </div>
        </div>
      ) : recommendations && recommendations.length > 0 ? (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">{t("recommendationsTitle")}</h2>
            <Button onClick={handleTryAgain} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              {t("tryAgain")}
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendations.map((rec, index) => {
              if (!rec || !rec.movie) {
                console.error("Invalid recommendation data:", rec);
                return null;
              }
              return (
                <Card key={index} className="flex flex-col">
                  <CardHeader>
                    <div className="relative w-full h-[400px] mb-4">
                      <Image
                        src={rec.movie.posterUrl}
                        alt={rec.movie.title}
                        fill
                        className="object-cover rounded-md"
                      />
                    </div>
                    <CardTitle>{rec.movie.title}</CardTitle>
                    <CardDescription>
                      {t("predictedRating", { score: rec.score.toFixed(1) })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <p className="text-sm text-muted-foreground mb-4">{rec.movie.description}</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {rec.movie.genres.map((genre, i) => (
                        <span key={i} className="bg-primary/10 text-primary rounded-full px-3 py-1 text-sm">
                          {genre}
                        </span>
                      ))}
                    </div>
                    <div className="mt-auto">
                      <Button asChild className="w-full">
                        <a href={rec.movie.watchUrl} target="_blank" rel="noopener noreferrer">
                          {t("watchMovie")}
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-center mb-6">
            <p className="text-lg">
              {t("currentMovie", {
                current: currentIndex + 1,
                total: movies.length,
                rated: ratingCount
              })}
            </p>
            <Button onClick={handleViewAllMovies} variant="outline">
              {t("viewAllMovies")}
            </Button>
          </div>

          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <div className="relative w-full h-[400px] mb-4">
                <Image
                  src={currentMovie.posterUrl}
                  alt={currentMovie.title}
                  fill
                  className="object-cover rounded-md"
                />
              </div>
              <CardTitle>{currentMovie.title}</CardTitle>
              <CardDescription>
                {currentMovie.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                {currentMovie.genres.map((genre, index) => (
                  <span key={index} className="bg-primary/10 text-primary rounded-full px-3 py-1 text-sm">
                    {genre}
                  </span>
                ))}
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <Button
                      key={rating}
                      variant={ratings[currentMovie.id] === rating ? "default" : "outline"}
                      size="lg"
                      onClick={() => handleRating(rating)}
                      title={t("rateMovie", { rating, title: currentMovie.title })}
                    >
                      {rating}
                    </Button>
                  ))}
                </div>

                {ratings[currentMovie.id] && (
                  <p className="text-center text-muted-foreground">
                    {t("yourRating", { rating: ratings[currentMovie.id] })}
                  </p>
                )}

                <div className="flex justify-between mt-4">
                  <Button
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    variant="outline"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t("prevMovie")}
                  </Button>

                  <Button
                    onClick={handleSkip}
                    variant="outline"
                  >
                    <SkipForward className="mr-2 h-4 w-4" />
                    {t("skip")}
                  </Button>

                  <Button
                    onClick={handleNext}
                    disabled={currentIndex === movies.length - 1}
                    variant="outline"
                  >
                    {t("nextMovie")}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>

                <Button
                  onClick={handleSubmitRatings}
                  disabled={!canSubmit || isLoading}
                  className="mt-4"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("processing")}
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      {t("getRecommendations")}
                    </>
                  )}
                </Button>

                {error && (
                  <p className="text-destructive text-center mt-2">{error}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default CollaborativeFilteringPage 