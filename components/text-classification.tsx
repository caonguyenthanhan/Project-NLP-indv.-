"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTranslations } from "next-intl"
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

export default function TextClassification() {
  const t = useTranslations("textClassification")
  const common = useTranslations("common")

  const [selectedAlgorithm, setSelectedAlgorithm] = useState("naive-bayes")
  const [selectedDataset, setSelectedDataset] = useState("")
  const [file, setFile] = useState<File | null>(null) // Trạng thái lưu file được chọn
  const [alpha, setAlpha] = useState(1.0)
  const [fitPrior, setFitPrior] = useState(true)
  const [prediction, setPrediction] = useState("")
  const [textInput, setTextInput] = useState("")

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]) // Lưu file được chọn vào trạng thái
    }
  }

  const handleTrainModel = async () => {
    // Kiểm tra xem đã chọn dataset chưa
    if (!selectedDataset && !file) {
      toast.error(t("noDatasetAndFileSelected"));
      return;
    }
    
    if (!selectedDataset) {
      toast.error(t("noDatasetSelected"));
      return;
    }
    
    if (!file) {
      toast.error(t("noFileSelected"));
      return;
    }
    
    // Nếu đến đây thì cả selectedDataset và file đều đã được chọn, tiếp tục xử lý
    // ... mã xử lý tiếp theo ...

    const toastId = toast.loading(t("trainingModel"))
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("algorithm", selectedAlgorithm)
      formData.append("alpha", alpha.toString())

      const response = await fetch("http://localhost:8000/train", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to train model")
      }

      const result = await response.json()
      toast.update(toastId, {
        render: t("trainSuccess"),
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
    }
  }

  const handlePredict = async () => {
    if (!textInput) {
      toast.error(t("noTextInput"))
      return
    }

    const toastId = toast.loading(t("predicting"))
    try {
      const response = await fetch("http://localhost:8000/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: textInput }),
      })

      if (!response.ok) {
        throw new Error("Failed to predict")
      }

      const result = await response.json()
      setPrediction(result.prediction)
      toast.update(toastId, {
        render: t("predictSuccess"),
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
    }
  }

  return (
    <div className="space-y-6">
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
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
                    <Select value={selectedDataset} onValueChange={setSelectedDataset}>
                      <SelectTrigger>
                        <SelectValue placeholder={t("selectDataset")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="imdb">IMDB Reviews</SelectItem>
                        <SelectItem value="twitter">Twitter Sentiment</SelectItem>
                        <SelectItem value="custom">Custom Dataset</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>{t("uploadFile")}</Label>
                    <Input type="file" accept=".csv" onChange={handleFileChange} />
                  </div>

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
                        />
                        <div className="text-sm text-muted-foreground">{alpha}</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch checked={fitPrior} onCheckedChange={setFitPrior} />
                        <Label>{t("fitPrior")}</Label>
                      </div>
                    </div>
                  </div>

                  <Button onClick={handleTrainModel} className="w-full">
                    {t("trainModel")}
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t("predict")}</Label>
                    <Input
                      placeholder={t("predictPlaceholder")}
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                    />
                  </div>
                  <Button onClick={handlePredict} className="w-full">
                    {t("predictButton")}
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

            <TabsContent value="logistic" className="space-y-6 mt-6">
              <p>{t("comingSoon")}</p>
            </TabsContent>

            <TabsContent value="svm" className="space-y-6 mt-6">
              <p>{t("comingSoon")}</p>
            </TabsContent>

            <TabsContent value="knn" className="space-y-6 mt-6">
              <p>{t("comingSoon")}</p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}