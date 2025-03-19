"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Loader2, Download } from 'lucide-react'
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
              <div className="grid grid-cols-1 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{t("textClassificationDatasets")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="min-w-full border-collapse">
                        <thead>
                          <tr className="bg-muted">
                            <th className="border px-4 py-2 text-left">Dataset</th>
                            <th className="border px-4 py-2 text-left">Type</th>
                            <th className="border px-4 py-2 text-left">Number of labels</th>
                            <th className="border px-4 py-2 text-left">Size (train/test)</th>
                            <th className="border px-4 py-2 text-left">Avg. length (tokens)</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border px-4 py-2 text-blue-600 hover:underline">
                              <a
                                href="https://nlp.stanford.edu/sentiment/index.html"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                SST
                              </a>
                            </td>
                            <td className="border px-4 py-2">sentiment</td>
                            <td className="border px-4 py-2">5 or 2</td>
                            <td className="border px-4 py-2">8.5k / 11k</td>
                            <td className="border px-4 py-2">19</td>
                          </tr>
                          <tr className="bg-muted/50">
                            <td className="border px-4 py-2 text-blue-600 hover:underline">
                              <a
                                href="https://ai.stanford.edu/~amaas/data/sentiment/"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                IMDb Review
                              </a>
                            </td>
                            <td className="border px-4 py-2">sentiment</td>
                            <td className="border px-4 py-2">2</td>
                            <td className="border px-4 py-2">25k / 25k</td>
                            <td className="border px-4 py-2">271</td>
                          </tr>
                          <tr>
                            <td className="border px-4 py-2 text-blue-600 hover:underline">
                              <a href="https://www.yelp.com/dataset" target="_blank" rel="noopener noreferrer">
                                Yelp Review
                              </a>
                            </td>
                            <td className="border px-4 py-2">sentiment</td>
                            <td className="border px-4 py-2">5 or 2</td>
                            <td className="border px-4 py-2">650k / 50k</td>
                            <td className="border px-4 py-2">179</td>
                          </tr>
                          <tr className="bg-muted/50">
                            <td className="border px-4 py-2 text-blue-600 hover:underline">
                              <a
                                href="https://jmcauley.ucsd.edu/data/amazon/"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Amazon Review
                              </a>
                            </td>
                            <td className="border px-4 py-2">sentiment</td>
                            <td className="border px-4 py-2">5 or 2</td>
                            <td className="border px-4 py-2">3m / 650k</td>
                            <td className="border px-4 py-2">79</td>
                          </tr>
                          <tr>
                            <td className="border px-4 py-2 text-blue-600 hover:underline">
                              <a href="https://trec.nist.gov/data/qa.html" target="_blank" rel="noopener noreferrer">
                                TREC
                              </a>
                            </td>
                            <td className="border px-4 py-2">question</td>
                            <td className="border px-4 py-2">6</td>
                            <td className="border px-4 py-2">5.5k / 0.5k</td>
                            <td className="border px-4 py-2">10</td>
                          </tr>
                          <tr className="bg-muted/50">
                            <td className="border px-4 py-2 text-blue-600 hover:underline">
                              <a
                                href="https://webscope.sandbox.yahoo.com/catalog.php?datatype=l"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Yahoo! Answers
                              </a>
                            </td>
                            <td className="border px-4 py-2">question</td>
                            <td className="border px-4 py-2">10</td>
                            <td className="border px-4 py-2">14m / 60k</td>
                            <td className="border px-4 py-2">131</td>
                          </tr>
                          <tr>
                            <td className="border px-4 py-2 text-blue-600 hover:underline">
                              <a
                                href="http://groups.di.unipi.it/~gulli/AG_corpus_of_news_articles.html"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                AG's News
                              </a>
                            </td>
                            <td className="border px-4 py-2">topic</td>
                            <td className="border px-4 py-2">4</td>
                            <td className="border px-4 py-2">120k / 7.6k</td>
                            <td className="border px-4 py-2">44</td>
                          </tr>
                          <tr className="bg-muted/50">
                            <td className="border px-4 py-2 text-blue-600 hover:underline">
                              <a
                                href="https://www.sogou.com/labs/resource/cs.php"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Sogou News
                              </a>
                            </td>
                            <td className="border px-4 py-2">topic</td>
                            <td className="border px-4 py-2">6</td>
                            <td className="border px-4 py-2">54k / 6k</td>
                            <td className="border px-4 py-2">737</td>
                          </tr>
                          <tr>
                            <td className="border px-4 py-2 text-blue-600 hover:underline">
                              <a href="https://wiki.dbpedia.org/Datasets" target="_blank" rel="noopener noreferrer">
                                DBPedia
                              </a>
                            </td>
                            <td className="border px-4 py-2">topic</td>
                            <td className="border px-4 py-2">14</td>
                            <td className="border px-4 py-2">560k / 70k</td>
                            <td className="border px-4 py-2">67</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{t("popularNLPDatasets")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h3 className="font-medium">Text Classification</h3>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>
                            <a
                              href="https://www.kaggle.com/datasets/kazanova/sentiment140"
                              className="text-blue-600 hover:underline"
                            >
                              Sentiment140 - Twitter sentiment analysis
                            </a>
                          </li>
                          <li>
                            <a href="https://huggingface.co/datasets/imdb" className="text-blue-600 hover:underline">
                              IMDB Reviews - Movie reviews with sentiment labels
                            </a>
                          </li>
                          <li>
                            <a href="https://huggingface.co/datasets/ag_news" className="text-blue-600 hover:underline">
                              AG News - News articles categorized by topic
                            </a>
                          </li>
                        </ul>
                      </div>

                      <div className="space-y-2">
                        <h3 className="font-medium">Question Answering</h3>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>
                            <a href="https://huggingface.co/datasets/squad" className="text-blue-600 hover:underline">
                              SQuAD - Stanford Question Answering Dataset
                            </a>
                          </li>
                          <li>
                            <a
                              href="https://huggingface.co/datasets/natural_questions"
                              className="text-blue-600 hover:underline"
                            >
                              Natural Questions - Google's dataset of real queries
                            </a>
                          </li>
                        </ul>
                      </div>

                      <div className="space-y-2">
                        <h3 className="font-medium">Named Entity Recognition</h3>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>
                            <a
                              href="https://huggingface.co/datasets/conll2003"
                              className="text-blue-600 hover:underline"
                            >
                              CoNLL-2003 - Named entity annotations
                            </a>
                          </li>
                          <li>
                            <a
                              href="https://www.kaggle.com/datasets/abhinavwalia95/entity-annotated-corpus"
                              className="text-blue-600 hover:underline"
                            >
                              GMB Corpus - Groningen Meaning Bank corpus
                            </a>
                          </li>
                        </ul>
                      </div>

                      <div className="space-y-2">
                        <h3 className="font-medium">Machine Translation</h3>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>
                            <a href="https://huggingface.co/datasets/wmt14" className="text-blue-600 hover:underline">
                              WMT14 - Translation task dataset
                            </a>
                          </li>
                          <li>
                            <a href="https://opus.nlpl.eu/" className="text-blue-600 hover:underline">
                              OPUS - Collection of translated texts
                            </a>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Downloadable Datasets</CardTitle>
                    <CardDescription>Download these datasets to use in subsequent steps</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <Card className="border shadow-sm">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">IMDB Reviews</CardTitle>
                          <CardDescription className="text-xs">Movie reviews with sentiment labels (positive/negative)</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-2">
                          <p className="text-sm mb-2">50,000 movie reviews for sentiment analysis</p>
                          <div className="flex justify-between items-center">
                            <div className="text-xs text-muted-foreground">2.5MB</div>
                            <Button size="sm" className="flex items-center gap-1">
                              <Download className="h-3 w-3" />
                              Download CSV
                            </Button>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border shadow-sm">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">News Articles</CardTitle>
                          <CardDescription className="text-xs">AG News dataset with 4 categories</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-2">
                          <p className="text-sm mb-2">120,000 news articles in 4 categories</p>
                          <div className="flex justify-between items-center">
                            <div className="text-xs text-muted-foreground">5.8MB</div>
                            <Button size="sm" className="flex items-center gap-1">
                              <Download className="h-3 w-3" />
                              Download CSV
                            </Button>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border shadow-sm">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Twitter Sentiment</CardTitle>
                          <CardDescription className="text-xs">Tweets labeled with sentiment</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-2">
                          <p className="text-sm mb-2">1.6 million tweets with positive/negative labels</p>
                          <div className="flex justify-between items-center">
                            <div className="text-xs text-muted-foreground">77MB</div>
                            <Button size="sm" className="flex items-center gap-1">
                              <Download className="h-3 w-3" />
                              Download CSV
                            </Button>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border shadow-sm">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">SMS Spam</CardTitle>
                          <CardDescription className="text-xs">SMS messages labeled as spam or ham</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-2">
                          <p className="text-sm mb-2">5,574 SMS messages labeled as spam/ham</p>
                          <div className="flex justify-between items-center">
                            <div className="text-xs text-muted-foreground">0.5MB</div>
                            <Button size="sm" className="flex items-center gap-1">
                              <Download className="h-3 w-3" />
                              Download CSV
                            </Button>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border shadow-sm">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">BBC News</CardTitle>
                          <CardDescription className="text-xs">News articles from BBC in 5 categories</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-2">
                          <p className="text-sm mb-2">2,225 articles from 5 categories</p>
                          <div className="flex justify-between items-center">
                            <div className="text-xs text-muted-foreground">1.8MB</div>
                            <Button size="sm" className="flex items-center gap-1">
                              <Download className="h-3 w-3" />
                              Download CSV
                            </Button>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border shadow-sm">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Yelp Reviews</CardTitle>
                          <CardDescription className="text-xs">Business reviews with star ratings</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-2">
                          <p className="text-sm mb-2">Subset of 50,000 reviews with ratings</p>
                          <div className="flex justify-between items-center">
                            <div className="text-xs text-muted-foreground">12MB</div>
                            <Button size="sm" className="flex items-center gap-1">
                              <Download className="h-3 w-3" />
                              Download CSV
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="code" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{t("webScrapingWithPython")}</CardTitle>
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

                <Card>
                  <CardHeader>
                    <CardTitle>{t("knnClassification")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="p-4 bg-muted rounded-md overflow-x-auto text-sm">
                      {`from sklearn.datasets import fetch_20newsgroups
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.neighbors import KNeighborsClassifier
from sklearn.model_selection import train_test_split
from sklearn import metrics
from sklearn.metrics import accuracy_score, classification_report

# Load dataset
dataset = fetch_20newsgroups()
X, y = dataset.data, dataset.target

# Splitting dataset into training and testing sets
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=45)

# Convert dataset into feature vectors using TF-IDF Vectorizer
vectorizer = TfidfVectorizer(stop_words="english")
X_train = vectorizer.fit_transform(X_train)
X_test = vectorizer.transform(X_test)

# Train classifier (K-Nearest Neighbors)
model = KNeighborsClassifier(n_neighbors=3)
model.fit(X_train, y_train)

# Making predictions
pred = model.predict(X_test)

# Evaluating the model
print(metrics.classification_report(y_test, pred))
print("Accuracy:", accuracy_score(y_test, pred))
print(classification_report(y_test, pred))`}
                    </pre>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{t("loadingExploringDatasets")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="p-4 bg-muted rounded-md overflow-x-auto text-sm">
                      {`from datasets import load_dataset
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

# Load a dataset from Hugging Face
dataset = load_dataset("imdb")

# Convert to pandas DataFrame for easier exploration
train_df = pd.DataFrame(dataset["train"])
test_df = pd.DataFrame(dataset["test"])

print(f"Training set shape: {train_df.shape}")
print(f"Test set shape: {test_df.shape}")

# Display first few examples
print("\\nFirst 5 examples:")
print(train_df.head())

# Check label distribution
print("\\nLabel distribution in training set:")
print(train_df["label"].value_counts())

# Visualize label distribution
plt.figure(figsize=(8, 5))
sns.countplot(x="label", data=train_df)
plt.title("Label Distribution in IMDB Dataset")
plt.xlabel("Sentiment (0: Negative, 1: Positive)")
plt.ylabel("Count")
plt.show()

# Text length analysis
train_df["text_length"] = train_df["text"].apply(len)
print("\\nText length statistics:")
print(train_df["text_length"].describe())

# Visualize text length distribution
plt.figure(figsize=(10, 6))
sns.histplot(train_df["text_length"], bins=50)
plt.title("Text Length Distribution")
plt.xlabel("Text Length (characters)")
plt.ylabel("Count")
plt.show()

# Word count analysis
train_df["word_count"] = train_df["text"].apply(lambda x: len(x.split()))
print("\\nWord count statistics:")
print(train_df["word_count"].describe())

# Visualize word count distribution
plt.figure(figsize=(10, 6))
sns.histplot(train_df["word_count"], bins=50)
plt.title("Word Count Distribution")
plt.xlabel("Word Count")
plt.ylabel("Count")
plt.show()`}
                    </pre>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
