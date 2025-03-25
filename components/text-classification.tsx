"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslations } from "next-intl";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Loader2, BarChartIcon, PieChartIcon, AlertCircle } from "lucide-react";
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
} from "recharts";

interface TrainingResult {
  accuracy: number;
  confusionMatrix: number[][];
  topFeatures: Array<{ feature: string; importance: number }>;
}

interface DatasetStats {
  totalSamples: number;
  classDistribution: Record<string, number>;
  averageTextLength: number;
}

const BASE_URL = "http://localhost:8000";

export default function TextClassification() {
  const t = useTranslations("textClassification");
  const [selectedAlgorithm, setSelectedAlgorithm] = useState("naive-bayes");
  const [selectedDataset, setSelectedDataset] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [alpha, setAlpha] = useState(1.0);
  const [fitPrior, setFitPrior] = useState(true); // Không sử dụng trong backend hiện tại
  const [prediction, setPrediction] = useState("");
  const [textInput, setTextInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);
  const [trainingResult, setTrainingResult] = useState<TrainingResult | null>(null);
  const [datasetStats, setDatasetStats] = useState<DatasetStats | null>(null);
  const [predictionHistory, setPredictionHistory] = useState<Array<{ text: string; prediction: string }>>([]);
  const [visualizationTab, setVisualizationTab] = useState("accuracy");
  const [logs, setLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(false);

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      analyzeDataset(selectedFile);
    }
  };

  const displayLogs = (newLogs: string[]) => {
    if (newLogs && newLogs.length > 0) {
      setLogs((prev) => [...prev, ...newLogs]);
      newLogs.forEach((log) => {
        console.log(`[Server Log] ${log}`);
        toast.info(log, { autoClose: 2000 });
      });
    }
  };

  const analyzeDataset = async (file: File) => {
    setIsLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${BASE_URL}/dataset-stats`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        displayLogs(data.logs || []);
        throw new Error(data.message || `Failed to analyze dataset (Status: ${response.status})`);
      }

      setDatasetStats({
        totalSamples: data.total_samples,
        classDistribution: data.class_distribution,
        averageTextLength: data.average_text_length,
      });
      displayLogs(data.logs || []);
      toast.success("Dataset analyzed successfully");
    } catch (error: any) {
      console.error("Analyze dataset error:", error);
      toast.error(`Error analyzing dataset: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTrainModel = async () => {
    if (!file) {
      toast.error(t("noFileSelected"));
      return;
    }

    setIsTraining(true);
    const toastId = toast.loading(t("trainingModel"));

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("algorithm", selectedAlgorithm);
      formData.append("alpha", alpha.toString());

      const response = await fetch(`${BASE_URL}/train`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        displayLogs(data.logs || []);
        throw new Error(data.message || `Failed to train model (Status: ${response.status})`);
      }

      setTrainingResult({
        accuracy: data.accuracy,
        confusionMatrix: data.confusion_matrix,
        topFeatures: data.top_features,
      });
      displayLogs(data.logs || []);

      toast.update(toastId, {
        render: `${t("trainSuccess")} (Accuracy: ${(data.accuracy * 100).toFixed(2)}%)`,
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (error: any) {
      console.error("Train model error:", error);
      toast.update(toastId, {
        render: `Error training model: ${error.message}`,
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    } finally {
      setIsTraining(false);
    }
  };

  const handleDatasetSelect = async (datasetName: string) => {
    setSelectedDataset(datasetName);
    if (datasetName === "custom") return;

    setIsLoading(true);
    const toastId = toast.loading(t("loadingDataset"));

    try {
      const response = await fetch(`${BASE_URL}/get-dataset/${datasetName}`);
      if (!response.ok) {
        const errorData = await response.json();
        displayLogs(errorData.logs || []);
        throw new Error(errorData.message || `Failed to fetch dataset (Status: ${response.status})`);
      }

      const blob = await response.blob();
      const file = new File([blob], `${datasetName}.csv`, { type: "text/csv" });
      setFile(file);

      const logsHeader = response.headers.get("X-Logs");
      if (logsHeader) {
        const parsedLogs = JSON.parse(logsHeader);
        displayLogs(parsedLogs);
      }

      await analyzeDataset(file);

      toast.update(toastId, {
        render: t("datasetLoaded"),
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (error: any) {
      console.error("Fetch dataset error:", error);
      toast.update(toastId, {
        render: `Error fetching dataset: ${error.message}`,
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePredict = async () => {
    if (!textInput) {
      toast.error(t("noTextInput"));
      return;
    }

    setIsPredicting(true);
    const toastId = toast.loading(t("predicting"));

    try {
      const response = await fetch(`${BASE_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textInput }),
      });
      const data = await response.json();

      if (!response.ok) {
        displayLogs(data.logs || []);
        throw new Error(data.message || `Failed to predict (Status: ${response.status})`);
      }

      const newPrediction = data.prediction;
      setPrediction(newPrediction);
      setPredictionHistory((prev) => [
        { text: textInput.substring(0, 30) + (textInput.length > 30 ? "..." : ""), prediction: newPrediction },
        ...prev.slice(0, 4),
      ]);
      displayLogs(data.logs || []);

      toast.update(toastId, {
        render: t("predictSuccess"),
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (error: any) {
      console.error("Predict error:", error);
      toast.update(toastId, {
        render: `Error predicting: ${error.message}`,
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    } finally {
      setIsPredicting(false);
    }
  };

  const handleSaveModel = async () => {
    try {
      const response = await fetch(`${BASE_URL}/save-model`, { method: "POST" });
      const data = await response.json();

      if (!response.ok) {
        displayLogs(data.logs || []);
        throw new Error(data.message || `Failed to save model (Status: ${response.status})`);
      }

      displayLogs(data.logs || []);
      toast.success("Model saved successfully");
    } catch (error: any) {
      console.error("Save model error:", error);
      toast.error(`Error saving model: ${error.message}`);
    }
  };

  const handleLoadModel = async () => {
    try {
      const response = await fetch(`${BASE_URL}/load-model`, { method: "POST" });
      const data = await response.json();

      if (!response.ok) {
        displayLogs(data.logs || []);
        throw new Error(data.message || `Failed to load model (Status: ${response.status})`);
      }

      displayLogs(data.logs || []);
      toast.success("Model loaded successfully");
    } catch (error: any) {
      console.error("Load model error:", error);
      toast.error(`Error loading model: ${error.message}`);
    }
  };

  const getClassDistributionData = () =>
    datasetStats
      ? Object.entries(datasetStats.classDistribution).map(([name, value], index) => ({
          name,
          value,
          color: COLORS[index % COLORS.length],
        }))
      : [];

  const getFeatureImportanceData = () => trainingResult?.topFeatures || [];

  return (
    <div className="space-y-6">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowLogs(!showLogs)}
              className="flex items-center gap-1"
            >
              <AlertCircle className="h-4 w-4" />
              {showLogs ? "Hide Logs" : "Show Logs"}
            </Button>
          </div>
        </CardHeader>

        {showLogs && logs.length > 0 && (
          <div className="mx-6 mb-4 p-2 bg-muted rounded-md max-h-40 overflow-y-auto text-xs">
            <div className="font-medium mb-1">Processing Logs:</div>
            {logs.map((log, index) => (
              <div key={index} className="text-muted-foreground">{log}</div>
            ))}
          </div>
        )}

        <CardContent>
          <Tabs defaultValue="naive-bayes" onValueChange={setSelectedAlgorithm}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="naive-bayes">{t("naiveBayes")}</TabsTrigger>
              <TabsTrigger value="logistic">{t("logistic")}</TabsTrigger>
              <TabsTrigger value="svm">{t("svm")}</TabsTrigger>
              <TabsTrigger value="knn">{t("knn")}</TabsTrigger>
            </TabsList>

            <TabsContent value="naive-bayes" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t("selectDataset")}</Label>
                    <Select value={selectedDataset} onValueChange={handleDatasetSelect} disabled={isLoading}>
                      <SelectTrigger>
                        <SelectValue placeholder={t("selectDataset")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="imdb">IMDB Reviews</SelectItem>
                        <SelectItem value="ag_news">AG News</SelectItem>
                        <SelectItem value="custom">Custom Dataset</SelectItem>
                      </SelectContent>
                    </Select>
                    {isLoading && (
                      <div className="flex items-center mt-1 text-xs text-muted-foreground">
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        {t("loadingDataset")}...
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>{t("uploadFile")}</Label>
                    <Input type="file" accept=".csv" onChange={handleFileChange} disabled={isLoading} />
                    {file && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {t("selectedFile")}: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                      </p>
                    )}
                  </div>

                  {datasetStats && (
                    <Card className="bg-muted/50">
                      <CardHeader className="py-3">
                        <CardTitle className="text-sm">{t("datasetStatistics")}</CardTitle>
                      </CardHeader>
                      <CardContent className="py-2">
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between">
                            <span>{t("totalSamples")}:</span>
                            <span className="font-medium">{datasetStats.totalSamples.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>{t("averageTextLength")}:</span>
                            <span className="font-medium">
                              {datasetStats.averageTextLength.toFixed(2)} {t("characters")}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>{t("numberOfClasses")}:</span>
                            <span className="font-medium">{Object.keys(datasetStats.classDistribution).length}</span>
                          </div>
                        </div>
                        <div className="mt-3 h-[150px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={getClassDistributionData()}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={60}
                                dataKey="value"
                              >
                                {getClassDistributionData().map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value) => [value, t("samples")]} />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <div className="space-y-2">
                    <Label>{t("parameters")}</Label>
                    <div className="space-y-4 p-4 border rounded-md">
                      <div className="space-y-2">
                        <Label>{t("alpha")}</Label>
                        <Slider
                          value={[alpha]}
                          onValueChange={(value) => setAlpha(value[0])}
                          min={0}
                          max={2}
                          step={0.1}
                          disabled={isTraining}
                        />
                        <div className="text-sm text-muted-foreground">{alpha}</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch checked={fitPrior} onCheckedChange={setFitPrior} disabled={isTraining} />
                        <Label>{t("fitPrior")}</Label>
                      </div>
                    </div>
                  </div>

                  <Button onClick={handleTrainModel} className="w-full" disabled={isTraining || !file}>
                    {isTraining ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t("trainingModel")}
                      </>
                    ) : (
                      t("trainModel")
                    )}
                  </Button>
                  <div className="flex space-x-2">
                    <Button onClick={handleSaveModel} className="w-full" disabled={!trainingResult}>
                      {t("saveModel")}
                    </Button>
                    <Button onClick={handleLoadModel} className="w-full">
                      {t("loadModel")}
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t("predict")}</Label>
                    <Input
                      placeholder={t("predictPlaceholder")}
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      disabled={isPredicting}
                    />
                  </div>
                  <Button onClick={handlePredict} className="w-full" disabled={isPredicting || !textInput}>
                    {isPredicting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t("predicting")}
                      </>
                    ) : (
                      t("predictButton")
                    )}
                  </Button>
                  {prediction && (
                    <div className="p-4 border rounded-md">
                      <p className="font-medium">{t("prediction")}</p>
                      <p>{prediction}</p>
                    </div>
                  )}

                  {predictionHistory.length > 0 && (
                    <Card className="bg-muted/50">
                      <CardHeader className="py-3">
                        <CardTitle className="text-sm">{t("predictionHistory")}</CardTitle>
                      </CardHeader>
                      <CardContent className="py-2">
                        <div className="text-sm space-y-2">
                          {predictionHistory.map((item, index) => (
                            <div key={index} className="flex justify-between border-b pb-1 last:border-0">
                              <span className="truncate max-w-[70%]">{item.text}</span>
                              <span className="font-medium">{item.prediction}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {trainingResult && (
                    <Card>
                      <CardHeader className="py-3">
                        <CardTitle className="text-sm">{t("modelPerformance")}</CardTitle>
                      </CardHeader>
                      <CardContent className="py-2">
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-sm font-medium">
                            {t("accuracy")}: {(trainingResult.accuracy * 100).toFixed(2)}%
                          </div>
                          <div className="flex space-x-1">
                            <Button
                              variant={visualizationTab === "accuracy" ? "default" : "outline"}
                              size="sm"
                              onClick={() => setVisualizationTab("accuracy")}
                            >
                              <BarChartIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              variant={visualizationTab === "confusion" ? "default" : "outline"}
                              size="sm"
                              onClick={() => setVisualizationTab("confusion")}
                            >
                              <PieChartIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {visualizationTab === "accuracy" && trainingResult.topFeatures.length > 0 && (
                          <div className="h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={getFeatureImportanceData()}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="feature" />
                                <YAxis />
                                <Tooltip formatter={(value) => [(value as number).toFixed(2), t("importance")]} />
                                <Bar dataKey="importance" fill="#8884d8" />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        )}

                        {visualizationTab === "confusion" && trainingResult.confusionMatrix && (
                          <div className="h-[200px] flex items-center justify-center">
                            <div className="grid grid-cols-2 gap-1 text-center">
                              <div className="bg-muted p-2 font-medium">
                                True Positive
                                <br />
                                {trainingResult.confusionMatrix[0][0]}
                              </div>
                              <div className="bg-muted p-2 font-medium">
                                False Positive
                                <br />
                                {trainingResult.confusionMatrix[0][1]}
                              </div>
                              <div className="bg-muted p-2 font-medium">
                                False Negative
                                <br />
                                {trainingResult.confusionMatrix[1][0]}
                              </div>
                              <div className="bg-muted p-2 font-medium">
                                True Negative
                                <br />
                                {trainingResult.confusionMatrix[1][1]}
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="logistic" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t("selectDataset")}</Label>
                    <Select value={selectedDataset} onValueChange={handleDatasetSelect} disabled={isLoading}>
                      <SelectTrigger>
                        <SelectValue placeholder={t("selectDataset")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="imdb">IMDB Reviews</SelectItem>
                        <SelectItem value="ag_news">AG News</SelectItem>
                        <SelectItem value="custom">Custom Dataset</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("uploadFile")}</Label>
                    <Input type="file" accept=".csv" onChange={handleFileChange} disabled={isLoading} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("parameters")}</Label>
                    <div className="space-y-4 p-4 border rounded-md">
                      <div className="space-y-2">
                        <Label>Regularization Strength (C)</Label>
                        <Slider
                          value={[alpha]}
                          onValueChange={(value) => setAlpha(value[0])}
                          min={0.1}
                          max={10}
                          step={0.1}
                          disabled={isTraining}
                        />
                        <div className="text-sm text-muted-foreground">{alpha}</div>
                      </div>
                    </div>
                  </div>
                  <Button onClick={handleTrainModel} className="w-full" disabled={isTraining || !file}>
                    {isTraining ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t("trainingModel")}
                      </>
                    ) : (
                      t("trainModel")
                    )}
                  </Button>
                  <div className="flex space-x-2">
                    <Button onClick={handleSaveModel} className="w-full" disabled={!trainingResult}>
                      {t("saveModel")}
                    </Button>
                    <Button onClick={handleLoadModel} className="w-full">
                      {t("loadModel")}
                    </Button>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t("predict")}</Label>
                    <Input
                      placeholder={t("predictPlaceholder")}
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      disabled={isPredicting}
                    />
                  </div>
                  <Button onClick={handlePredict} className="w-full" disabled={isPredicting || !textInput}>
                    {isPredicting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t("predicting")}
                      </>
                    ) : (
                      t("predictButton")
                    )}
                  </Button>
                  {prediction && (
                    <div className="p-4 border rounded-md">
                      <p className="font-medium">{t("prediction")}</p>
                      <p>{prediction}</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="svm" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t("selectDataset")}</Label>
                    <Select value={selectedDataset} onValueChange={handleDatasetSelect} disabled={isLoading}>
                      <SelectTrigger>
                        <SelectValue placeholder={t("selectDataset")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="imdb">IMDB Reviews</SelectItem>
                        <SelectItem value="ag_news">AG News</SelectItem>
                        <SelectItem value="custom">Custom Dataset</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("uploadFile")}</Label>
                    <Input type="file" accept=".csv" onChange={handleFileChange} disabled={isLoading} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("parameters")}</Label>
                    <div className="space-y-4 p-4 border rounded-md">
                      <div className="space-y-2">
                        <Label>C Parameter</Label>
                        <Slider
                          value={[alpha]}
                          onValueChange={(value) => setAlpha(value[0])}
                          min={0.1}
                          max={10}
                          step={0.1}
                          disabled={isTraining}
                        />
                        <div className="text-sm text-muted-foreground">{alpha}</div>
                      </div>
                    </div>
                  </div>
                  <Button onClick={handleTrainModel} className="w-full" disabled={isTraining || !file}>
                    {isTraining ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t("trainingModel")}
                      </>
                    ) : (
                      t("trainModel")
                    )}
                  </Button>
                  <div className="flex space-x-2">
                    <Button onClick={handleSaveModel} className="w-full" disabled={!trainingResult}>
                      {t("saveModel")}
                    </Button>
                    <Button onClick={handleLoadModel} className="w-full">
                      {t("loadModel")}
                    </Button>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t("predict")}</Label>
                    <Input
                      placeholder={t("predictPlaceholder")}
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      disabled={isPredicting}
                    />
                  </div>
                  <Button onClick={handlePredict} className="w-full" disabled={isPredicting || !textInput}>
                    {isPredicting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t("predicting")}
                      </>
                    ) : (
                      t("predictButton")
                    )}
                  </Button>
                  {prediction && (
                    <div className="p-4 border rounded-md">
                      <p className="font-medium">{t("prediction")}</p>
                      <p>{prediction}</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="knn" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t("selectDataset")}</Label>
                    <Select value={selectedDataset} onValueChange={handleDatasetSelect} disabled={isLoading}>
                      <SelectTrigger>
                        <SelectValue placeholder={t("selectDataset")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="imdb">IMDB Reviews</SelectItem>
                        <SelectItem value="ag_news">AG News</SelectItem>
                        <SelectItem value="custom">Custom Dataset</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("uploadFile")}</Label>
                    <Input type="file" accept=".csv" onChange={handleFileChange} disabled={isLoading} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("parameters")}</Label>
                    <div className="space-y-4 p-4 border rounded-md">
                      <div className="space-y-2">
                        <Label>Number of Neighbors</Label>
                        <Slider
                          value={[alpha]}
                          onValueChange={(value) => setAlpha(Math.round(value[0]))}
                          min={1}
                          max={20}
                          step={1}
                          disabled={isTraining}
                        />
                        <div className="text-sm text-muted-foreground">{Math.round(alpha)}</div>
                      </div>
                    </div>
                  </div>
                  <Button onClick={handleTrainModel} className="w-full" disabled={isTraining || !file}>
                    {isTraining ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t("trainingModel")}
                      </>
                    ) : (
                      t("trainModel")
                    )}
                  </Button>
                  <div className="flex space-x-2">
                    <Button onClick={handleSaveModel} className="w-full" disabled={!trainingResult}>
                      {t("saveModel")}
                    </Button>
                    <Button onClick={handleLoadModel} className="w-full">
                      {t("loadModel")}
                    </Button>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t("predict")}</Label>
                    <Input
                      placeholder={t("predictPlaceholder")}
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      disabled={isPredicting}
                    />
                  </div>
                  <Button onClick={handlePredict} className="w-full" disabled={isPredicting || !textInput}>
                    {isPredicting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t("predicting")}
                      </>
                    ) : (
                      t("predictButton")
                    )}
                  </Button>
                  {prediction && (
                    <div className="p-4 border rounded-md">
                      <p className="font-medium">{t("prediction")}</p>
                      <p>{prediction}</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}