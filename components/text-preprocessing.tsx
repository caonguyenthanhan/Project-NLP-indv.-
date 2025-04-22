// components/text-preprocessing.tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { useWorkflow } from "@/context/workflow-context"
import { v4 as uuidv4 } from "uuid"

export default function TextPreprocessing() {
  const t = useTranslations("textPreprocessing")
  const { currentDataset, setCurrentDataset, setCurrentStep, datasets, setDatasets } = useWorkflow()
  const [isLoading, setIsLoading] = useState(false)

  const preprocessData = async () => {
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
      // Normalize data to ensure we have objects with text property
      const normalizedData = currentDataset.data
        .filter((item: any) => item !== null && item !== undefined)
        .map((item: any) => {
          if (typeof item === "string") {
            return { text: item }
          } else if (Array.isArray(item) && item.length > 0) {
            return { text: item[0] }
          } else if (typeof item === "object" && item !== null) {
            return { text: String(item.text || "") }
          }
          return null
        })
        .filter((item: any) => item !== null && item.text)

      if (normalizedData.length === 0) {
        toast.error("No valid text data found in dataset")
        return
      }

      const response = await fetch("http://localhost:8000/preprocess-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          data: normalizedData,
          options: {
            lowercase: true,
            remove_stopwords: true,
            remove_punctuation: true,
            remove_numbers: true,
            remove_extra_spaces: true,
            lemmatize: true
          }
        }),
      })

      if (!response.ok) {
        throw new Error(`Preprocessing failed: ${response.status}`)
      }

      const result = await response.json()
      if (!result.processed_data || !Array.isArray(result.processed_data)) {
        throw new Error("Invalid response format from server")
      }
      
      const newDataset = {
        id: uuidv4(),
        name: `Preprocessed: ${currentDataset.name}`,
        type: "preprocessed",
        data: result.processed_data,
        metadata: { 
          ...currentDataset.metadata, 
          size: result.processed_data.length,
          source: "Text Preprocessing",
          createdAt: new Date().toISOString()
        },
      }

      setDatasets([...datasets, newDataset])
      setCurrentDataset(newDataset)
      
      // Hiển thị thông báo thành công và chuyển bước
      toast.update(toastId, { 
        render: t("success"), 
        type: "success", 
        isLoading: false, 
        autoClose: 1000,
        onClose: () => {
          setCurrentStep(4) // Chuyển sang bước Representation
        }
      })
    } catch (error) {
      console.error("Error in preprocessData:", error)
      toast.update(toastId, { render: t("error"), type: "error", isLoading: false, autoClose: 3000 })
    } finally {
      setIsLoading(false)
    }
  }

  const skipPreprocessing = () => {
    if (!currentDataset) {
      toast.error(t("noData"))
      return
    }
    setCurrentStep(3)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Enter" && !isLoading && currentDataset) {
      preprocessData()
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
          {currentDataset ? (
            <div>
              <p>{t("datasetSize", { size: currentDataset.metadata?.size || 0 })}</p>
              <p className="text-sm text-muted-foreground mt-2">{t("preprocessDescription")}</p>
            </div>
          ) : (
            <p className="text-red-500">{t("noData")}</p>
          )}
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          <Button 
            onClick={preprocessData} 
            disabled={isLoading || !currentDataset}
            title={t("enterToPreprocess")}
            onKeyDown={handleKeyDown}
          >
            {isLoading ? <Loader2 className="animate-spin" /> : t("preprocess")}
          </Button>
          <Button 
            onClick={skipPreprocessing} 
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