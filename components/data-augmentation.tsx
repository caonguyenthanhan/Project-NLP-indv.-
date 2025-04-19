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

export default function DataAugmentation() {
  const t = useTranslations("dataAugmentation")
  const { currentDataset, setCurrentDataset, setCurrentStep, datasets, setDatasets } = useWorkflow()
  const [isLoading, setIsLoading] = useState(false)

  const augmentData = async () => {
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
      const normalizedData = currentDataset.data
        .filter((item: any) => item !== null && item !== undefined)
        .map((item: any) => {
          if (typeof item === "string") {
            return { text: item }
          } else if (Array.isArray(item) && item.length > 0) {
            return { text: item[0] }
          } else if (typeof item === "object" && item !== null) {
            return { text: item.text || "" }
          }
          return null
        })
        .filter((item: any) => item !== null && item.text)

      if (normalizedData.length === 0) {
        toast.error("No valid text data found in dataset")
        return
      }

      const response = await fetch("http://localhost:8000/augment-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          data: normalizedData,
          options: {
            synonym_replacement: true,
            back_translation: true,
            word_shuffling: true
          }
        }),
      })
      if (!response.ok) throw new Error(`Augmentation failed: ${response.status}`)
      const { augmented_data } = await response.json()
      
      // Combine original and augmented data
      const combinedData = [
        ...normalizedData,
        ...augmented_data.map((text: string) => ({ text }))
      ]

      const newDataset = {
        id: uuidv4(),
        name: `Augmented: ${currentDataset.name}`,
        type: "augmented",
        data: combinedData,
        metadata: { 
          ...currentDataset.metadata, 
          size: combinedData.length,
          source: "Data Augmentation",
          createdAt: new Date().toISOString(),
          originalSize: normalizedData.length,
          augmentedSize: augmented_data.length
        },
      }
      setDatasets([...datasets, newDataset])
      setCurrentDataset(newDataset)
      toast.update(toastId, { render: t("success"), type: "success", isLoading: false, autoClose: 3000 })
      setCurrentStep(2)
    } catch (error) {
      console.error("Error in augmentData:", error)
      toast.update(toastId, { render: t("error"), type: "error", isLoading: false, autoClose: 3000 })
    } finally {
      setIsLoading(false)
    }
  }

  const skipAugmentation = () => {
    if (!currentDataset) {
      toast.error(t("noData"))
      return
    }
    setCurrentStep(2)
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
              <p className="text-sm text-muted-foreground mt-2">{t("augmentationDecisionDescription")}</p>
            </div>
          ) : (
            <p className="text-red-500">{t("noData")}</p>
          )}
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          <Button 
            onClick={augmentData} 
            disabled={isLoading || !currentDataset}
            title={t("enterToAugment")}
          >
            {isLoading ? <Loader2 className="animate-spin" /> : t("augment")}
          </Button>
          <Button 
            onClick={skipAugmentation} 
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
