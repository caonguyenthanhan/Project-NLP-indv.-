"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, ArrowRight } from "lucide-react"
import { useTranslations } from "next-intl"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { useWorkflow } from "@/context/workflow-context"
import { DatasetSelector } from "@/components/dataset-selector"
import { v4 as uuidv4 } from "uuid"

export default function TextRepresentation() {
  const t = useTranslations("textRepresentation")
  const common = useTranslations("common")
  const { currentDataset, addDataset, setCurrentStep } = useWorkflow()

  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("basic")
  const [activeBasicMethod, setActiveBasicMethod] = useState("one-hot")
  const [activeAdvancedMethod, setActiveAdvancedMethod] = useState("word2vec")

  const representData = async () => {
    if (!currentDataset) {
      toast.error(t("noDataset"))
      return
    }

    setIsLoading(true)
    const toastId = toast.loading(t("processing"))

    try {
      // Real representation using the backend
      const response = await fetch(`http://localhost:8000/represent-data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: currentDataset.data,
          method: activeTab === "basic" ? activeBasicMethod : activeAdvancedMethod,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to represent data: ${response.status}`)
      }

      const data = await response.json()

      // Add represented dataset to workflow
      addDataset({
        id: uuidv4(),
        name: `Represented: ${currentDataset.name} (${activeTab === "basic" ? activeBasicMethod : activeAdvancedMethod})`,
        type: "represented",
        data: data.represented_data,
        metadata: {
          source: `Represented from ${currentDataset.name}`,
          createdAt: new Date().toISOString(),
          size: data.represented_data.length,
          originalDataset: currentDataset.id,
          representationMethod: activeTab === "basic" ? activeBasicMethod : activeAdvancedMethod,
          features: data.features || [],
        },
      })

      toast.update(toastId, {
        render: t("representSuccess"),
        type: "success",
        isLoading: false,
        autoClose: 3000,
      })

      // Move to next step
      setTimeout(() => {
        setCurrentStep(5) // Move to text classification step
      }, 1000)
    } catch (error) {
      toast.update(toastId, {
        render: `Error: ${error instanceof Error ? error.message : "Failed to represent data"}`,
        type: "error",
        isLoading: false,
        autoClose: 3000,
      })
    } finally {
      setIsLoading(false)
    }
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
          <Tabs defaultValue="basic" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic" className="text-xs md:text-sm" style={{ whiteSpace: "nowrap" }}>
                {t("basicMethods")}
              </TabsTrigger>
              <TabsTrigger value="advanced" className="text-xs md:text-sm" style={{ whiteSpace: "nowrap" }}>
                {t("advancedMethods")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid grid-cols-4 gap-2">
                <Button
                  variant={activeBasicMethod === "one-hot" ? "default" : "outline"}
                  onClick={() => setActiveBasicMethod("one-hot")}
                >
                  {t("oneHot")}
                </Button>
                <Button
                  variant={activeBasicMethod === "bow" ? "default" : "outline"}
                  onClick={() => setActiveBasicMethod("bow")}
                >
                  {t("bagOfWords")}
                </Button>
                <Button
                  variant={activeBasicMethod === "ngram" ? "default" : "outline"}
                  onClick={() => setActiveBasicMethod("ngram")}
                >
                  {t("nGrams")}
                </Button>
                <Button
                  variant={activeBasicMethod === "tfidf" ? "default" : "outline"}
                  onClick={() => setActiveBasicMethod("tfidf")}
                >
                  {t("tfIdf")}
                </Button>
              </div>

              <div className="p-4 border rounded-md">
                <h3 className="font-medium mb-2">{t("methodDescription")}</h3>
                {activeBasicMethod === "one-hot" && (
                  <p className="text-sm text-muted-foreground">{t("oneHotDescription")}</p>
                )}
                {activeBasicMethod === "bow" && <p className="text-sm text-muted-foreground">{t("bowDescription")}</p>}
                {activeBasicMethod === "ngram" && (
                  <p className="text-sm text-muted-foreground">{t("nGramDescription")}</p>
                )}
                {activeBasicMethod === "tfidf" && (
                  <p className="text-sm text-muted-foreground">{t("tfidfDescription")}</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4 mt-4">
              <div className="grid grid-cols-5 gap-2">
                <Button
                  variant={activeAdvancedMethod === "word2vec" ? "default" : "outline"}
                  onClick={() => setActiveAdvancedMethod("word2vec")}
                >
                  {t("word2vec")}
                </Button>
                <Button
                  variant={activeAdvancedMethod === "glove" ? "default" : "outline"}
                  onClick={() => setActiveAdvancedMethod("glove")}
                >
                  {t("glove")}
                </Button>
                <Button
                  variant={activeAdvancedMethod === "fasttext" ? "default" : "outline"}
                  onClick={() => setActiveAdvancedMethod("fasttext")}
                >
                  {t("fasttext")}
                </Button>
                <Button
                  variant={activeAdvancedMethod === "doc2vec" ? "default" : "outline"}
                  onClick={() => setActiveAdvancedMethod("doc2vec")}
                >
                  {t("doc2vec")}
                </Button>
                <Button
                  variant={activeAdvancedMethod === "sentence" ? "default" : "outline"}
                  onClick={() => setActiveAdvancedMethod("sentence")}
                >
                  {t("sentence")}
                </Button>
              </div>

              <div className="p-4 border rounded-md">
                <h3 className="font-medium mb-2">{t("methodDescription")}</h3>
                {activeAdvancedMethod === "word2vec" && (
                  <p className="text-sm text-muted-foreground">{t("word2vecDescription")}</p>
                )}
                {activeAdvancedMethod === "glove" && (
                  <p className="text-sm text-muted-foreground">{t("gloveDescription")}</p>
                )}
                {activeAdvancedMethod === "fasttext" && (
                  <p className="text-sm text-muted-foreground">{t("fasttextDescription")}</p>
                )}
                {activeAdvancedMethod === "doc2vec" && (
                  <p className="text-sm text-muted-foreground">{t("doc2vecDescription")}</p>
                )}
                {activeAdvancedMethod === "sentence" && (
                  <p className="text-sm text-muted-foreground">{t("sentenceDescription")}</p>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {currentDataset && (
            <div className="border rounded-md p-4 bg-muted/50 mt-4">
              <h3 className="font-medium mb-2">{t("datasetPreview")}</h3>
              <div className="max-h-[200px] overflow-y-auto">
                <table className="min-w-full">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      {Object.keys(currentDataset.data[0]).map((key) => (
                        <th key={key} className="px-4 py-2 text-left font-medium">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {currentDataset.data.slice(0, 5).map((item, index) => (
                      <tr key={index} className={index % 2 === 0 ? "bg-muted/50" : ""}>
                        {Object.values(item).map((value, i) => (
                          <td key={i} className="px-4 py-2 border-t">
                            {typeof value === "string"
                              ? value.substring(0, 50) + (value.length > 50 ? "..." : "")
                              : String(value)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={representData} disabled={isLoading || !currentDataset}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("processing")}
              </>
            ) : (
              <>
                {t("representAndContinue")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

