"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTranslations } from "next-intl"
import { ToastContainer, toast } from "react-toastify"
import { useWorkflow } from "@/context/workflow-context"
import DatasetSelector from "./dataset-selector"
import { v4 as uuidv4 } from "uuid"

export default function TextRepresentation() {
  const t = useTranslations("textRepresentation")
  const { currentDataset, addDataset, setCurrentStep } = useWorkflow()
  const [method, setMethod] = useState("tfidf")
  const [isLoading, setIsLoading] = useState(false)
  const [representedData, setRepresentedData] = useState<any[]>([])
  const [features, setFeatures] = useState<string[]>([])
  const [showVectors, setShowVectors] = useState(false)
  const [selectedSample, setSelectedSample] = useState(0)

  // Reset represented data when dataset changes
  useEffect(() => {
    setRepresentedData([])
    setFeatures([])
    setShowVectors(false)
  }, [currentDataset])

  const representData = async () => {
    if (!currentDataset) {
      toast.error(t("noData"))
      return
    }
    setIsLoading(true)
    const toastId = toast.loading(t("processing"))
    try {
      const response = await fetch("http://localhost:8000/represent-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: currentDataset.data, method }),
      })
      if (!response.ok) throw new Error(`Representation failed: ${response.status}`)
      const { represented_data, features } = await response.json()

      // Store the represented data and features
      setRepresentedData(represented_data)
      setFeatures(features)

      const newDataset = {
        id: uuidv4(),
        name: `${method.toUpperCase()}: ${currentDataset.name}`,
        type: "represented",
        data: currentDataset.data,
        metadata: {
          ...currentDataset.metadata,
          represented: true,
          representation: method,
          features,
          vectors: represented_data,
          size: currentDataset.data.length,
        },
      }
      addDataset(newDataset)
      setCurrentStep(5)
      toast.update(toastId, { render: t("success"), type: "success", isLoading: false, autoClose: 3000 })
    } catch (error) {
      toast.update(toastId, { render: `Error: ${error.message}`, type: "error", isLoading: false, autoClose: 3000 })
    } finally {
      setIsLoading(false)
    }
  }

  const skipRepresentation = () => {
    if (!currentDataset) {
      toast.error(t("noData"))
      return
    }
    setCurrentStep(5)
  }

  const toggleVectorView = () => {
    setShowVectors(!showVectors)
  }

  // Format vector values for display
  const formatVectorValue = (value: number) => {
    return value.toFixed(4)
  }

  return (
    <div className="space-y-6">
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />

      <DatasetSelector allowedTypes={["raw", "augmented", "cleaned", "preprocessed"]} />

      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent>
          {currentDataset ? (
            <>
              <p>
                {t("datasetSize")}: {currentDataset.metadata.size} samples
              </p>
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1">{t("method")}</label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger className="w-full md:w-[280px]">
                    <SelectValue placeholder={t("selectMethod")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tfidf">TF-IDF</SelectItem>
                    <SelectItem value="count" disabled>
                      Count Vectorizer (Coming soon)
                    </SelectItem>
                    <SelectItem value="word2vec" disabled>
                      Word2Vec (Coming soon)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {representedData.length > 0 && features.length > 0 && (
                <div className="mt-6">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium">{t("results")}</h3>
                    <Button variant="outline" size="sm" onClick={toggleVectorView}>
                      {showVectors ? t("hideVectors") : t("showVectors")}
                    </Button>
                  </div>

                  <div className="bg-muted/30 rounded-md p-4">
                    <p>
                      {t("vectorSize")}: {representedData[0]?.length} features
                    </p>
                    <p className="mt-1">
                      {t("sampleFeatures")}: {features.slice(0, 5).join(", ")}...
                    </p>

                    {showVectors && (
                      <div className="mt-4">
                        <div className="flex items-center mb-2">
                          <label className="mr-2 text-sm">{t("selectSample")}:</label>
                          <Select
                            value={selectedSample.toString()}
                            onValueChange={(value) => setSelectedSample(Number.parseInt(value))}
                          >
                            <SelectTrigger className="w-[100px]">
                              <SelectValue placeholder="Sample" />
                            </SelectTrigger>
                            <SelectContent>
                              {representedData.map((_, index) => (
                                <SelectItem key={index} value={index.toString()}>
                                  {index + 1}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="mt-2 text-sm">
                          <p className="font-medium mb-1">{t("originalText")}:</p>
                          <div className="bg-background p-2 rounded border mb-3">
                            {currentDataset.data[selectedSample]?.text || "No text available"}
                          </div>

                          <p className="font-medium mb-1">{t("vectorRepresentation")}:</p>
                          <div className="bg-background p-2 rounded border overflow-x-auto">
                            <table className="min-w-full">
                              <thead>
                                <tr>
                                  <th className="px-2 py-1 text-left">Feature</th>
                                  <th className="px-2 py-1 text-left">Value</th>
                                </tr>
                              </thead>
                              <tbody>
                                {
                                  representedData[selectedSample] &&
                                    features
                                      .map((feature, idx) => {
                                        // Only show non-zero values to reduce clutter
                                        if (representedData[selectedSample][idx] > 0.001) {
                                          return (
                                            <tr key={idx} className="border-t">
                                              <td className="px-2 py-1">{feature}</td>
                                              <td className="px-2 py-1">
                                                {formatVectorValue(representedData[selectedSample][idx])}
                                              </td>
                                            </tr>
                                          )
                                        }
                                        return null
                                      })
                                      .filter(Boolean)
                                      .slice(0, 20) // Limit to 20 features for performance
                                }
                                {representedData[selectedSample] &&
                                  features.some((_, idx) => representedData[selectedSample][idx] > 0.001) && (
                                    <tr>
                                      <td colSpan={2} className="px-2 py-1 text-center text-muted-foreground">
                                        {t("showingTopFeatures")}
                                      </td>
                                    </tr>
                                  )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-red-500">{t("noData")}</p>
          )}
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          <Button onClick={representData} disabled={isLoading || !currentDataset}>
            {isLoading ? t("processing") : t("represent")}
          </Button>
          <Button onClick={skipRepresentation} variant="outline">
            {t("next")}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

