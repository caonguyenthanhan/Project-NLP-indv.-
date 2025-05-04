"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { useTranslations } from "next-intl"
import { ToastContainer, toast } from "react-toastify"
import { useWorkflow } from "@/context/workflow-context"
import { AlertCircle, BarChart, RefreshCw, Loader2 } from "lucide-react"
import ModelComparisonChart from "./model-comparison-chart"
import Image from "next/image"
import { useToast } from "@/components/ui/use-toast"
import { Dataset } from "../types/dataset"
import { ToastAction } from "@/components/ui/toast"

interface PredictionResult {
  text: string;
  prediction: string;
  confidence: number | null;
  raw_prediction: number;
}

interface ClassificationResults {
  predictions: PredictionResult[];
  raw_predictions: number[];
  confidence_scores: number[] | null;
  input_texts: string[];
  model_info: {
    dataset: string;
    model: string;
    task: string;
  };
}

interface TaskLabels {
  [key: string]: string[]
}

const taskLabels: TaskLabels = {
  "Sentiment Analysis": ["negative", "positive"],
  "Text Classification": ["business", "entertainment", "politics", "sport", "tech"],
  "Spam Detection": ["ham", "spam"],
  "Rating Prediction": ["1", "2", "3", "4", "5"]
}

const TextClassification: React.FC = () => {
  const t = useTranslations("textClassification")
  const { currentDataset, setCurrentDataset, setCurrentStep, datasets, setDatasets } = useWorkflow()
  const [task, setTask] = useState("Text Classification")
  const [modelType, setModelType] = useState("svm")
  const [results, setResults] = useState<ClassificationResults | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [showComparisonChart, setShowComparisonChart] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [isImageLoading, setIsImageLoading] = useState(false)
  const [imageError, setImageError] = useState<string | null>(null)
  const [isRetraining, setIsRetraining] = useState(false)
  const { toast } = useToast()

  // Load model comparison image
  useEffect(() => {
    if (showComparisonChart) {
      setIsImageLoading(true)
      setImageError(null)
      fetch("http://localhost:8000/model-comparison-image")
        .then(response => {
          if (!response.ok) {
            throw new Error("Failed to load image")
          }
          return response.blob()
        })
        .then(blob => {
          const url = URL.createObjectURL(blob)
          setImageUrl(url)
        })
        .catch(error => {
          console.error("Error loading image:", error)
          setImageError(error.message)
          toast({
            variant: "destructive",
            description: t("imageLoadError"),
          })
        })
        .finally(() => {
          setIsImageLoading(false)
        })
    }

    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl)
      }
    }
  }, [showComparisonChart])

  // Reset results when dataset or task changes
  useEffect(() => {
    setResults(null)
    setErrorMessage("")
  }, [currentDataset, task])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !isLoading && currentDataset) {
        classifyData()
      } else if (e.key === "Backspace" && currentDataset) {
        setCurrentStep(4)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isLoading, currentDataset])

  const tasks = ["Sentiment Analysis", "Text Classification", "Spam Detection", "Rating Prediction"]

  const modelTypes = [
    { id: "naive_bayes", name: "Naive Bayes" },
    { id: "logistic_regression", name: "Logistic Regression" },
    { id: "svm", name: "SVM (Support Vector Machine)" },
  ]

  const handleRetrain = async () => {
    setIsRetraining(true)
    try {
      const response = await fetch("http://localhost:8000/retrain-models", {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Retraining failed")
      }

      const data = await response.json()
      toast({
        description: data.message
      })

      // Update image path after retraining
      setImageUrl(data.imagePath)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      toast({
        variant: "destructive",
        description: message,
        action: <ToastAction altText="Try again">{t("tryAgain")}</ToastAction>
      })
    } finally {
      setIsRetraining(false)
    }
  }

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
          datasetInfo: {
            type: currentDataset.type,
            size: currentDataset.metadata.size,
            name: currentDataset.name,
          },
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.detail || `Error: ${response.status}`
        
        // Handle specific error cases
        if (response.status === 404) {
          if (errorMessage.includes("Vectorizer not found") || errorMessage.includes("Model not found")) {
            setErrorMessage(t("modelNotFound"))
            toast.update(toastId, {
              render: t("modelNotFound"),
              type: "error",
              isLoading: false,
              autoClose: 5000,
            })
            return
          }
        }
        
        throw new Error(errorMessage)
      }

      const data = await response.json()
      setResults(data)
      toast.update(toastId, { 
        render: t("success"), 
        type: "success", 
        isLoading: false, 
        autoClose: 3000 
      })
    } catch (error) {
      console.error("Model comparison error:", error)
      setErrorMessage(error.message || t("unknownError"))
      toast.update(toastId, {
        render: error.message || t("unknownError"),
        type: "error",
        isLoading: false,
        autoClose: 5000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Helper function to get the label from prediction
  const getPredictionLabel = (prediction: any, task: string): string => {
    if (prediction === undefined || prediction === null) return "Unknown";

    switch (task) {
      case "Sentiment Analysis":
        return prediction === 1 ? "Positive" : "Negative";
      case "Text Classification":
        const newsLabels = {
          0: "Business",
          1: "Entertainment",
          2: "Politics",
          3: "Sport",
          4: "Tech"
        };
        return newsLabels[prediction] || "Unknown";
      case "Spam Detection":
        return prediction === 1 ? "Spam" : "Ham";
      case "Rating Prediction":
        return `${prediction + 1} stars`;
      default:
        return String(prediction);
    }
  }

  const handleContinue = () => {
    classifyData()
  }

  const handleBack = () => {
    setCurrentStep(4)
  }

  const classifyData = async () => {
    if (!currentDataset) return;

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8000/classify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: currentDataset.data,
          modelType: modelType,
          task: task
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to classify data');
      }

      const result = await response.json();
      
      // Update results with proper label mapping
      const updatedResults: ClassificationResults = {
        ...result,
        predictions: result.predictions.map((pred: string, idx: number) => ({
          text: result.input_texts[idx],
          prediction: pred,
          confidence: result.confidence_scores ? result.confidence_scores[idx] : null,
          raw_prediction: result.raw_predictions[idx]
        }))
      };
      
      setResults(updatedResults);
      
      // Show success toast
      toast({
        description: t("classificationComplete", { 
          model: modelType, 
          accuracy: updatedResults.confidence_scores ? 
            `${(Math.max(...updatedResults.confidence_scores) * 100).toFixed(2)}%` : 
            'N/A'
        })
      });
    } catch (err) {
      console.error("Classification error:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setErrorMessage(errorMessage || t("unknownError"));
      
      // Show error toast
      toast({
        variant: "destructive",
        description: errorMessage || t("unknownError"),
        action: <ToastAction altText="Try again">{t("tryAgain")}</ToastAction>
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Enter" && !isLoading && currentDataset) {
      classifyData()
    }
  }

  return (
    <div className="space-y-6">
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />

      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold">{t("title")}</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetrain}
            disabled={isRetraining}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRetraining ? "animate-spin" : ""}`} />
            {isRetraining ? t("retraining") : t("retrain")}
          </Button>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowComparisonChart(!showComparisonChart)}
          disabled={isImageLoading}
          className="flex items-center gap-2"
        >
          <BarChart className="h-4 w-4" />
          {showComparisonChart ? t("hideComparisonChart") : t("showComparisonChart")}
        </Button>
      </div>

      {showComparisonChart && (
        <div className="w-full h-[400px] relative mb-4">
          {isImageLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : imageError ? (
            <div className="flex items-center justify-center h-full text-destructive">
              <AlertCircle className="h-8 w-8 mr-2" />
              <span>{imageError}</span>
            </div>
          ) : imageUrl ? (
            <img
              src={imageUrl}
              alt="Model Comparison Chart"
              className="w-full h-full object-contain"
            />
          ) : null}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t("classifyText")}</CardTitle>
          <CardDescription>{t("classifyDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          {currentDataset ? (
            <>
              <p>
                {t("datasetSize", { size: currentDataset.metadata?.size || 0 })}
              </p>

              <div className="mt-4">
                <label className="block text-sm font-medium mb-1">{t("selectTask")}</label>
                <Select value={task} onValueChange={setTask}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("selectTaskPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {tasks.map((task) => (
                      <SelectItem key={task} value={task}>
                        {task}
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
                <div className="mt-4 p-3 bg-destructive/10 border border-destructive/30 rounded-md">
                  <p className="text-destructive">{errorMessage}</p>
                  <p className="text-sm text-muted-foreground mt-2">{t("tryDifferentTask")}</p>
                </div>
              )}

              {results && (
                <div className="mt-6 space-y-4">
                  {results.predictions && results.predictions.length > 0 && (
                    <div className="mt-4 p-4 bg-muted/30 rounded-md">
                      <h4 className="font-medium">{t("predictions")}</h4>
                      <div className="flex flex-col mt-2 space-y-4">
                        {results.predictions.map((item: any, index: number) => (
                          <div key={index} className="p-3 bg-background rounded-md">
                            <div className="flex items-start">
                              <span className="font-medium mr-2 whitespace-nowrap">{t("inputText")}:</span>
                              <span className="text-sm">
                                {typeof item.text === 'string' ? 
                                  (item.text.substring(0, 100) + (item.text.length > 100 ? "..." : "")) :
                                  "Invalid text format"}
                              </span>
                            </div>
                            <div className="flex items-center mt-2">
                              <span className="font-medium mr-2">{t("predictedClass")}:</span>
                              <span className="text-lg font-semibold px-3 py-1 bg-primary/10 rounded-full">
                                {item.prediction}
                              </span>
                              {item.confidence && (
                                <span className="ml-2 text-sm text-muted-foreground">
                                  ({(item.confidence * 100).toFixed(1)}% confidence)
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {t("rawPrediction")}: {item.raw_prediction}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 text-sm text-muted-foreground">
                        {t("predictedUsing")}{" "}
                        <span className="font-medium">
                          {modelTypes.find((m) => m.id === modelType)?.name || modelType}
                        </span>
                        {" "}{t("onDataset")}{" "}
                        <span className="font-medium">{results.model_info?.dataset}</span>
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
        <CardFooter className="flex justify-end space-x-2">
          <Button 
            onClick={classifyData} 
            disabled={isLoading || !currentDataset}
            title={t("enterToClassify")}
            onKeyDown={handleKeyDown}
          >
            {isLoading ? <Loader2 className="animate-spin" /> : t("classify")}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

export default TextClassification

