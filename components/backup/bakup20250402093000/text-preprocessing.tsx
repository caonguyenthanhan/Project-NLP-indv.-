// components/text-preprocessing.tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { useTranslations } from "next-intl"
import { ToastContainer, toast } from "react-toastify"
import { useWorkflow } from "@/context/workflow-context"
import DatasetSelector from "./dataset-selector" // Thêm import này

export default function TextPreprocessing() {
  const t = useTranslations("textPreprocessing")
  const { currentDataset, addDataset, setCurrentStep } = useWorkflow()
  const [options, setOptions] = useState({
    lowercase: true,
    removeStopwords: true,
    lemmatize: true,
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleOptionChange = (option) => {
    setOptions((prev) => ({ ...prev, [option]: !prev[option] }))
  }

  const preprocessData = async () => {
    if (!currentDataset) {
      toast.error(t("noData"))
      return
    }
    setIsLoading(true)
    const toastId = toast.loading(t("processing"))
    try {
      const response = await fetch("http://localhost:8000/preprocess-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: currentDataset.data, options }),
      })
      if (!response.ok) throw new Error(`Preprocessing failed: ${response.status}`)
      const { preprocessed_data } = await response.json()
      const newDataset = {
        ...currentDataset,
        data: preprocessed_data,
        metadata: { ...currentDataset.metadata, preprocessed: true },
      }
      addDataset(newDataset)
      setCurrentStep(4)
      toast.update(toastId, { render: t("success"), type: "success", isLoading: false, autoClose: 3000 })
    } catch (error) {
      toast.update(toastId, { render: `Error: ${error.message}`, type: "error", isLoading: false, autoClose: 3000 })
    } finally {
      setIsLoading(false)
    }
  }

  const skipPreprocessing = () => {
    if (!currentDataset) {
      toast.error(t("noData"))
      return
    }
    setCurrentStep(4)
  }

  return (
    <div className="space-y-6">
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />

      <DatasetSelector allowedTypes={["raw", "augmented", "cleaned"]} />

      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent>
          {currentDataset ? (
            <>
              <p>{t("datasetSize")}: {currentDataset.metadata.size} samples</p>
              <div className="mt-4 space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="lowercase"
                    checked={options.lowercase}
                    onCheckedChange={() => handleOptionChange("lowercase")}
                  />
                  <label htmlFor="lowercase">{t("lowercase")}</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="removeStopwords"
                    checked={options.removeStopwords}
                    onCheckedChange={() => handleOptionChange("removeStopwords")}
                  />
                  <label htmlFor="removeStopwords">{t("removeStopwords")}</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="lemmatize"
                    checked={options.lemmatize}
                    onCheckedChange={() => handleOptionChange("lemmatize")}
                  />
                  <label htmlFor="lemmatize">{t("lemmatize")}</label>
                </div>
              </div>
            </>
          ) : (
            <p className="text-red-500">{t("noData")}</p>
          )}
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          <Button onClick={preprocessData} disabled={isLoading || !currentDataset}>
            {isLoading ? "Processing..." : t("preprocess")}
          </Button>
          <Button onClick={skipPreprocessing} variant="outline">{t("next")}</Button>
        </CardFooter>
      </Card>
    </div>
  )
}