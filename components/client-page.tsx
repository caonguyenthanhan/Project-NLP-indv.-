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
// First, import the TextClassification component
import TextClassification from "@/components/text-classification"

export default function ClientPage() {
  const t = useTranslations()
  const nav = useTranslations("nav")

  // Update the steps array to include the new step
  const steps = [
    nav("dataCollection"),
    nav("dataAugmentation"),
    nav("dataCleaning"),
    nav("dataPreprocessing"),
    nav("textRepresentation"),
    nav("textClassification"),
  ]

  const [currentStep, setCurrentStep] = useState(0)

  // Update the handleTabChange function to include the new step
  const handleTabChange = (value: string) => {
    const stepIndex = {
      collection: 0,
      augmentation: 1,
      cleaning: 2,
      preprocessing: 3,
      representation: 4,
      classification: 5,
    }[value]

    setCurrentStep(stepIndex)
  }

  return (
    <>
      <StepIndicator currentStep={currentStep} steps={steps} />

      <Tabs defaultValue="collection" className="w-full" onValueChange={handleTabChange}>
        {/* Update the TabsList to include the new tab */}
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="collection">1. {nav("dataCollection")}</TabsTrigger>
          <TabsTrigger value="augmentation">2. {nav("dataAugmentation")}</TabsTrigger>
          <TabsTrigger value="cleaning">3. {nav("dataCleaning")}</TabsTrigger>
          <TabsTrigger value="preprocessing">4. {nav("dataPreprocessing")}</TabsTrigger>
          <TabsTrigger value="representation">5. {nav("textRepresentation")}</TabsTrigger>
          <TabsTrigger value="classification">6. {nav("textClassification")}</TabsTrigger>
        </TabsList>

        <TabsContent value="collection">
          <DataCollection />
        </TabsContent>

        <TabsContent value="augmentation">
          <DataAugmentation />
        </TabsContent>

        <TabsContent value="cleaning">
          <DataCleaning />
        </TabsContent>

        <TabsContent value="preprocessing">
          <DataPreprocessing />
        </TabsContent>

        <TabsContent value="representation">
          <TextRepresentation />
        </TabsContent>

        {/* Add the new TabsContent for Text Classification */}
        <TabsContent value="classification">
          <TextClassification />
        </TabsContent>
      </Tabs>
    </>
  )
}

