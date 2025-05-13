"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Clock } from "lucide-react"
import Image from "next/image"

interface Movie {
  id: string
  title: string
  genres: string[]
  posterUrl: string
  watchUrl: string
  description: string
  year: number
  country: string
  director: string
  duration: number
  rating: string
}

const DEFAULT_POSTER = "D:/desktop/xu ly ngon ngu tu nhien/image/mac_dinh.png"

const getGenresArray = (genres: string | string[]): string[] => {
  return typeof genres === 'string' ? genres.split('|') : genres
}

const AllMoviesPage: React.FC = () => {
  const t = useTranslations("RecSys.collaborative")
  const router = useRouter()
  const [movies, setMovies] = useState<Movie[]>([])
  const [filteredMovies, setFilteredMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filter states
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedGenre, setSelectedGenre] = useState("all")
  const [selectedYear, setSelectedYear] = useState("all")
  const [selectedCountry, setSelectedCountry] = useState("all")
  const [selectedRating, setSelectedRating] = useState("all")

  // Extract unique values for filters
  const uniqueGenres = Array.from(new Set(movies.flatMap(movie => movie.genres)))
  const uniqueYears = Array.from(new Set(movies.map(movie => movie.year))).sort((a, b) => b - a)
  const uniqueCountries = Array.from(new Set(movies.map(movie => movie.country)))
  const uniqueRatings = Array.from(new Set(movies.map(movie => movie.rating)))

  // Mapping for rating labels
  const ratingLabels: { [key: string]: string } = {
    'G': 'G (Phù hợp mọi lứa tuổi)',
    'PG': 'PG (Có sự hướng dẫn của phụ huynh)',
    'PG-13': 'PG-13 (Từ 13 tuổi trở lên)',
    'R': 'R (Hạn chế - Dưới 17 tuổi cần người lớn đi cùng)',
  }

  // Mapping for country labels
  const countryLabels: { [key: string]: string } = {
    'United States': 'Hoa Kỳ',
    'United Kingdom': 'Anh',
    'France': 'Pháp',
    'Japan': 'Nhật Bản',
    'China': 'Trung Quốc',
    'South Korea': 'Hàn Quốc',
    'Hong Kong': 'Hồng Kông',
    'Taiwan': 'Đài Loan',
    'Italy': 'Ý',
    'Australia': 'Úc',
    'Brazil': 'Brazil',
    'New Zealand': 'New Zealand'
  }

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const response = await fetch('/RecSys/movies.json')
        const data = await response.json()
        setMovies(data.movies)
        setFilteredMovies(data.movies)
      } catch (err) {
        console.error('Error fetching movies:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchMovies()
  }, [])

  useEffect(() => {
    let result = movies

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      result = result.filter(movie =>
        movie.title.toLowerCase().includes(searchLower) ||
        movie.description.toLowerCase().includes(searchLower) ||
        movie.director.toLowerCase().includes(searchLower)
      )
    }

    if (selectedGenre !== "all") {
      result = result.filter(movie => movie.genres.includes(selectedGenre))
    }

    if (selectedYear !== "all") {
      result = result.filter(movie => movie.year === parseInt(selectedYear))
    }

    if (selectedCountry !== "all") {
      result = result.filter(movie => movie.country === selectedCountry)
    }

    if (selectedRating !== "all") {
      result = result.filter(movie => movie.rating === selectedRating)
    }

    setFilteredMovies(result)
  }, [movies, searchTerm, selectedGenre, selectedYear, selectedCountry, selectedRating])

  const handleBack = () => {
    router.push('/RecSys/collaborative')
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <p>{t("loadingMovies")}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("back")}
        </Button>
      </div>

      <div className="grid gap-4 mb-8">
        <Input
          placeholder={t("searchPlaceholder")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select value={selectedGenre} onValueChange={setSelectedGenre}>
            <SelectTrigger>
              <SelectValue placeholder={t("allGenres")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allGenres")}</SelectItem>
              {uniqueGenres.map((genre) => (
                <SelectItem key={genre} value={genre}>
                  {genre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger>
              <SelectValue placeholder={t("allYears")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allYears")}</SelectItem>
              {uniqueYears.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedCountry} onValueChange={setSelectedCountry}>
            <SelectTrigger>
              <SelectValue placeholder={t("allCountries")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allCountries")}</SelectItem>
              {uniqueCountries.map((country) => (
                <SelectItem key={country} value={country}>
                  {countryLabels[country] || country}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedRating} onValueChange={setSelectedRating}>
            <SelectTrigger>
              <SelectValue placeholder={t("allRatings")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allRatings")}</SelectItem>
              {uniqueRatings.map((rating) => (
                <SelectItem key={rating} value={rating}>
                  {ratingLabels[rating] || rating}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMovies.map((movie) => (
          <Card key={movie.id} className="flex flex-col">
            <CardHeader>
              <div className="relative w-full h-[400px] mb-4">
                <Image
                  src={movie.posterUrl || DEFAULT_POSTER}
                  alt={movie.title}
                  fill
                  className="object-cover rounded-md"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = DEFAULT_POSTER
                  }}
                />
              </div>
              <CardTitle>{movie.title}</CardTitle>
              <CardDescription>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {t("duration", { duration: movie.duration })}
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-sm text-muted-foreground mb-4">{movie.description}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {movie.genres.map((genre, index) => (
                  <span key={index} className="bg-primary/10 text-primary rounded-full px-3 py-1 text-sm">
                    {genre}
                  </span>
                ))}
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  <span className="font-semibold">{t("director")}: </span>
                  {movie.director}
                </p>
                <p>
                  <span className="font-semibold">{t("year")}: </span>
                  {movie.year}
                </p>
                <p>
                  <span className="font-semibold">{t("country")}: </span>
                  {movie.country}
                </p>
              </div>
              <div className="mt-4">
                <Button asChild className="w-full">
                  <a href={movie.watchUrl} target="_blank" rel="noopener noreferrer">
                    {t("watchMovie")}
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default AllMoviesPage 