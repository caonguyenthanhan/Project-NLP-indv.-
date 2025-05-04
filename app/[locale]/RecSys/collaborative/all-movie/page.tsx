"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Clock, Star } from "lucide-react"
import Image from "next/image"

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

const DEFAULT_POSTER = "D:/desktop/xu ly ngon ngu tu nhien/image/mac_dinh.png"

const getGenresArray = (genres: string | string[]): string[] => {
  return typeof genres === 'string' ? genres.split('|') : genres
}

const AllMoviesPage: React.FC = () => {
  const router = useRouter()
  const [movies, setMovies] = useState<Movie[]>([])
  const [filteredMovies, setFilteredMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filter states
  const [selectedGenre, setSelectedGenre] = useState<string>("all")
  const [selectedYear, setSelectedYear] = useState<string>("all")
  const [selectedCountry, setSelectedCountry] = useState<string>("all")
  const [selectedRating, setSelectedRating] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  // Extract unique values for filters
  const genres = Array.from(
    new Set(
      movies.flatMap(movie => getGenresArray(movie.genres))
    )
  )
  const years = Array.from(
    new Set(
      movies
        .map(movie => movie.year)
        .filter((year): year is number => typeof year === 'number' && !isNaN(year))
    )
  ).sort((a, b) => b - a)
  const countries = Array.from(
    new Set(
      movies
        .map(movie => movie.country)
        .filter((country): country is string => typeof country === 'string' && country.length > 0)
    )
  )
  const ratings = Array.from(
    new Set(
      movies
        .map(movie => movie.rating)
        .filter((rating): rating is string => typeof rating === 'string' && rating.length > 0)
    )
  )

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const response = await fetch('/api/movies')
        if (!response.ok) throw new Error('Failed to fetch movies')
        const data = await response.json()
        setMovies(data.movies)
        setFilteredMovies(data.movies)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load movies')
      } finally {
        setLoading(false)
      }
    }

    fetchMovies()
  }, [])

  useEffect(() => {
    let result = [...movies]

    // Apply genre filter
    if (selectedGenre !== "all") {
      result = result.filter(movie => getGenresArray(movie.genres).includes(selectedGenre))
    }

    // Apply year filter
    if (selectedYear !== "all") {
      result = result.filter(movie => movie.year === parseInt(selectedYear))
    }

    // Apply country filter
    if (selectedCountry !== "all") {
      result = result.filter(movie => movie.country === selectedCountry)
    }

    // Apply rating filter
    if (selectedRating !== "all") {
      result = result.filter(movie => movie.rating === selectedRating)
    }

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(movie => 
        movie.title.toLowerCase().includes(query) ||
        movie.description.toLowerCase().includes(query) ||
        movie.director.toLowerCase().includes(query)
      )
    }

    setFilteredMovies(result)
  }, [movies, selectedGenre, selectedYear, selectedCountry, selectedRating, searchQuery])

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <p>Đang tải danh sách phim...</p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Input
          placeholder="Tìm kiếm theo tên phim, mô tả hoặc đạo diễn..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />
        <Select value={selectedGenre} onValueChange={setSelectedGenre}>
          <SelectTrigger>
            <SelectValue placeholder="Thể loại phim" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả thể loại</SelectItem>
            {genres.map(genre => (
              <SelectItem key={genre} value={genre}>{genre}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger>
            <SelectValue placeholder="Năm sản xuất" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả các năm</SelectItem>
            {years.map(year => (
              <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedCountry} onValueChange={setSelectedCountry}>
          <SelectTrigger>
            <SelectValue placeholder="Quốc gia" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả quốc gia</SelectItem>
            {countries.map(country => (
              <SelectItem key={country} value={country}>{country}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedRating} onValueChange={setSelectedRating}>
          <SelectTrigger>
            <SelectValue placeholder="Xếp hạng" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả xếp hạng</SelectItem>
            {ratings.map(rating => (
              <SelectItem key={rating} value={rating}>{rating}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMovies.map((movie) => (
          <Card key={movie.id} className="overflow-hidden">
            <div className="relative w-full h-64">
              <Image
                src={movie.posterUrl || DEFAULT_POSTER}
                alt={movie.title}
                fill
                className="object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = DEFAULT_POSTER
                }}
              />
            </div>
            <CardHeader>
              <CardTitle className="flex justify-between items-start">
                <span>{movie.title}</span>
                <span className="text-sm font-normal bg-primary/10 px-2 py-1 rounded">
                  {movie.rating}
                </span>
              </CardTitle>
              <CardDescription>
                <div className="flex flex-wrap gap-2 mb-2">
                  {getGenresArray(movie.genres).map((genre: string, index: number) => (
                    <span key={index} className="bg-muted px-2 py-1 rounded-full text-xs">
                      {genre}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4" />
                  <span>{movie.duration} phút</span>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <p className="text-sm">
                  <span className="font-medium">Đạo diễn:</span> {movie.director}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Quốc gia:</span> {movie.country}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Năm:</span> {movie.year}
                </p>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {movie.description}
                </p>
              </div>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => window.open(movie.watchUrl, '_blank')}
              >
                Xem phim
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default AllMoviesPage 