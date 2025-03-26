"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, ArrowRight } from "lucide-react"
import { useTranslations } from "next-intl"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { useWorkflow } from "@/context/workflow-context"
import { DatasetSelector } from "@/components/dataset-selector"
import { v4 as uuidv4 } from "uuid"

export default function DataCleaning() {
  const t = useTranslations("dataCleaning")
  const common = useTranslations("common")
  const { currentDataset, addDataset, setCurrentStep } = useWorkflow()

  const [isLoading, setIsLoading] = useState(false)

  const [options, setOptions] = useState({
    removePunctuation: true,
    removeNumbers: true,
    removeExtraSpaces: true,
    removeSymbols: true,
  })

  const handleOptionChange = (option: keyof typeof options, value: boolean) => {
    setOptions((prev) => ({ ...prev, [option]: value }))
  }

  const cleanData = async () => {
    if (!currentDataset) {
      toast.error(t("noDataset"))
      return
    }

    setIsLoading(true)
    const toastId = toast.loading(t("cleaning"))

    try {
      // Real data cleaning using the backend
      const response = await fetch(`http://localhost:8000/clean-data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: currentDataset.data,
          options: options,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to clean data: ${response.status}`)
      }

      const data = await response.json()

      // Add cleaned dataset to workflow
      addDataset({
        id: uuidv4(),
        name: `Cleaned: ${currentDataset.name}`,
        type: "cleaned",
        data: data.cleaned_data,
        metadata: {
          source: `Cleaned from ${currentDataset.name}`,
          createdAt: new Date().toISOString(),
          size: data.cleaned_data.length,
          originalDataset: currentDataset.id,
          cleaningOptions: options,
        },
      })

      toast.update(toastId, {
        render: t("cleanSuccess"),
        type: "success",
        isLoading: false,
        autoClose: 3000,
      })

      // Move to next step
      setTimeout(() => {
        setCurrentStep(3) // Move to preprocessing step
      }, 1000)
    } catch (error) {
      toast.update(toastId, {
        render: `Error: ${error instanceof Error ? error.message : "Failed to clean data"}`,
        type: "error",
        isLoading: false,
        autoClose: 3000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />

      <DatasetSelector allowedTypes={["raw", "augmented"]} />

      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remove-punctuation"
                  checked={options.removePunctuation}
                  onCheckedChange={(checked) => handleOptionChange("removePunctuation", checked as boolean)}
                />
                <Label htmlFor="remove-punctuation">{t("removePunctuation")}</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remove-numbers"
                  checked={options.removeNumbers}
                  onCheckedChange={(checked) => handleOptionChange("removeNumbers", checked as boolean)}
                />
                <Label htmlFor="remove-numbers">{t("removeNumbers")}</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remove-extra-spaces"
                  checked={options.removeExtraSpaces}
                  onCheckedChange={(checked) => handleOptionChange("removeExtraSpaces", checked as boolean)}
                />
                <Label htmlFor="remove-extra-spaces">{t("removeExtraSpaces")}</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remove-symbols"
                  checked={options.removeSymbols}
                  onCheckedChange={(checked) => handleOptionChange("removeSymbols", checked as boolean)}
                />
                <Label htmlFor="remove-symbols">{t("removeSymbols")}</Label>
              </div>
            </div>

            {currentDataset && (
              <div className="border rounded-md p-4 bg-muted/50">
                <h3 className="font-medium mb-2">{t("datasetPreview")}</h3>
                <div className="max-h-[200px] overflow-y-auto">
                  <table className="min-w-full">
                    <thead className="bg-muted sticky top-0">
                      <tr>
                        {Object.keys(currentDataset.data[0]).map((key) => (
                          <th key={key} className="px-4 py-2 text-left font-medium">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {currentDataset.data.slice(0, 5).map((item, index) => (
                        <tr key={index} className={index % 2 === 0 ? "bg-muted/50" : ""}>
                          {Object.values(item).map((value, i) => (
                            <td key={i} className="px-4 py-2 border-t">
                              {typeof value === "string"
                                ? value.substring(0, 50) + (value.length > 50 ? "..." : "")
                                : String(value)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={cleanData} disabled={isLoading || !currentDataset}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("cleaning")}
              </>
            ) : (
              <>
                {t("cleanAndContinue")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

