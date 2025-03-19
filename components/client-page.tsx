"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StepIndicator } from "@/components/step-indicator"
import DataCollection from "@/components/data-collection"
import DataCleaning from "@/components/data-cleaning"
import DataPreprocessing from "@/components/text-preprocessing"
import TextRepresentation from "@/components/text-representation"
import DataAugmentation from "@/components/data-augmentation"

export default function ClientPage() {
  const t = useTranslations()
  const nav = useTranslations("nav")

  const steps = [
    nav("dataCollection"),
    nav("dataCleaning"),
    nav("dataPreprocessing"),
    nav("textRepresentation"),
    nav("dataAugmentation"),
  ]

  const [currentStep, setCurrentStep] = useState(0)

  const handleTabChange = (value: string) => {
    const stepIndex = {
      collection: 0,
      cleaning: 1,
      preprocessing: 2,
      representation: 3,
      augmentation: 4,
    }[value]
    setCurrentStep(stepIndex)
  }

  return (
    <>
      <StepIndicator currentStep={currentStep} steps={steps} />
      <Tabs defaultValue="collection" className="w-full" onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="collection">1. {nav("dataCollection")}</TabsTrigger>
          <TabsTrigger value="cleaning">2. {nav("dataCleaning")}</TabsTrigger>
          <TabsTrigger value="preprocessing">3. {nav("dataPreprocessing")}</TabsTrigger>
          <TabsTrigger value="representation">4. {nav("textRepresentation")}</TabsTrigger>
          <TabsTrigger value="augmentation">5. {nav("dataAugmentation")}</TabsTrigger>
        </TabsList>
        <TabsContent value="collection"><DataCollection /></TabsContent>
        <TabsContent value="cleaning"><DataCleaning /></TabsContent>
        <TabsContent value="preprocessing"><DataPreprocessing /></TabsContent>
        <TabsContent value="representation"><TextRepresentation /></TabsContent>
        <TabsContent value="augmentation"><DataAugmentation /></TabsContent>
      </Tabs>
    </>
  )
}