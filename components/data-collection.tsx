"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Loader2, Download, Upload } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTranslations } from "next-intl"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { useWorkflow } from "@/context/workflow-context"
import { v4 as uuidv4 } from "uuid"

export default function DataCollection() {
  const t = useTranslations("dataCollection")
  const common = useTranslations("common")
  const { addDataset, setCurrentStep } = useWorkflow()

  const [url, setUrl] = useState("https://www.imdb.com/search/title/?groups=top_100&sort=user_rating,desc")
  const [isLoading, setIsLoading] = useState(false)
  const [scrapedData, setScrapedData] = useState<any[]>([])
  const [selectedDataset, setSelectedDataset] = useState("imdb")
  const [csvContent, setCsvContent] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleScrape = async () => {
    setIsLoading(true)
    const toastId = toast.loading(t("scraping"))

    try {
      // Real web scraping using the backend
      const response = await fetch(`http://localhost:8000/scrape-url`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url, dataset_type: selectedDataset }),
      })

      if (!response.ok) {
        throw new Error(`Failed to scrape data: ${response.status}`)
      }

      const data = await response.json()
      setScrapedData(data.data)
      setCsvContent(data.csv_content)

      toast.update(toastId, {
        render: t("scrapeSuccess"),
        type: "success",
        isLoading: false,
        autoClose: 3000,
      })
    } catch (error) {
      console.error("Error scraping data:", error)
      toast.update(toastId, {
        render: `Error: ${error instanceof Error ? error.message : "Failed to scrape data"}`,
        type: "error",
        isLoading: false,
        autoClose: 3000,
      })
    } finally {
      setIsLoading(false)
    }
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

  const downloadDataset = async (datasetName: string) => {
    const toastId = toast.loading(t("downloadingDataset"))
    try {
      const response = await fetch(`http://localhost:8000/get-dataset/${datasetName}`)
      if (!response.ok) {
        throw new Error("Failed to download dataset")
      }

      const blob = await response.blob()
      const text = await blob.text()
      const rows = text.split("\n")
      const headers = rows[0].split(",")

      // Parse CSV to JSON
      const jsonData = rows
        .slice(1)
        .filter((row) => row.trim())
        .map((row) => {
          const values = row.split(",")
          const obj: Record<string, string> = {}
          headers.forEach((header, index) => {
            obj[header.trim()] = values[index]?.trim() || ""
          })
          return obj
        })

      // Add to workflow context
      addDataset({
        id: uuidv4(),
        name: `${datasetName} Dataset`,
        type: "raw",
        data: jsonData,
        metadata: {
          source: `Downloaded from ${datasetName}`,
          createdAt: new Date().toISOString(),
          size: jsonData.length,
        },
      })

      toast.update(toastId, {
        render: t("downloadSuccess"),
        type: "success",
        isLoading: false,
        autoClose: 3000,
      })

      // Move to next step
      setTimeout(() => {
        setCurrentStep(1) // Move to data augmentation step
      }, 1000)
    } catch (error) {
      toast.update(toastId, {
        render: `Error: ${error instanceof Error ? error.message : "Failed to download dataset"}`,
        type: "error",
        isLoading: false,
        autoClose: 3000,
      })
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    const file = e.target.files[0]
    const toastId = toast.loading(t("uploadingFile"))

    try {
      const text = await file.text()
      const rows = text.split("\n")
      const headers = rows[0].split(",")

      // Parse CSV to JSON
      const jsonData = rows
        .slice(1)
        .filter((row) => row.trim())
        .map((row) => {
          const values = row.split(",")
          const obj: Record<string, string> = {}
          headers.forEach((header, index) => {
            obj[header.trim()] = values[index]?.trim() || ""
          })
          return obj
        })

      // Add to workflow context
      addDataset({
        id: uuidv4(),
        name: `Uploaded: ${file.name}`,
        type: "raw",
        data: jsonData,
        metadata: {
          source: `Uploaded file: ${file.name}`,
          createdAt: new Date().toISOString(),
          size: jsonData.length,
        },
      })

      toast.update(toastId, {
        render: t("uploadSuccess"),
        type: "success",
        isLoading: false,
        autoClose: 3000,
      })

      // Move to next step
      setTimeout(() => {
        setCurrentStep(1) // Move to data augmentation step
      }, 1000)
    } catch (error) {
      toast.update(toastId, {
        render: `Error: ${error instanceof Error ? error.message : "Failed to upload file"}`,
        type: "error",
        isLoading: false,
        autoClose: 3000,
      })
    }
  }

  const handleSaveScrapedData = () => {
    if (scrapedData.length === 0) {
      toast.error(t("noDataToSave"))
      return
    }

    addDataset({
      id: uuidv4(),
      name: `Scraped: ${selectedDataset}`,
      type: "raw",
      data: scrapedData,
      metadata: {
        source: `Scraped from ${url}`,
        createdAt: new Date().toISOString(),
        size: scrapedData.length,
      },
    })

    toast.success(t("dataSaved"))

    // Move to next step
    setTimeout(() => {
      setCurrentStep(1) // Move to data augmentation step
    }, 1000)
  }

  return (
    <div className="space-y-6">
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="webscraping">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="webscraping" className="text-xs md:text-sm" style={{ whiteSpace: "nowrap" }}>
                {t("webScraping")}
              </TabsTrigger>
              <TabsTrigger value="publicdata" className="text-xs md:text-sm" style={{ whiteSpace: "nowrap" }}>
                {t("publicData")}
              </TabsTrigger>
              <TabsTrigger value="upload" className="text-xs md:text-sm" style={{ whiteSpace: "nowrap" }}>
                {t("uploadData")}
              </TabsTrigger>
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
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={downloadCSV}>
                          <Download className="h-4 w-4 mr-2" />
                          {t("downloadCSV")}
                        </Button>
                        <Button size="sm" onClick={handleSaveScrapedData}>
                          {common("saveAndContinue")}
                        </Button>
                      </div>
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
                    <div className="p-8 text-center text-muted-foreground border rounded-md">{t("noScrapedData")}</div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="publicdata" className="space-y-6 mt-6">
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
                        <CardDescription className="text-xs">
                          Movie reviews with sentiment labels (positive/negative)
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-2">
                        <p className="text-sm mb-2">50,000 movie reviews for sentiment analysis</p>
                        <div className="flex justify-between items-center">
                          <div className="text-xs text-muted-foreground">2.5MB</div>
                          <Button size="sm" className="flex items-center gap-1" onClick={() => downloadDataset("imdb")}>
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
                          <Button
                            size="sm"
                            className="flex items-center gap-1"
                            onClick={() => downloadDataset("ag_news")}
                          >
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
                          <Button
                            size="sm"
                            className="flex items-center gap-1"
                            onClick={() => downloadDataset("twitter")}
                          >
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
                          <Button size="sm" className="flex items-center gap-1" onClick={() => downloadDataset("sms")}>
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
                          <Button size="sm" className="flex items-center gap-1" onClick={() => downloadDataset("bbc")}>
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
                          <Button size="sm" className="flex items-center gap-1" onClick={() => downloadDataset("yelp")}>
                            <Download className="h-3 w-3" />
                            Download CSV
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="upload" className="space-y-6 mt-6">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{t("uploadYourData")}</CardTitle>
                    <CardDescription>{t("uploadDescription")}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-md">
                      <Upload className="h-10 w-10 text-muted-foreground mb-4" />
                      <p className="mb-2 text-sm text-center">{t("dragAndDrop")}</p>
                      <p className="mb-4 text-xs text-muted-foreground text-center">{t("csvFormat")}</p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <Button onClick={() => fileInputRef.current?.click()}>{t("selectFile")}</Button>
                    </div>
                  </CardContent>
                  <CardFooter className="text-xs text-muted-foreground">{t("dataPrivacy")}</CardFooter>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

