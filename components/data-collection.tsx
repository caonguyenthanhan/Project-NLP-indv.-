//công cụ thu thập dữ liệu từ web.
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Loader2, Download } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTranslations } from "next-intl"

export default function DataCollection() {
  const t = useTranslations("dataCollection")
  const common = useTranslations("common")

  const [url, setUrl] = useState("https://www.imdb.com/search/title/?groups=top_100&sort=user_rating,desc")
  const [isLoading, setIsLoading] = useState(false)
  const [scrapedData, setScrapedData] = useState<any[]>([])
  const [selectedDataset, setSelectedDataset] = useState("imdb")
  const [csvContent, setCsvContent] = useState("")

  const handleScrape = () => {
    setIsLoading(true)

    setTimeout(() => {
      try {
        // Simulate web scraping based on the selected dataset
        if (selectedDataset === "imdb") {
          // Simulate IMDB movie data
          const mockImdbData = [
            { title: "The Shawshank Redemption", rating: "9.3", year: "1994", director: "Frank Darabont" },
            { title: "The Godfather", rating: "9.2", year: "1972", director: "Francis Ford Coppola" },
            { title: "The Dark Knight", rating: "9.0", year: "2008", director: "Christopher Nolan" },
            { title: "The Godfather Part II", rating: "9.0", year: "1974", director: "Francis Ford Coppola" },
            { title: "12 Angry Men", rating: "9.0", year: "1957", director: "Sidney Lumet" },
            { title: "Schindler's List", rating: "8.9", year: "1993", director: "Steven Spielberg" },
            {
              title: "The Lord of the Rings: The Return of the King",
              rating: "8.9",
              year: "2003",
              director: "Peter Jackson",
            },
            { title: "Pulp Fiction", rating: "8.9", year: "1994", director: "Quentin Tarantino" },
            {
              title: "The Lord of the Rings: The Fellowship of the Ring",
              rating: "8.8",
              year: "2001",
              director: "Peter Jackson",
            },
            { title: "The Good, the Bad and the Ugly", rating: "8.8", year: "1966", director: "Sergio Leone" },
          ]
          setScrapedData(mockImdbData)

          // Generate CSV content
          const headers = "Title,Rating,Year,Director\n"
          const rows = mockImdbData
            .map((movie) => `"${movie.title}","${movie.rating}","${movie.year}","${movie.director}"`)
            .join("\n")
          setCsvContent(headers + rows)
        } else if (selectedDataset === "books") {
          // Simulate books.toscrape.com data
          const mockBooksData = [
            { title: "A Light in the Attic", price: "£51.77", availability: "In stock", rating: "Three" },
            { title: "Tipping the Velvet", price: "£53.74", availability: "In stock", rating: "One" },
            { title: "Soumission", price: "£50.10", availability: "In stock", rating: "One" },
            { title: "Sharp Objects", price: "£47.82", availability: "In stock", rating: "Four" },
            {
              title: "Sapiens: A Brief History of Humankind",
              price: "£54.23",
              availability: "In stock",
              rating: "Five",
            },
            { title: "The Requiem Red", price: "£22.65", availability: "In stock", rating: "One" },
            {
              title: "The Dirty Little Secrets of Getting Your Dream Job",
              price: "£33.34",
              availability: "In stock",
              rating: "Four",
            },
            {
              title: "The Coming Woman: A Novel Based on the Life of the Infamous Feminist, Victoria Woodhull",
              price: "£17.93",
              availability: "In stock",
              rating: "Three",
            },
            {
              title: "The Boys in the Boat: Nine Americans and Their Epic Quest for Gold at the 1936 Berlin Olympics",
              price: "£22.60",
              availability: "In stock",
              rating: "Four",
            },
            { title: "The Black Maria", price: "£52.15", availability: "In stock", rating: "One" },
          ]
          setScrapedData(mockBooksData)

          // Generate CSV content
          const headers = "Title,Price,Availability,Rating\n"
          const rows = mockBooksData
            .map((book) => `"${book.title}","${book.price}","${book.availability}","${book.rating}"`)
            .join("\n")
          setCsvContent(headers + rows)
        }
      } catch (error) {
        console.error("Error scraping data:", error)
      } finally {
        setIsLoading(false)
      }
    }, 2000)
  }

  const downloadCSV = () => {
    if (!csvContent) return

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", `${selectedDataset}_data.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="webscraping">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="webscraping">{t("webScraping")}</TabsTrigger>
              <TabsTrigger value="publicdata">{t("publicData")}</TabsTrigger>
              <TabsTrigger value="code">{t("code")}</TabsTrigger>
            </TabsList>

            <TabsContent value="webscraping" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="dataset-select">{t("selectDataset")}</Label>
                    <Select value={selectedDataset} onValueChange={setSelectedDataset}>
                      <SelectTrigger id="dataset-select">
                        <SelectValue placeholder={t("selectDataset")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="imdb">IMDB Top Movies</SelectItem>
                        <SelectItem value="books">Books to Scrape</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="url-input">{t("url")}</Label>
                    <Input id="url-input" value={url} onChange={(e) => setUrl(e.target.value)} placeholder={t("url")} />
                  </div>

                  <Button onClick={handleScrape} disabled={isLoading} className="w-full">
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t("scraping")}
                      </>
                    ) : (
                      t("scrapeData")
                    )}
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>{t("scrapedData")}</Label>
                    {scrapedData.length > 0 && (
                      <Button variant="outline" size="sm" onClick={downloadCSV}>
                        <Download className="h-4 w-4 mr-2" />
                        {t("downloadCSV")}
                      </Button>
                    )}
                  </div>

                  {scrapedData.length > 0 ? (
                    <div className="border rounded-md overflow-x-auto max-h-[400px]">
                      <table className="min-w-full">
                        <thead className="bg-muted sticky top-0">
                          <tr>
                            {Object.keys(scrapedData[0]).map((key) => (
                              <th key={key} className="px-4 py-2 text-left font-medium">
                                {key.charAt(0).toUpperCase() + key.slice(1)}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {scrapedData.map((item, index) => (
                            <tr key={index} className={index % 2 === 0 ? "bg-muted/50" : ""}>
                              {Object.values(item).map((value, i) => (
                                <td key={i} className="px-4 py-2 border-t">
                                  {value as string}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-muted-foreground border rounded-md">{t("scrapedData")}</div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="publicdata" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Kaggle Datasets</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4">Kaggle là nền tảng phổ biến cung cấp nhiều bộ dữ liệu miễn phí cho NLP:</p>
                    <ul className="list-disc pl-5 space-y-2">
                      <li>
                        <a
                          href="https://www.kaggle.com/datasets/kazanova/sentiment140"
                          className="text-blue-600 hover:underline"
                        >
                          Sentiment140 - Phân tích cảm xúc từ tweets
                        </a>
                      </li>
                      <li>
                        <a
                          href="https://www.kaggle.com/datasets/snap/amazon-fine-food-reviews"
                          className="text-blue-600 hover:underline"
                        >
                          Amazon Fine Food Reviews - Đánh giá thực phẩm
                        </a>
                      </li>
                      <li>
                        <a
                          href="https://www.kaggle.com/datasets/Cornell-University/arxiv"
                          className="text-blue-600 hover:underline"
                        >
                          arXiv Dataset - Bài báo khoa học
                        </a>
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Hugging Face Datasets</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4">Hugging Face cung cấp thư viện datasets với nhiều bộ dữ liệu NLP:</p>
                    <ul className="list-disc pl-5 space-y-2">
                      <li>
                        <a href="https://huggingface.co/datasets/glue" className="text-blue-600 hover:underline">
                          GLUE Benchmark - Bộ dữ liệu đánh giá mô hình ngôn ngữ
                        </a>
                      </li>
                      <li>
                        <a href="https://huggingface.co/datasets/squad" className="text-blue-600 hover:underline">
                          SQuAD - Stanford Question Answering Dataset
                        </a>
                      </li>
                      <li>
                        <a href="https://huggingface.co/datasets/imdb" className="text-blue-600 hover:underline">
                          IMDB Reviews - Đánh giá phim với nhãn cảm xúc
                        </a>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="code" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Python Web Scraping Code</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="p-4 bg-muted rounded-md overflow-x-auto text-sm">
                    {`import requests
from bs4 import BeautifulSoup
import pandas as pd

def scrape_imdb_top_movies(url="https://www.imdb.com/search/title/?groups=top_100&sort=user_rating,desc"):
    """
    Scrape top rated movies from IMDB
    
    Parameters:
    -----------
    url : str
        URL to scrape
        
    Returns:
    --------
    pandas.DataFrame
        DataFrame containing movie data
    """
    # Send request to the URL
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    response = requests.get(url, headers=headers)
    
    # Check if request was successful
    if response.status_code != 200:
        print(f"Failed to retrieve page: {response.status_code}")
        return None
    
    # Parse HTML content
    soup = BeautifulSoup(response.content, 'html.parser')
    
    # Find all movie containers
    movie_containers = soup.find_all('div', class_='lister-item-content')
    
    # Extract data
    movies = []
    for container in movie_containers:
        # Title
        title = container.h3.a.text
        
        # Year
        year = container.h3.find('span', class_='lister-item-year').text
        year = year.replace('(', '').replace(')', '').strip()
        
        # Rating
        rating = container.find('div', class_='ratings-imdb-rating').strong.text
        
        # Director and stars
        director = "N/A"
        stars = []
        
        crew_p = container.find('p', class_='text-muted text-small')
        if crew_p:
            crew_links = crew_p.find_all('a')
            if crew_links and len(crew_links) > 0:
                director = crew_links[0].text
                stars = [star.text for star in crew_links[1:]]
        
        movies.append({
            'title': title,
            'year': year,
            'rating': rating,
            'director': director,
            'stars': ', '.join(stars)
        })
    
    # Create DataFrame
    df = pd.DataFrame(movies)
    return df

# Example usage
if __name__ == "__main__":
    df = scrape_imdb_top_movies()
    print(df.head())
    
    # Save to CSV
    df.to_csv('imdb_top_movies.csv', index=False)
    print("Data saved to imdb_top_movies.csv")
`}
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

