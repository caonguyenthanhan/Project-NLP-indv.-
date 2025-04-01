"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslations } from "next-intl";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Loader2, BarChartIcon, PieChartIcon, AlertCircle, Server, RefreshCw, ScatterChartIcon } from "lucide-react";
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
  ScatterChart,
  Scatter,
} from "recharts";

interface TrainingResult {
  accuracy: number;
  confusionMatrix: number[][];
  topFeatures: Array<{ feature: string; importance: number }>;
  clusters?: Array<{ x: number; y: number; label: string }>;
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
  const [fitPrior, setFitPrior] = useState(true);
  const [prediction, setPrediction] = useState("");
  const [confidence, setConfidence] = useState<number | null>(null);
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
  const [backendStatus, setBackendStatus] = useState<"checking" | "online" | "offline">("checking");
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(false);

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

  const addDebugLog = useCallback((message: string) => {
    console.log(`[Debug] ${message}`);
    setDebugInfo((prev) => [message, ...prev.slice(0, 49)]);
  }, []);

  const checkBackendStatus = useCallback(async () => {
    setBackendStatus("checking");
    addDebugLog(`Attempting to connect to ${BASE_URL}/health`);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${BASE_URL}/health`, {
        signal: controller.signal,
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      clearTimeout(timeoutId);
      addDebugLog(`Response received with status: ${response.status}`);

      if (response.ok) {
        const data = await response.json();
        setBackendStatus("online");
        addDebugLog(`Backend is online: ${data.message}`);
        toast.success("Connected to backend server");
      } else {
        setBackendStatus("offline");
        addDebugLog(`Backend returned error status: ${response.status}`);
        toast.error(`Backend error: ${response.status}`);
      }
    } catch (error) {
      setBackendStatus("offline");
      const errorMsg = error instanceof Error ? error.message : String(error);
      addDebugLog(`Backend connection failed: ${errorMsg}`);
      toast.error(`Cannot connect to backend server at ${BASE_URL}: ${errorMsg}`);
    }
  }, [addDebugLog]);

  useEffect(() => {
    checkBackendStatus();
  }, [checkBackendStatus]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      addDebugLog(`Selected file: ${selectedFile.name} (${selectedFile.size} bytes)`);
      analyzeDataset(selectedFile);
    }
  };

  const displayLogs = (newLogs: string[]) => {
    if (newLogs && newLogs.length > 0) {
      setLogs((prev) => [...prev, ...newLogs]);
      newLogs.forEach((log) => {
        addDebugLog(`Server Log: ${log}`);
        toast.info(log, { autoClose: 2000 });
      });
    }
  };

  const analyzeDataset = async (file: File) => {
    setIsLoading(true);
    addDebugLog(`Analyzing dataset: ${file.name}`);
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
      addDebugLog(`Analyze dataset error: ${error.message}`);
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
    addDebugLog(`Training model with algorithm: ${selectedAlgorithm}, alpha: ${alpha}`);

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
        confusionMatrix: data.confusion_matrix || [[0, 0], [0, 0]],
        topFeatures: data.top_features || [],
        clusters: data.clusters || [],
      });
      displayLogs(data.logs || []);

      toast.update(toastId, {
        render: `${t("trainSuccess")} (Accuracy: ${(data.accuracy * 100).toFixed(2)}%)`,
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (error: any) {
      addDebugLog(`Train model error: ${error.message}`);
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
    addDebugLog(`Fetching dataset: ${datasetName}`);

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
      addDebugLog(`Fetch dataset error: ${error.message}`);
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
    addDebugLog(`Predicting text: ${textInput.substring(0, 50)}${textInput.length > 50 ? "..." : ""}`);

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
      setConfidence(data.confidence);
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
      addDebugLog(`Predict error: ${error.message}`);
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
    const toastId = toast.loading("Saving model...");
    addDebugLog("Saving model");

    try {
      const response = await fetch(`${BASE_URL}/save-model`, { method: "POST" });
      const data = await response.json();

      if (!response.ok) {
        displayLogs(data.logs || []);
        throw new Error(data.message || `Failed to save model (Status: ${response.status})`);
      }

      displayLogs(data.logs || []);
      toast.update(toastId, {
        render: "Model saved successfully",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (error: any) {
      addDebugLog(`Save model error: ${error.message}`);
      toast.update(toastId, {
        render: `Error saving model: ${error.message}`,
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    }
  };

  const handleLoadModel = async () => {
    const toastId = toast.loading("Loading model...");
    addDebugLog("Loading model");

    try {
      const response = await fetch(`${BASE_URL}/load-model`, { method: "POST" });
      const data = await response.json();

      if (!response.ok) {
        displayLogs(data.logs || []);
        throw new Error(data.message || `Failed to load model (Status: ${response.status})`);
      }

      displayLogs(data.logs || []);
      toast.update(toastId, {
        render: "Model loaded successfully",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (error: any) {
      addDebugLog(`Load model error: ${error.message}`);
      toast.update(toastId, {
        render: `Error loading model: ${error.message}`,
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
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

  const getAlphaLabel = () => {
    switch (selectedAlgorithm) {
      case "naive-bayes": return "Alpha (Smoothing)";
      case "logistic": return "Regularization Strength (C)";
      case "svm": return "C Parameter";
      case "knn": return "Number of Neighbors";
      default: return "Parameter";
    }
  };

  const getAlphaRange = () => {
    switch (selectedAlgorithm) {
      case "naive-bayes": return { min: 0, max: 2, step: 0.1 };
      case "logistic":
      case "svm": return { min: 0.1, max: 10, step: 0.1 };
      case "knn": return { min: 1, max: 20, step: 1 };
      default: return { min: 0, max: 10, step: 0.1 };
    }
  };

  const handleAlphaChange = (value: number[]) => {
    let newValue = value[0];
    if (selectedAlgorithm === "knn") newValue = Math.round(newValue);
    setAlpha(newValue);
  };

  return (
    <div className="space-y-6">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>{t("title")}</CardTitle>
              <CardDescription>{t("description")}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                <Server className={`h-4 w-4 mr-1 ${backendStatus === "online" ? "text-green-500" : "text-red-500"}`} />
                <span className="text-xs">{backendStatus === "online" ? "Backend connected" : "Backend offline"}</span>
              </div>
              <Button variant="outline" size="sm" onClick={checkBackendStatus} disabled={backendStatus === "checking"}>
                <RefreshCw className={`h-4 w-4 ${backendStatus === "checking" ? "animate-spin" : ""}`} />
                Test Connection
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowLogs(!showLogs)}>
                <AlertCircle className="h-4 w-4" />
                {showLogs ? "Hide Logs" : "Show Logs"}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowDebug(!showDebug)}>
                <AlertCircle className="h-4 w-4" />
                {showDebug ? "Hide Debug" : "Show Debug"}
              </Button>
            </div>
          </div>
        </CardHeader>

        {showLogs && (
          <div className="mx-6 mb-4 p-2 bg-muted rounded-md max-h-40 overflow-y-auto text-xs">
            <div className="font-medium mb-1">Processing Logs:</div>
            {logs.length > 0 ? (
              logs.map((log, index) => (
                <div key={index} className="text-muted-foreground">{log}</div>
              ))
            ) : (
              <div className="text-muted-foreground">No logs yet.</div>
            )}
          </div>
        )}

        {showDebug && (
          <div className="mx-6 mb-4 p-2 bg-muted rounded-md max-h-40 overflow-y-auto text-xs">
            <div className="font-medium mb-1">Debug Information:</div>
            {debugInfo.length > 0 ? (
              debugInfo.map((log, index) => (
                <div key={index} className="text-muted-foreground">{log}</div>
              ))
            ) : (
              <div className="text-muted-foreground">No debug info yet.</div>
            )}
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

            <TabsContent value={selectedAlgorithm} className="space-y-6 mt-6">
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
                        <SelectItem value="twitter">Twitter Sentiment</SelectItem>
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
                          <div>{t("totalSamples")}: <span className="font-medium">{datasetStats.totalSamples.toLocaleString()}</span></div>
                          <div>{t("averageTextLength")}: <span className="font-medium">{datasetStats.averageTextLength.toFixed(2)} {t("characters")}</span></div>
                          <div>{t("numberOfClasses")}: <span className="font-medium">{Object.keys(datasetStats.classDistribution).length}</span></div>
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
                        <Label>{getAlphaLabel()}</Label>
                        <Slider
                          value={[alpha]}
                          onValueChange={handleAlphaChange}
                          min={getAlphaRange().min}
                          max={getAlphaRange().max}
                          step={getAlphaRange().step}
                          disabled={isTraining}
                        />
                        <div className="text-sm text-muted-foreground">{selectedAlgorithm === "knn" ? Math.round(alpha) : alpha}</div>
                      </div>
                      {selectedAlgorithm === "naive-bayes" && (
                        <div className="flex items-center space-x-2">
                          <Switch checked={fitPrior} onCheckedChange={setFitPrior} disabled={isTraining} />
                          <Label>{t("fitPrior")}</Label>
                        </div>
                      )}
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
                      {confidence !== null && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Confidence: {(confidence * 100).toFixed(2)}%
                        </p>
                      )}
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
                            {selectedAlgorithm === "knn" && trainingResult.clusters && (
                              <Button
                                variant={visualizationTab === "clusters" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setVisualizationTab("clusters")}
                              >
                                <ScatterChartIcon className="h-4 w-4" />
                              </Button>
                            )}
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
                              <div className="bg-muted p-2 font-medium">True Positive<br />{trainingResult.confusionMatrix[0][0]}</div>
                              <div className="bg-muted p-2 font-medium">False Positive<br />{trainingResult.confusionMatrix[0][1]}</div>
                              <div className="bg-muted p-2 font-medium">False Negative<br />{trainingResult.confusionMatrix[1][0]}</div>
                              <div className="bg-muted p-2 font-medium">True Negative<br />{trainingResult.confusionMatrix[1][1]}</div>
                            </div>
                          </div>
                        )}

                        {visualizationTab === "clusters" && trainingResult.clusters && (
                          <div className="h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <ScatterChart>
                                <CartesianGrid />
                                <XAxis type="number" dataKey="x" name="X" />
                                <YAxis type="number" dataKey="y" name="Y" />
                                <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                                <Scatter name="Clusters" data={trainingResult.clusters} fill="#8884d8">
                                  {trainingResult.clusters.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[entry.label === "positive" ? 0 : entry.label === "negative" ? 1 : 2]} />
                                  ))}
                                </Scatter>
                              </ScatterChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>

        <CardFooter className="flex justify-center border-t pt-4">
          <div className="text-xs text-muted-foreground">
            Backend URL: {BASE_URL} | Status: {backendStatus === "online" ? "Connected" : "Disconnected"}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}