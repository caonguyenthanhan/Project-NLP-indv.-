"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, ArrowRight } from "lucide-react"
import { useTranslations } from "next-intl"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { useWorkflow } from "@/context/workflow-context"
import { DatasetSelector } from "@/components/dataset-selector"
import { v4 as uuidv4 } from "uuid"

export default function DataAugmentation() {
  const t = useTranslations("dataAugmentation")
  const common = useTranslations("common")
  const { currentDataset, addDataset, setCurrentStep } = useWorkflow()

  const [inputText, setInputText] = useState("")
  const [augmentedTexts, setAugmentedTexts] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [shouldAugment, setShouldAugment] = useState<boolean | null>(null)

  // Augmentation parameters
  const [synonymProbability, setSynonymProbability] = useState(0.3)
  const [noiseProbability, setNoiseProbability] = useState(0.1)
  const [deletionProbability, setDeletionProbability] = useState(0.2)
  const [backTranslationLanguage, setBackTranslationLanguage] = useState("fr")

  const performAugmentation = async () => {
    if (!currentDataset) {
      toast.error(t("noDataset"))
      return
    }

    setIsLoading(true)
    const toastId = toast.loading(t("augmenting"))

    try {
      // Real augmentation using the backend
      const response = await fetch(`http://localhost:8000/augment-data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: currentDataset.data,
          synonym_probability: synonymProbability,
          noise_probability: noiseProbability,
          deletion_probability: deletionProbability,
          back_translation_language: backTranslationLanguage,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to augment data: ${response.status}`)
      }

      const data = await response.json()

      // Add augmented dataset to workflow
      addDataset({
        id: uuidv4(),
        name: `Augmented: ${currentDataset.name}`,
        type: "augmented",
        data: data.augmented_data,
        metadata: {
          source: `Augmented from ${currentDataset.name}`,
          createdAt: new Date().toISOString(),
          size: data.augmented_data.length,
          originalDataset: currentDataset.id,
          augmentationParams: {
            synonymProbability,
            noiseProbability,
            deletionProbability,
            backTranslationLanguage,
          },
        },
      })

      toast.update(toastId, {
        render: t("augmentSuccess"),
        type: "success",
        isLoading: false,
        autoClose: 3000,
      })

      // Move to next step
      setTimeout(() => {
        setCurrentStep(2) // Move to data cleaning step
      }, 1000)
    } catch (error) {
      toast.update(toastId, {
        render: `Error: ${error instanceof Error ? error.message : "Failed to augment data"}`,
        type: "error",
        isLoading: false,
        autoClose: 3000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const skipAugmentation = () => {
    if (!currentDataset) {
      toast.error(t("noDataset"))
      return
    }

    toast.info(t("skippingAugmentation"))

    // Move to next step without augmentation
    setTimeout(() => {
      setCurrentStep(2) // Move to data cleaning step
    }, 1000)
  }

  const handleAugmentationDecision = (shouldAugmentData: boolean) => {
    setShouldAugment(shouldAugmentData)
    if (!shouldAugmentData) {
      skipAugmentation()
    }
  }

  return (
    <div className="space-y-6">
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />

      <DatasetSelector allowedTypes={["raw"]} />

      {shouldAugment === null && (
        <Card>
          <CardHeader>
            <CardTitle>{t("augmentationDecision")}</CardTitle>
            <CardDescription>{t("augmentationDecisionDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center p-6 space-y-4">
              <p className="text-center">{t("shouldAugmentData")}</p>
              <div className="flex gap-4">
                <Button variant="outline" onClick={() => handleAugmentationDecision(false)} disabled={!currentDataset}>
                  {t("skipAugmentation")}
                </Button>
                <Button onClick={() => handleAugmentationDecision(true)} disabled={!currentDataset}>
                  {t("performAugmentation")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {shouldAugment && (
        <Card>
          <CardHeader>
            <CardTitle>{t("title")}</CardTitle>
            <CardDescription>{t("description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="synonym-probability">{t("synonymReplacementProbability")}</Label>
                  <span className="text-sm text-muted-foreground">{synonymProbability.toFixed(2)}</span>
                </div>
                <Slider
                  id="synonym-probability"
                  min={0}
                  max={1}
                  step={0.05}
                  value={[synonymProbability]}
                  onValueChange={(value) => setSynonymProbability(value[0])}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="noise-probability">{t("noiseInjectionProbability")}</Label>
                  <span className="text-sm text-muted-foreground">{noiseProbability.toFixed(2)}</span>
                </div>
                <Slider
                  id="noise-probability"
                  min={0}
                  max={0.5}
                  step={0.05}
                  value={[noiseProbability]}
                  onValueChange={(value) => setNoiseProbability(value[0])}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="deletion-probability">{t("wordDeletionProbability")}</Label>
                  <span className="text-sm text-muted-foreground">{deletionProbability.toFixed(2)}</span>
                </div>
                <Slider
                  id="deletion-probability"
                  min={0}
                  max={0.5}
                  step={0.05}
                  value={[deletionProbability]}
                  onValueChange={(value) => setDeletionProbability(value[0])}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="back-translation-language">{t("backTranslationLanguage")}</Label>
                <Select value={backTranslationLanguage} onValueChange={setBackTranslationLanguage}>
                  <SelectTrigger id="back-translation-language">
                    <SelectValue placeholder={t("backTranslationLanguage")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setShouldAugment(null)}>
              {common("back")}
            </Button>
            <Button onClick={performAugmentation} disabled={isLoading || !currentDataset}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("augmenting")}
                </>
              ) : (
                <>
                  {t("augmentAndContinue")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}

