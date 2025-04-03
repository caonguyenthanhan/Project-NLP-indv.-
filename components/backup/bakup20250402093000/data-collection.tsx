"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, ArrowRight } from "lucide-react"
import { useTranslations } from "next-intl"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { useWorkflow } from "@/context/workflow-context"
import { v4 as uuidv4 } from "uuid"

export default function DataCollection() {
  const t = useTranslations("dataCollection")
  const { addDataset, setCurrentStep, currentDataset } = useWorkflow() // Thêm currentDataset để debug
  const [textInput, setTextInput] = useState("")
  const [urlInput, setUrlInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const datasetsInfo = [
    { name: "IMDB Reviews", labels: "positive/negative", task: "Sentiment Analysis" },
    { name: "News Articles", labels: "4 topics", task: "Text Classification" },
    { name: "Twitter Sentiment", labels: "positive/negative", task: "Sentiment Analysis" },
    { name: "SMS Spam", labels: "spam/ham", task: "Spam Detection" },
    { name: "BBC News", labels: "5 topics", task: "Text Classification" },
    { name: "Yelp Reviews", labels: "1-5 stars", task: "Sentiment Analysis, Rating Prediction" },
  ]

  const collectText = async () => {
    if (!textInput) {
      toast.error(t("noText"))
      return
    }
    setIsLoading(true)
    const toastId = toast.loading(t("processing"))
    try {
      const dataset = {
        id: uuidv4(),
        name: "User Input Text",
        type: "raw",
        data: [{ text: textInput }],
        metadata: { source: "User input", createdAt: new Date().toISOString(), size: 1 },
      }
      addDataset(dataset)
      console.log("Dataset saved:", dataset) // Debug
      toast.update(toastId, { render: t("success"), type: "success", isLoading: false, autoClose: 3000 })
      setCurrentStep(1)
    } catch (error) {
      console.error("Error in collectText:", error)
      toast.update(toastId, { render: t("error"), type: "error", isLoading: false, autoClose: 3000 })
    } finally {
      setIsLoading(false)
    }
  }

  const collectUrl = async () => {
    if (!urlInput) {
      toast.error(t("noUrl"))
      return
    }
    setIsLoading(true)
    const toastId = toast.loading(t("scraping"))
    try {
      const response = await fetch("http://localhost:8000/scrape-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlInput }),
      })
      if (!response.ok) throw new Error(`Scraping failed: ${response.status}`)
      const { data } = await response.json()
      if (!data || data.length === 0) throw new Error("No data scraped")
      const dataset = {
        id: uuidv4(),
        name: `Scraped from ${urlInput}`,
        type: "raw",
        data: data.map(text => ({ text })),
        metadata: { source: urlInput, createdAt: new Date().toISOString(), size: data.length },
      }
      addDataset(dataset)
      console.log("Dataset saved:", dataset) // Debug
      toast.update(toastId, { render: t("success"), type: "success", isLoading: false, autoClose: 3000 })
      setCurrentStep(1)
    } catch (error) {
      console.error("Error in collectUrl:", error)
      toast.update(toastId, { render: `Error: ${error.message}`, type: "error", isLoading: false, autoClose: 3000 })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <ToastContainer />
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="text">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="text">{t("inputText")}</TabsTrigger>
              <TabsTrigger value="url">{t("inputUrl")}</TabsTrigger>
            </TabsList>
            <TabsContent value="text" className="mt-4">
              <Input value={textInput} onChange={e => setTextInput(e.target.value)} placeholder={t("enterText")} />
              <Button onClick={collectText} disabled={isLoading} className="mt-4">
                {isLoading ? <Loader2 className="animate-spin" /> : t("collect")}
              </Button>
            </TabsContent>
            <TabsContent value="url" className="mt-4">
              <Input value={urlInput} onChange={e => setUrlInput(e.target.value)} placeholder={t("enterUrl")} />
              <Button onClick={collectUrl} disabled={isLoading} className="mt-4">
                {isLoading ? <Loader2 className="animate-spin" /> : t("scrape")}
              </Button>
            </TabsContent>
          </Tabs>
          <div className="mt-6">
            <h3 className="font-medium">{t("publicDatasets")}</h3>
            <table className="w-full text-sm mt-2">
              <thead>
                <tr className="bg-muted"><th>Name</th><th>Labels</th><th>Task</th></tr>
              </thead>
              <tbody>
                {datasetsInfo.map(d => (
                  <tr key={d.name}><td>{d.name}</td><td>{d.labels}</td><td>{d.task}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}