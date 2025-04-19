"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useTranslations } from "next-intl"
import { useWorkflow } from "@/context/workflow-context"
import { v4 as uuidv4 } from "uuid"
import { Loader2, Eye, EyeOff } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function TextRepresentation() {
  const t = useTranslations("textRepresentation")
  const common = useTranslations("common")
  const { toast } = useToast()
  const { currentDataset, setCurrentDataset, setCurrentStep, datasets, setDatasets } = useWorkflow()
  const [method, setMethod] = useState("tfidf")
  const [isLoading, setIsLoading] = useState(false)
  const [representedData, setRepresentedData] = useState<any[]>([])
  const [features, setFeatures] = useState<string[]>([])
  const [showVectors, setShowVectors] = useState(false)
  const [selectedSample, setSelectedSample] = useState(0)
  const [shouldRepresent, setShouldRepresent] = useState<"yes" | "no">("no")
  const [error, setError] = useState<string | null>(null)

  const representationMethods = {
    basic: [
      { id: "bow", name: "Bag of Words" },
      { id: "tfidf", name: "TF-IDF" },
      { id: "count", name: "Count Vectorizer" },
    ],
    advanced: [
      { id: "word2vec", name: "Word2Vec", description: "Biểu diễn từ dựa trên ngữ cảnh xuất hiện" },
      { id: "bert", name: "BERT", description: "Biểu diễn ngữ cảnh hai chiều sử dụng Transformer" },
      { id: "doc2vec", name: "Doc2Vec", description: "Biểu diễn văn bản dựa trên Word2Vec" },
      { id: "use", name: "Universal Sentence Encoder", description: "Biểu diễn câu đa ngôn ngữ" },
      { id: "fasttext", name: "FastText", description: "Biểu diễn từ với thông tin về từ con" }
    ]
  }

  // Reset states when dataset changes
  useEffect(() => {
    setRepresentedData([])
    setFeatures([])
    setShowVectors(false)
    setShouldRepresent("no")
    setError(null)
  }, [currentDataset])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !isLoading && currentDataset) {
        representData()
      } else if (e.key === "Backspace" && currentDataset) {
        skipRepresentation()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isLoading, currentDataset])

  const handleContinue = () => {
    if (shouldRepresent === "yes") {
      representData()
    } else {
      skipRepresentation()
    }
  }

  const representData = async () => {
    if (!currentDataset) {
      setError(t("noData"))
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("http://localhost:8000/represent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: currentDataset.data.map(item => item.text),
          method: method,
          options: {
            modelType: representationMethods.advanced.some(m => m.id === method) ? "advanced" : "basic"
          }
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      if (!result.vectors || !Array.isArray(result.vectors)) {
        throw new Error("Invalid response format from server")
      }

      const newDataset = {
        ...currentDataset,
        data: currentDataset.data.map((item, index) => ({
          ...item,
          vector: result.vectors[index],
        })),
        metadata: {
          ...currentDataset.metadata,
          represented: true,
          representedAt: new Date().toISOString(),
        },
      }

      setDatasets([...datasets.filter(d => d !== currentDataset), newDataset])
      setCurrentDataset(newDataset)
      toast({
        title: t("vectorsReady"),
        description: t("clickShowVectors"),
      })
    } catch (error: any) {
      const errorMessage = error.message || t("failedToRepresent")
      setError(errorMessage)
      toast({
        title: t("error"),
        description: errorMessage,
        className: "bg-destructive text-destructive-foreground"
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (representedData.length > 0 && features.length > 0) {
      setShowVectors(true)
    }
  }, [representedData, features])

  const skipRepresentation = () => {
    if (!currentDataset) {
      toast({
        title: t("error"),
        description: t("noData"),
        className: "bg-destructive text-destructive-foreground"
      })
      return
    }
    setCurrentStep(5)
  }

  const toggleVectors = () => {
    setShowVectors(!showVectors)
    if (!showVectors) {
      toast({
        title: "Vectors visible",
        description: "You can now see the vector representations for each text.",
      })
    }
  }

  // Format vector values for display
  const formatVectorValue = (value: number) => {
    return value.toFixed(4)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md">
              {error}
            </div>
          )}
          
          {currentDataset ? (
            <>
              <p>{t("datasetSize", { size: currentDataset.metadata?.size || 0 })}</p>
              
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">{t("representationDecision")}</h3>
                <p className="text-sm text-muted-foreground mb-4">{t("representationDecisionDescription")}</p>
                <RadioGroup value={shouldRepresent} onValueChange={(value: "yes" | "no") => setShouldRepresent(value)} className="flex flex-col space-y-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="represent-yes" />
                    <Label htmlFor="represent-yes">{t("performRepresentation")}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="represent-no" />
                    <Label htmlFor="represent-no">{t("skipRepresentation")}</Label>
                  </div>
                </RadioGroup>
              </div>

              {shouldRepresent === "yes" && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium mb-2">{t("selectMethod")}</h3>
                  <Select value={method} onValueChange={setMethod}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t("selectMethodPlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>{t("basicMethods")}</SelectLabel>
                        {representationMethods.basic.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                      <SelectGroup>
                        <SelectLabel>{t("advancedMethods")}</SelectLabel>
                        {representationMethods.advanced.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            <div>
                              <div>{m.name}</div>
                              <div className="text-xs text-muted-foreground">{m.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {currentDataset.metadata?.represented && (
                <div className="mt-6">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium">{t("results")}</h3>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={toggleVectors} 
                      className="flex items-center gap-2"
                    >
                      {showVectors ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      {showVectors ? t("hideVectors") : t("showVectors")}
                    </Button>
                  </div>

                  {showVectors && currentDataset.data[0]?.vector && (
                    <div className="mt-4 p-4 bg-muted/30 rounded-md">
                      <div className="flex items-center mb-2">
                        <label className="mr-2 text-sm">{t("selectSample")}:</label>
                        <Select
                          value={selectedSample.toString()}
                          onValueChange={(value) => setSelectedSample(Number(value))}
                        >
                          <SelectTrigger className="w-[100px]">
                            <SelectValue placeholder="Sample" />
                          </SelectTrigger>
                          <SelectContent>
                            {currentDataset.data.map((_, index) => (
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
                          {currentDataset.data[selectedSample]?.text || t("noText")}
                        </div>

                        <p className="font-medium mb-1">{t("vectorRepresentation")}:</p>
                        <div className="bg-background p-2 rounded border overflow-x-auto">
                          <pre className="text-xs">
                            {JSON.stringify(currentDataset.data[selectedSample]?.vector, null, 2)}
                          </pre>
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
        <CardFooter className="flex justify-end space-x-2">
          <Button 
            onClick={handleContinue}
            disabled={isLoading || !currentDataset}
            className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {common("processing")}
              </>
            ) : shouldRepresent === "yes" ? (
              <>
                <Eye className="h-4 w-4" />
                {t("represent")}
              </>
            ) : (
              t("next")
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

