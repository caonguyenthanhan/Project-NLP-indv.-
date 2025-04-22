// components/data-cleaning.tsx
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { useWorkflow } from "@/context/workflow-context"
import { v4 as uuidv4 } from "uuid"

export default function DataCleaning() {
  const t = useTranslations("dataCleaning")
  const { currentDataset, setCurrentDataset, setCurrentStep, datasets, setDatasets } = useWorkflow()
  const [isLoading, setIsLoading] = useState(false)

  const cleanData = async () => {
    if (!currentDataset) {
      toast.error(t("noData"))
      return
    }

    if (!currentDataset.data || !Array.isArray(currentDataset.data)) {
      toast.error("Invalid dataset format")
      return
    }

    setIsLoading(true)
    const toastId = toast.loading(t("processing"))
    try {
      // Extract text from data objects and ensure we have strings
      const textData = currentDataset.data
        .map((item: any) => {
          if (typeof item === "string") {
            return { text: item }
          } else if (typeof item === "object" && item !== null) {
            return { text: String(item.text || "") }
          }
          return { text: "" }
        })
        .filter((item: any) => {
          const text = String(item.text || "")
          return text.trim() !== ""
        })

      if (textData.length === 0) {
        toast.error("No valid text data found in dataset")
        return
      }

      const response = await fetch("http://localhost:8000/clean-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          data: textData,
          options: {
            remove_punctuation: true,
            remove_numbers: true,
            remove_extra_spaces: true,
            remove_symbols: true
          }
        }),
      })
      if (!response.ok) throw new Error(`Cleaning failed: ${response.status}`)
      const { cleaned_data } = await response.json()
      
      const newDataset = {
        id: uuidv4(),
        name: `Cleaned: ${currentDataset.name}`,
        type: "cleaned",
        data: cleaned_data.map((text: string) => ({ text })),
        metadata: { 
          ...currentDataset.metadata, 
          size: cleaned_data.length,
          source: "Data Cleaning",
          createdAt: new Date().toISOString()
        },
      }
      setDatasets([...datasets, newDataset])
      setCurrentDataset(newDataset)
      toast.update(toastId, { render: t("success"), type: "success", isLoading: false, autoClose: 3000 })
      setCurrentStep(3)
    } catch (error) {
      console.error("Error in cleanData:", error)
      toast.update(toastId, { render: t("error"), type: "error", isLoading: false, autoClose: 3000 })
    } finally {
      setIsLoading(false)
    }
  }

  const skipCleaning = () => {
    if (!currentDataset) {
      toast.error(t("noData"))
      return
    }
    setCurrentStep(3)
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !isLoading) {
      cleanData()
    } else if (e.key === "Backspace" && !isLoading) {
      skipCleaning()
    }
  }

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isLoading])

  return (
    <div className="space-y-6">
      <ToastContainer />
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent>
          {currentDataset ? (
            <div>
              <p>{t("datasetSize", { size: currentDataset.metadata?.size || 0 })}</p>
              <p className="text-sm text-muted-foreground mt-2">{t("cleaningDecisionDescription")}</p>
            </div>
          ) : (
            <p className="text-red-500">{t("noData")}</p>
          )}
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          <Button 
            onClick={cleanData} 
            disabled={isLoading || !currentDataset}
            title={t("enterToClean")}
          >
            {isLoading ? <Loader2 className="animate-spin" /> : t("clean")}
          </Button>
          <Button 
            onClick={skipCleaning} 
            variant="outline"
            title={t("backspaceToSkip")}
          >
            {t("next")}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}