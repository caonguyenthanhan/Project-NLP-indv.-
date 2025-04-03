"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { useTranslations } from "next-intl"
import { ToastContainer, toast } from "react-toastify"
import { useWorkflow } from "@/context/workflow-context"
import DatasetSelector from "./dataset-selector"
import { AlertCircle, BarChart } from "lucide-react"
import ModelComparisonChart from "./model-comparison-chart"

export default function TextClassification() {
  const t = useTranslations("textClassification")
  const { currentDataset } = useWorkflow()
  const [task, setTask] = useState("")
  const [modelType, setModelType] = useState("svm")
  const [results, setResults] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [showComparisonChart, setShowComparisonChart] = useState(false)

  // Reset results when dataset or task changes
  useEffect(() => {
    setResults(null)
    setErrorMessage("")
  }, [currentDataset, task])

  const tasks = ["Sentiment Analysis", "Text Classification", "Spam Detection", "Rating Prediction"]

  const taskLabels = {
    "Sentiment Analysis": ["negative", "positive"],
    "Text Classification": ["business", "entertainment", "politics", "sport", "tech"],
    "Spam Detection": ["ham", "spam"],
    "Rating Prediction": ["1", "2", "3", "4", "5"],
  }

  const modelTypes = [
    { id: "naive_bayes", name: "Naive Bayes" },
    { id: "logistic_regression", name: "Logistic Regression" },
    { id: "svm", name: "SVM (Support Vector Machine)" },
  ]

  const compareModels = async () => {
    if (!currentDataset || !task) {
      toast.error(t("noDataOrTask"))
      return
    }
    setIsLoading(true)
    setErrorMessage("")
    const toastId = toast.loading(t("comparing"))
    try {
      const response = await fetch("http://localhost:8000/compare-models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: currentDataset.data,
          task,
          modelType,
          // Send additional info that might help with debugging
          datasetInfo: {
            type: currentDataset.type,
            size: currentDataset.metadata.size,
            name: currentDataset.name,
          },
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || `Comparison failed: ${response.status}`)
      }

      const data = await response.json()
      setResults(data)
      toast.update(toastId, { render: t("success"), type: "success", isLoading: false, autoClose: 3000 })
    } catch (error) {
      console.error("Model comparison error:", error)
      setErrorMessage(error.message || "Unknown error occurred")
      toast.update(toastId, {
        render: `Error: ${error.message || "Unknown error"}`,
        type: "error",
        isLoading: false,
        autoClose: 5000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Helper function to get the label from prediction
  const getPredictionLabel = (prediction) => {
    if (!prediction) return "Unknown"

    if (taskLabels[task]) {
      const predIndex = Number.parseInt(prediction)
      if (!isNaN(predIndex) && predIndex >= 0 && predIndex < taskLabels[task].length) {
        return taskLabels[task][predIndex]
      }
    }

    return prediction
  }

  return (
    <div className="space-y-6">
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />

      <DatasetSelector allowedTypes={["raw", "augmented", "cleaned", "preprocessed", "represented"]} />

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">{t("title")}</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowComparisonChart(!showComparisonChart)}
          className="flex items-center gap-2"
        >
          <BarChart className="h-4 w-4" />
          {showComparisonChart ? t("hideComparisonChart") : t("showComparisonChart")}
        </Button>
      </div>

      {showComparisonChart && <ModelComparisonChart />}

      <Card>
        <CardHeader>
          <CardTitle>{t("classifyText")}</CardTitle>
          <CardDescription>{t("classifyDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          {currentDataset ? (
            <>
              <p>
                {t("datasetSize")}: {currentDataset.metadata.size} samples
              </p>

              <div className="mt-4">
                <label className="block text-sm font-medium mb-1">{t("selectTask")}</label>
                <Select onValueChange={setTask} value={task}>
                  <SelectTrigger className="w-full md:w-[280px]">
                    <SelectValue placeholder={t("selectTask")} />
                  </SelectTrigger>
                  <SelectContent>
                    {tasks.map((taskOption) => (
                      <SelectItem key={taskOption} value={taskOption}>
                        {taskOption}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">{t("selectModel")}</h3>
                <RadioGroup value={modelType} onValueChange={setModelType} className="flex flex-col space-y-2">
                  {modelTypes.map((model) => (
                    <div key={model.id} className="flex items-center space-x-2">
                      <RadioGroupItem value={model.id} id={model.id} />
                      <Label htmlFor={model.id}>{model.name}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {errorMessage && (
                <div className="mt-4 p-3 bg-destructive/10 border border-destructive/30 rounded-md flex items-start">
                  <AlertCircle className="h-5 w-5 text-destructive mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-destructive">{t("errorOccurred")}</p>
                    <p className="text-sm mt-1">{errorMessage}</p>
                    <p className="text-sm mt-2">{t("tryDifferentTask")}</p>
                  </div>
                </div>
              )}

              {results && (
                <div className="mt-6 space-y-4">
                  <h3 className="font-medium">{t("results")}</h3>

                  {results.accuracies && (
                    <div className="space-y-3">
                      {Object.entries(results.accuracies).map(([model, accuracy]) => (
                        <div key={model}>
                          <div className="flex justify-between mb-1">
                            <span>{model.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}</span>
                            <span>{Math.round(accuracy * 100)}%</span>
                          </div>
                          <Progress value={accuracy * 100} />
                        </div>
                      ))}
                    </div>
                  )}

                  {results.prediction && (
                    <div className="mt-4 p-4 bg-muted/30 rounded-md">
                      <h4 className="font-medium">{t("prediction")}</h4>
                      <div className="flex flex-col mt-2">
                        <div className="flex items-start mt-2">
                          <span className="font-medium mr-2 whitespace-nowrap">{t("inputText")}:</span>
                          <span className="text-sm">{currentDataset.data[0]?.text.substring(0, 100)}...</span>
                        </div>
                        <div className="flex items-center mt-3">
                          <span className="font-medium mr-2">{t("predictedClass")}:</span>
                          <span className="text-lg font-semibold px-3 py-1 bg-primary/10 rounded-full">
                            {getPredictionLabel(results.prediction)}
                          </span>
                        </div>
                        <div className="mt-3 text-sm text-muted-foreground">
                          {t("predictedUsing")}{" "}
                          <span className="font-medium">
                            {modelTypes.find((m) => m.id === modelType)?.name || modelType}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <p className="text-red-500">{t("noData")}</p>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={compareModels} disabled={isLoading || !currentDataset || !task}>
            {isLoading ? t("comparing") : t("classify")}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

