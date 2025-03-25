"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Upload, Download } from 'lucide-react'
import { useTranslations } from "next-intl"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { ToastContainer, toast } from 'react-toastify' // Thêm import cho react-toastify
import 'react-toastify/dist/ReactToastify.css' // Import CSS cho toast

export default function TextClassification() {
  const t = useTranslations("textClassification")
  const common = useTranslations("common")

  const [selectedAlgorithm, setSelectedAlgorithm] = useState("naive-bayes")
  const [selectedDataset, setSelectedDataset] = useState("nonman")
  const [isTraining, setIsTraining] = useState(false)
  const [isTrained, setIsTrained] = useState(false)
  const [testText, setTestText] = useState("")
  const [isPredicting, setIsPredicting] = useState(false)
  const [predictionResult, setPredictionResult] = useState<string | null>(null)
  const [predictionConfidence, setPredictionConfidence] = useState<number | null>(null)

  // Algorithm-specific parameters
  const [naiveBayesParams, setNaiveBayesParams] = useState({
    alpha: 1.0,
    fitPrior: true,
  })

  const [logisticRegressionParams, setLogisticRegressionParams] = useState({
    C: 1.0,
    maxIter: 100,
    penalty: "l2",
  })

  const [svmParams, setSvmParams] = useState({
    C: 1.0,
    kernel: "linear",
    gamma: "scale",
  })

  const [knnParams, setKnnParams] = useState({
    k: 5,
    weights: "uniform",
    algorithm: "auto",
  })

  const [decisionTreeParams, setDecisionTreeParams] = useState({
    maxDepth: 5,
    criterion: "gini",
    minSamplesSplit: 2,
  })

  // Mock metrics
  const [metrics, setMetrics] = useState({
    accuracy: 0,
    precision: 0,
    recall: 0,
    f1: 0,
  })

  // Mock confusion matrix
  const [confusionMatrix, setConfusionMatrix] = useState<number[][]>([])

  // Mock class distribution
  const [classDistribution, setClassDistribution] = useState<{ name: string; value: number }[]>([])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedDataset(file.name)
      console.log("File uploaded:", file)
    }
  }

  const handleTrainModel = async () => {
    if (!selectedDataset) {
      toast.error(t("noDatasetSelected")) // Thông báo lỗi nếu chưa chọn dataset
      return
    }
  

    setIsTraining(true)
    const toastId = toast.loading(t("training")) // Hiển thị thông báo đang huấn luyện

    try {
      const fileInput = document.getElementById("file-upload") as HTMLInputElement
      const file = fileInput.files?.[0]
      if (!file) {
        throw new Error("No file selected")
      }

      const formData = new FormData()
      formData.append("file", file)
      formData.append("algorithm", selectedAlgorithm)
      formData.append("alpha", naiveBayesParams.alpha.toString())

      const response = await fetch("http://localhost:8000/train", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Training failed")
      }

      const result = await response.json()
      setMetrics({ accuracy: result.metrics.accuracy, precision: 0, recall: 0, f1: 0 })
      setConfusionMatrix(result.confusion_matrix)
      setIsTrained(true)

      toast.update(toastId, {
        render: t("trainSuccess"), // Thông báo thành công
        type: "success",
        isLoading: false,
        autoClose: 3000,
      })
    } catch (error) {
      toast.update(toastId, {
        render: `Error: ${error.message}`,
        type: "error",
        isLoading: false,
        autoClose: 3000,
      })
    } finally {
      setIsTraining(false)
    }
  }

  const handlePredict = async () => {
    if (!testText.trim()) return

    setIsPredicting(true)
    try {
      const response = await fetch("http://localhost:8000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: testText }),
      })
      const result = await response.json()

      setPredictionResult(result.prediction)
      setPredictionConfidence(result.confidence)
    } catch (error) {
      console.error("Prediction failed:", error)
    } finally {
      setIsPredicting(false)
    }
  }

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"]

  return (
    <div className="space-y-6">
      {/* Thêm ToastContainer để hiển thị thông báo */}
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />

      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="naive-bayes" onValueChange={setSelectedAlgorithm}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="naive-bayes">{t("naiveBayes")}</TabsTrigger>
              <TabsTrigger value="logistic-regression">{t("logisticRegression")}</TabsTrigger>
              <TabsTrigger value="svm">{t("svm")}</TabsTrigger>
              <TabsTrigger value="knn">{t("knn")}</TabsTrigger>
              <TabsTrigger value="decision-tree">{t("decisionTree")}</TabsTrigger>
            </TabsList>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              {/* Left column - Dataset and Parameters */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">{t("dataset")}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="dataset-select">{t("selectDataset")}</Label>
                      <Select value={selectedDataset} onValueChange={setSelectedDataset}>
                        <SelectTrigger id="dataset-select">
                          <SelectValue placeholder={t("selectDataset")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="imdb">IMDB Reviews</SelectItem>
                          <SelectItem value="news">AG News</SelectItem>
                          <SelectItem value="twitter">Twitter Sentiment</SelectItem>
                          <SelectItem value="sms">SMS Spam</SelectItem>
                          <SelectItem value="bbc">BBC News</SelectItem>
                          <SelectItem value="yelp">Yelp Reviews</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="file-upload">{t("uploadDataset")}</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="file-upload"
                          type="file"
                          accept=".csv,.txt"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        <Button
                          variant="outline"
                          onClick={() => document.getElementById("file-upload")?.click()}
                          className="w-full"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {t("uploadFile")}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">{t("parameters")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedAlgorithm === "naive-bayes" && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Label htmlFor="alpha">Alpha (Smoothing)</Label>
                            <span className="text-sm text-muted-foreground">{naiveBayesParams.alpha}</span>
                          </div>
                          <Slider
                            id="alpha"
                            min={0.01}
                            max={2}
                            step={0.01}
                            value={[naiveBayesParams.alpha]}
                            // onValueChange={(value) =>
                            //   setNaiveBayesParams({ ...naiveBayesParams, alpha: value[0] })
                            // }
                            // value={[alpha]}
                            onValueChange={(value) => setAlpha(value[0])}

                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="fit-prior"
                            checked={naiveBayesParams.fitPrior}
                            onCheckedChange={(checked) =>
                              setNaiveBayesParams({ ...naiveBayesParams, fitPrior: checked as boolean })
                            }
                          />
                          <Label htmlFor="fit-prior">Learn class prior probabilities</Label>
                        </div>
                      </div>
                    )}
                    {/* ... (parameters cho các thuật toán khác giữ nguyên) */}
                    <Button onClick={handleTrainModel} disabled={isTraining || !selectedDataset} className="w-full mt-4">
                      {isTraining ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t("training")}
                        </>
                      ) : (
                        t("trainModel")
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Middle column - Results */}
              <div className="space-y-6">
                {isTrained ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">{t("results")}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label>{t("accuracy")}</Label>
                          <div className="text-2xl font-bold">{(metrics.accuracy * 100).toFixed(2)}%</div>
                        </div>
                        {/* ... (các metrics khác giữ nguyên) */}
                      </div>
                      <div className="space-y-2">
                        <Label>{t("confusionMatrix")}</Label>
                        <div className="border rounded-md p-4">
                          <div className="grid grid-cols-2 gap-2 text-center">
                            <div className="font-medium">{t("predictedPositive")}</div>
                            <div className="font-medium">{t("predictedNegative")}</div>
                            <div className="bg-green-100 p-2 rounded">
                              {confusionMatrix[0]?.[0] || 0} <span className="text-xs">({t("truePositive")})</span>
                            </div>
                            <div className="bg-red-100 p-2 rounded">
                              {confusionMatrix[0]?.[1] || 0} <span className="text-xs">({t("falseNegative")})</span>
                            </div>
                            {/* ... (confusion matrix giữ nguyên) */}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>{t("classDistribution")}</Label>
                        <div className="h-[200px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={classDistribution}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              >
                                {classDistribution.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                      <Button variant="outline" className="w-full">
                        <Download className="h-4 w-4 mr-2" />
                        {t("downloadModel")}
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center text-muted-foreground">
                      {t("trainModelToSeeResults")}
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Right column - Prediction */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">{t("prediction")}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="test-text">{t("enterText")}</Label>
                      <Textarea
                        id="test-text"
                        value={testText}
                        onChange={(e) => setTestText(e.target.value)}
                        placeholder={t("enterTextPlaceholder")}
                        className="min-h-[150px]"
                        disabled={!isTrained}
                      />
                    </div>
                    <Button
                      onClick={handlePredict}
                      disabled={isPredicting || !isTrained || !testText.trim()}
                      className="w-full"
                    >
                      {isPredicting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t("predicting")}
                        </>
                      ) : (
                        t("predict")
                      )}
                    </Button>
                    {predictionResult && (
                      <div className="space-y-4 mt-4">
                        <div className="p-4 border rounded-md bg-muted">
                          <div className="space-y-2">
                            <Label>{t("prediction")}</Label>
                            <div className="text-2xl font-bold">{predictionResult}</div>
                          </div>
                          {predictionConfidence !== null && (
                            <div className="mt-2">
                              <Label>{t("confidence")}</Label>
                              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                                <div
                                  className="bg-primary h-2.5 rounded-full"
                                  style={{ width: `${predictionConfidence * 100}%` }}
                                ></div>
                              </div>
                              <div className="text-right text-sm mt-1">
                                {(predictionConfidence * 100).toFixed(2)}%
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                {isTrained && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">{t("batchPrediction")}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="batch-file">{t("uploadTestFile")}</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="batch-file"
                            type="file"
                            accept=".csv,.txt"
                            className="hidden"
                          />
                          <Button
                            variant="outline"
                            onClick={() => document.getElementById("batch-file")?.click()}
                            className="w-full"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            {t("uploadFile")}
                          </Button>
                        </div>
                      </div>
                      <Button variant="secondary" className="w-full">
                        {t("runBatchPrediction")}
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}