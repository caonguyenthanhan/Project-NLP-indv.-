"use client"
import { useTranslations } from "next-intl"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StepIndicator } from "@/components/step-indicator"
import DataCollection from "@/components/data-collection"
import DataCleaning from "@/components/data-cleaning"
import DataPreprocessing from "@/components/text-preprocessing"
import TextRepresentation from "@/components/text-representation"
import DataAugmentation from "@/components/data-augmentation"
import TextClassification from "@/components/text-classification"
import { WorkflowProvider, useWorkflow } from "@/context/workflow-context"
import styles from "./styles.module.css"

function ClientPageContent() {
  const t = useTranslations()
  const nav = useTranslations("nav")
  const { currentStep, setCurrentStep } = useWorkflow()

  const steps = [
    nav("dataCollection"),
    nav("dataAugmentation"),
    nav("dataCleaning"),
    nav("dataPreprocessing"),
    nav("textRepresentation"),
    nav("textClassification"),
  ]

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

  const getTabValue = () => {
    const values = ["collection", "augmentation", "cleaning", "preprocessing", "representation", "classification"]
    return values[currentStep]
  }

  return (
    <>
      <StepIndicator currentStep={currentStep} steps={steps} />

      <Tabs value={getTabValue()} className="w-full mt-6" onValueChange={handleTabChange}>
        <TabsList className={styles.tabsList}>
          <TabsTrigger value="collection" className="text-xs md:text-sm">
            1. {nav("dataCollection")}
          </TabsTrigger>
          <TabsTrigger value="augmentation" className="text-xs md:text-sm">
            2. {nav("dataAugmentation")}
          </TabsTrigger>
          <TabsTrigger value="cleaning" className="text-xs md:text-sm">
            3. {nav("dataCleaning")}
          </TabsTrigger>
          <TabsTrigger value="preprocessing" className="text-xs md:text-sm">
            4. {nav("dataPreprocessing")}
          </TabsTrigger>
          <TabsTrigger value="representation" className="text-xs md:text-sm">
            5. {nav("textRepresentation")}
          </TabsTrigger>
          <TabsTrigger value="classification" className="text-xs md:text-sm">
            6. {nav("textClassification")}
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
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

          <TabsContent value="classification">
            <TextClassification />
          </TabsContent>
        </div>
      </Tabs>
    </>
  )
}

export default function ClientPage() {
  return (
    <WorkflowProvider>
      <ClientPageContent />
    </WorkflowProvider>
  )
}

