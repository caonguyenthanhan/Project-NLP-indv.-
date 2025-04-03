// components/data-cleaning.tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { useTranslations } from "next-intl"
import { ToastContainer, toast } from "react-toastify"
import { useWorkflow } from "@/context/workflow-context"
import DatasetSelector from "./dataset-selector" // Đảm bảo đường dẫn đúng

export default function DataCleaning() {
  const t = useTranslations("dataCleaning")
  const { currentDataset, setCurrentStep } = useWorkflow()
  const [selectedDatasetId, setSelectedDatasetId] = useState(currentDataset?.id || "")
  const [isLoading, setIsLoading] = useState(false)

  const cleanData = async () => {
    if (!currentDataset) {
      toast.error(t("noData"))
      return
    }
    setIsLoading(true)
    const toastId = toast.loading(t("processing"))
    try {
      const response = await fetch("http://localhost:8000/clean-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: currentDataset.data }),
      })
      if (!response.ok) throw new Error(`Cleaning failed: ${response.status}`)
      const { cleaned_data } = await response.json()
      const updatedDataset = {
        ...currentDataset,
        data: cleaned_data,
        metadata: { ...currentDataset.metadata, cleaned: true },
      }
      setCurrentStep(3)
      toast.update(toastId, { render: t("success"), type: "success", isLoading: false, autoClose: 3000 })
    } catch (error) {
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
          <DatasetSelector
            value={selectedDatasetId}
            onValueChange={setSelectedDatasetId}
          />
          {currentDataset ? (
            <p>{t("datasetSize")}: {currentDataset.metadata.size} samples</p>
          ) : (
            <p className="text-red-500">{t("noData")}</p>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={cleanData} disabled={isLoading || !currentDataset}>
            {isLoading ? "Cleaning..." : t("clean")}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}