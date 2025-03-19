// công cụ phân loại văn bản (Text Classification)
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

export default function TextClassification() {
  const t = useTranslations("textClassification")
  const common = useTranslations("common")

  const [selectedAlgorithm, setSelectedAlgorithm] = useState("naive-bayes")
  const [selectedDataset, setSelectedDataset] = useState("")
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
    // Handle file upload logic here
    console.log("File uploaded:", e.target.files?.[0])
    // In a real app, you would process the file here
  }

  const handleTrainModel = () => {
    setIsTraining(true)

    // Simulate training delay
    setTimeout(() => {
      // Mock training results
      setMetrics({
        accuracy: Math.random() * 0.3 + 0.7, // Random value between 0.7 and 1.0
        precision: Math.random() * 0.3 + 0.7,
        recall: Math.random() * 0.3 + 0.7,
        f1: Math.random() * 0.3 + 0.7,
      })

      // Mock confusion matrix for binary classification
      setConfusionMatrix([
        [Math.floor(Math.random() * 100 + 200), Math.floor(Math.random() * 50)],
        [Math.floor(Math.random() * 50), Math.floor(Math.random() * 100 + 200)],
      ])

      // Mock class distribution
      setClassDistribution([
        { name: "Positive", value: Math.floor(Math.random() * 300 + 200) },
        { name: "Negative", value: Math.floor(Math.random() * 300 + 200) },
      ])

      setIsTraining(false)
      setIsTrained(true)
    }, 2000)
  }

  const handlePredict = () => {
    if (!testText.trim()) return

    setIsPredicting(true)

    // Simulate prediction delay
    setTimeout(() => {
      // Mock prediction result
      const result = Math.random() > 0.5 ? "Positive" : "Negative"
      const confidence = Math.random() * 0.3 + 0.7 // Random value between 0.7 and 1.0

      setPredictionResult(result)
      setPredictionConfidence(confidence)
      setIsPredicting(false)
    }, 1000)
  }

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"]

  return (
    <div className="space-y-6">
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
                    {/* Naive Bayes Parameters */}
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
                            onValueChange={(value) =>
                              setNaiveBayesParams({ ...naiveBayesParams, alpha: value[0] })
                            }
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

                    {/* Logistic Regression Parameters */}
                    {selectedAlgorithm === "logistic-regression" && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Label htmlFor="c-param">C (Regularization)</Label>
                            <span className="text-sm text-muted-foreground">{logisticRegressionParams.C}</span>
                          </div>
                          <Slider
                            id="c-param"
                            min={0.1}
                            max={10}
                            step={0.1}
                            value={[logisticRegressionParams.C]}
                            onValueChange={(value) =>
                              setLogisticRegressionParams({ ...logisticRegressionParams, C: value[0] })
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Label htmlFor="max-iter">Max Iterations</Label>
                            <span className="text-sm text-muted-foreground">{logisticRegressionParams.maxIter}</span>
                          </div>
                          <Slider
                            id="max-iter"
                            min={10}
                            max={1000}
                            step={10}
                            value={[logisticRegressionParams.maxIter]}
                            onValueChange={(value) =>
                              setLogisticRegressionParams({ ...logisticRegressionParams, maxIter: value[0] })
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="penalty">Penalty</Label>
                          <Select
                            value={logisticRegressionParams.penalty}
                            onValueChange={(value) =>
                              setLogisticRegressionParams({ ...logisticRegressionParams, penalty: value })
                            }
                          >
                            <SelectTrigger id="penalty">
                              <SelectValue placeholder="Select penalty" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="l1">L1</SelectItem>
                              <SelectItem value="l2">L2</SelectItem>
                              <SelectItem value="elasticnet">Elastic Net</SelectItem>
                              <SelectItem value="none">None</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    {/* SVM Parameters */}
                    {selectedAlgorithm === "svm" && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Label htmlFor="c-param-svm">C (Regularization)</Label>
                            <span className="text-sm text-muted-foreground">{svmParams.C}</span>
                          </div>
                          <Slider
                            id="c-param-svm"
                            min={0.1}
                            max={10}
                            step={0.1}
                            value={[svmParams.C]}
                            onValueChange={(value) => setSvmParams({ ...svmParams, C: value[0] })}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="kernel">Kernel</Label>
                          <Select value={svmParams.kernel} onValueChange={(value) => setSvmParams({ ...svmParams, kernel: value })}>
                            <SelectTrigger id="kernel">
                              <SelectValue placeholder="Select kernel" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="linear">Linear</SelectItem>
                              <SelectItem value="poly">Polynomial</SelectItem>
                              <SelectItem value="rbf">RBF</SelectItem>
                              <SelectItem value="sigmoid">Sigmoid</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="gamma">Gamma</Label>
                          <Select value={svmParams.gamma} onValueChange={(value) => setSvmParams({ ...svmParams, gamma: value })}>
                            <SelectTrigger id="gamma">
                              <SelectValue placeholder="Select gamma" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="scale">Scale</SelectItem>
                              <SelectItem value="auto">Auto</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    {/* KNN Parameters */}
                    {selectedAlgorithm === "knn" && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Label htmlFor="k-param">k (Neighbors)</Label>
                            <span className="text-sm text-muted-foreground">{knnParams.k}</span>
                          </div>
                          <Slider
                            id="k-param"
                            min={1}
                            max={20}
                            step={1}
                            value={[knnParams.k]}
                            onValueChange={(value) => setKnnParams({ ...knnParams, k: value[0] })}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="weights">Weights</Label>
                          <Select value={knnParams.weights} onValueChange={(value) => setKnnParams({ ...knnParams, weights: value })}>
                            <SelectTrigger id="weights">
                              <SelectValue placeholder="Select weights" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="uniform">Uniform</SelectItem>
                              <SelectItem value="distance">Distance</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="algorithm">Algorithm</Label>
                          <Select value={knnParams.algorithm} onValueChange={(value) => setKnnParams({ ...knnParams, algorithm: value })}>
                            <SelectTrigger id="algorithm">
                              <SelectValue placeholder="Select algorithm" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="auto">Auto</SelectItem>
                              <SelectItem value="ball_tree">Ball Tree</SelectItem>
                              <SelectItem value="kd_tree">KD Tree</SelectItem>
                              <SelectItem value="brute">Brute Force</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    {/* Decision Tree Parameters */}
                    {selectedAlgorithm === "decision-tree" && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Label htmlFor="max-depth">Max Depth</Label>
                            <span className="text-sm text-muted-foreground">{decisionTreeParams.maxDepth}</span>
                          </div>
                          <Slider
                            id="max-depth"
                            min={1}
                            max={20}
                            step={1}
                            value={[decisionTreeParams.maxDepth]}
                            onValueChange={(value) =>
                              setDecisionTreeParams({ ...decisionTreeParams, maxDepth: value[0] })
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="criterion">Criterion</Label>
                          <Select
                            value={decisionTreeParams.criterion}
                            onValueChange={(value) =>
                              setDecisionTreeParams({ ...decisionTreeParams, criterion: value })
                            }
                          >
                            <SelectTrigger id="criterion">
                              <SelectValue placeholder="Select criterion" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="gini">Gini</SelectItem>
                              <SelectItem value="entropy">Entropy</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Label htmlFor="min-samples-split">Min Samples Split</Label>
                            <span className="text-sm text-muted-foreground">{decisionTreeParams.minSamplesSplit}</span>
                          </div>
                          <Slider
                            id="min-samples-split"
                            min={2}
                            max={10}
                            step={1}
                            value={[decisionTreeParams.minSamplesSplit]}
                            onValueChange={(value) =>
                              setDecisionTreeParams({ ...decisionTreeParams, minSamplesSplit: value[0] })
                            }
                          />
                        </div>
                      </div>
                    )}

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
                        <div className="space-y-1">
                          <Label>{t("precision")}</Label>
                          <div className="text-2xl font-bold">{(metrics.precision * 100).toFixed(2)}%</div>
                        </div>
                        <div className="space-y-1">
                          <Label>{t("recall")}</Label>
                          <div className="text-2xl font-bold">{(metrics.recall * 100).toFixed(2)}%</div>
                        </div>
                        <div className="space-y-1">
                          <Label>{t("f1Score")}</Label>
                          <div className="text-2xl font-bold">{(metrics.f1 * 100).toFixed(2)}%</div>
                        </div>
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
                            <div className="bg-red-100 p-2 rounded">
                              {confusionMatrix[1]?.[0] || 0} <span className="text-xs">({t("falsePositive")})</span>
                            </div>
                            <div className="bg-green-100 p-2 rounded">
                              {confusionMatrix[1]?.[1] || 0} <span className="text-xs">({t("trueNegative")})</span>
                            </div>
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
