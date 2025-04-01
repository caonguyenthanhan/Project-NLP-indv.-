"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { ToastContainer, toast } from "react-toastify"
import { useWorkflow } from "@/context/workflow-context"
import { v4 as uuidv4 } from "uuid"

export default function DataAugmentation() {
  const t = useTranslations("dataAugmentation")
  const { currentDataset, addDataset, setCurrentStep } = useWorkflow()
  const [isLoading, setIsLoading] = useState(false)

  const augmentData = async () => {
    if (!currentDataset) {
      toast.error(t("noData"))
      return
    }
    setIsLoading(true)
    const toastId = toast.loading(t("processing"))
    try {
      const response = await fetch("http://localhost:8000/augment-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: currentDataset.data }),
      })
      if (!response.ok) throw new Error(`Augmentation failed: ${response.status}`)
      const { augmented_data } = await response.json()
      const newDataset = {
        id: uuidv4(),
        name: `Augmented: ${currentDataset.name}`,
        type: "augmented",
        data: [...currentDataset.data, ...augmented_data],
        metadata: { ...currentDataset.metadata, size: currentDataset.data.length + augmented_data.length },
      }
      addDataset(newDataset)
      console.log("Augmented dataset:", newDataset) // Debug
      toast.update(toastId, { render: t("success"), type: "success", isLoading: false, autoClose: 3000 })
      setCurrentStep(2)
    } catch (error) {
      console.error("Error in augmentData:", error)
      toast.update(toastId, { render: `Error: ${error.message}`, type: "error", isLoading: false, autoClose: 3000 })
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
            <p>{t("datasetSize")}: {currentDataset.metadata.size} samples</p>
          ) : (
            <p className="text-red-500">{t("noData")}</p>
          )}
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          <Button onClick={augmentData} disabled={isLoading || !currentDataset}>
            {isLoading ? <Loader2 className="animate-spin" /> : t("augment")}
          </Button>
          <Button onClick={skipAugmentation} variant="outline">{t("next")}</Button>
        </CardFooter>
      </Card>
    </div>
  )
}