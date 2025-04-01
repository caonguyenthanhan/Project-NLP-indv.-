"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Loader2, ArrowRight } from "lucide-react"
import { useTranslations } from "next-intl"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { useWorkflow } from "@/context/workflow-context"
import { DatasetSelector } from "@/components/dataset-selector"
import { v4 as uuidv4 } from "uuid"

export default function TextPreprocessing() {
  const t = useTranslations("textPreprocessing")
  const common = useTranslations("common")
  const { currentDataset, addDataset, setCurrentStep } = useWorkflow()

  const [isLoading, setIsLoading] = useState(false)

  const [options, setOptions] = useState({
    removeStopwords: true,
    removePunctuation: true,
    removeWhitespace: true,
    lowercase: true,
    stem: true,
    lemmatize: true,
    expandContractions: true,
    correctSpelling: true,
    detectEntities: true,
  })

  const handleOptionChange = (option: keyof typeof options, value: boolean) => {
    setOptions((prev) => ({ ...prev, [option]: value }))
  }

  const preprocessData = async () => {
    if (!currentDataset) {
      toast.error(t("noDataset"))
      return
    }

    setIsLoading(true)
    const toastId = toast.loading(t("processing"))

    try {
      // Real preprocessing using the backend
      const response = await fetch(`http://localhost:8000/preprocess-data`, {
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
        throw new Error(`Failed to preprocess data: ${response.status}`)
      }

      const data = await response.json()

      // Add preprocessed dataset to workflow
      addDataset({
        id: uuidv4(),
        name: `Preprocessed: ${currentDataset.name}`,
        type: "preprocessed",
        data: data.preprocessed_data,
        metadata: {
          source: `Preprocessed from ${currentDataset.name}`,
          createdAt: new Date().toISOString(),
          size: data.preprocessed_data.length,
          originalDataset: currentDataset.id,
          preprocessingOptions: options,
        },
      })

      toast.update(toastId, {
        render: t("preprocessSuccess"),
        type: "success",
        isLoading: false,
        autoClose: 3000,
      })

      // Move to next step
      setTimeout(() => {
        setCurrentStep(4) // Move to text representation step
      }, 1000)
    } catch (error) {
      toast.update(toastId, {
        render: `Error: ${error instanceof Error ? error.message : "Failed to preprocess data"}`,
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

      <DatasetSelector allowedTypes={["raw", "augmented", "cleaned"]} />

      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remove-stopwords"
                  checked={options.removeStopwords}
                  onCheckedChange={(checked) => handleOptionChange("removeStopwords", checked as boolean)}
                />
                <Label htmlFor="remove-stopwords">{t("removeStopwords")}</Label>
              </div>

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
                  id="remove-whitespace"
                  checked={options.removeWhitespace}
                  onCheckedChange={(checked) => handleOptionChange("removeWhitespace", checked as boolean)}
                />
                <Label htmlFor="remove-whitespace">{t("removeWhitespace")}</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="lowercase"
                  checked={options.lowercase}
                  onCheckedChange={(checked) => handleOptionChange("lowercase", checked as boolean)}
                />
                <Label htmlFor="lowercase">{t("lowercase")}</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="stem"
                  checked={options.stem}
                  onCheckedChange={(checked) => handleOptionChange("stem", checked as boolean)}
                />
                <Label htmlFor="stem">{t("stem")}</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="lemmatize"
                  checked={options.lemmatize}
                  onCheckedChange={(checked) => handleOptionChange("lemmatize", checked as boolean)}
                />
                <Label htmlFor="lemmatize">{t("lemmatize")}</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="expand-contractions"
                  checked={options.expandContractions}
                  onCheckedChange={(checked) => handleOptionChange("expandContractions", checked as boolean)}
                />
                <Label htmlFor="expand-contractions">{t("expandContractions")}</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="correct-spelling"
                  checked={options.correctSpelling}
                  onCheckedChange={(checked) => handleOptionChange("correctSpelling", checked as boolean)}
                />
                <Label htmlFor="correct-spelling">{t("correctSpelling")}</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="detect-entities"
                  checked={options.detectEntities}
                  onCheckedChange={(checked) => handleOptionChange("detectEntities", checked as boolean)}
                />
                <Label htmlFor="detect-entities">{t("detectEntities")}</Label>
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
          <Button onClick={preprocessData} disabled={isLoading || !currentDataset}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("processing")}
              </>
            ) : (
              <>
                {t("preprocessAndContinue")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

