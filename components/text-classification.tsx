"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTranslations } from "next-intl"
import { ToastContainer, toast } from "react-toastify"
import { useWorkflow } from "@/context/workflow-context"

export default function TextClassification() {
  const t = useTranslations("textClassification")
  const { currentDataset } = useWorkflow()
  const [task, setTask] = useState("")
  const [results, setResults] = useState(null)

  const tasks = [
    "Sentiment Analysis",
    "Text Classification",
    "Spam Detection",
    "Rating Prediction",
  ]

  const compareModels = async () => {
    if (!currentDataset || !task) {
      toast.error(t("noDataOrTask"))
      return
    }
    const toastId = toast.loading(t("comparing"))
    try {
      const response = await fetch("http://localhost:8000/compare-models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: currentDataset.data, task }),
      })
      if (!response.ok) throw new Error(`Comparison failed: ${response.status}`)
      const data = await response.json()
      setResults(data)
      toast.update(toastId, { render: t("success"), type: "success", isLoading: false, autoClose: 3000 })
    } catch (error) {
      toast.update(toastId, { render: `Error: ${error.message}`, type: "error", isLoading: false, autoClose: 3000 })
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
          <Select onValueChange={setTask}>
            <SelectTrigger>
              <SelectValue placeholder={t("selectTask")} />
            </SelectTrigger>
            <SelectContent>
              {tasks.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          {results && (
            <div className="mt-4">
              <h3 className="font-medium">{t("results")}</h3>
              <p>Naive Bayes: {results.naive_bayes_accuracy.toFixed(4)}</p>
              <p>Logistic Regression: {results.logistic_accuracy.toFixed(4)}</p>
              <p>SVM: {results.svm_accuracy.toFixed(4)}</p>
              <p>Prediction: {results.prediction}</p>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={compareModels} disabled={!currentDataset || !task}>{t("compare")}</Button>
        </CardFooter>
      </Card>
    </div>
  )
}