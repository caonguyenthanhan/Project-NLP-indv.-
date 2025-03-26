"use client"

import { useWorkflow } from "@/context/workflow-context"
import { Button } from "@/components/ui/button"
import { ChevronRight } from "lucide-react"
import { useTranslations } from "next-intl"

interface StepIndicatorProps {
  steps: string[]
  currentStep: number
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  const { setCurrentStep } = useWorkflow()
  const common = useTranslations("common")

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex flex-wrap items-center gap-2">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  index === currentStep
                    ? "bg-primary text-primary-foreground"
                    : index < currentStep
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {index + 1}
              </div>
              <div
                className={`ml-2 ${index === currentStep ? "font-medium" : "text-muted-foreground"} text-xs md:text-sm`}
                style={{ whiteSpace: "nowrap" }}
              >
                {step}
              </div>
              {index !== steps.length - 1 && (
                <div className="mx-2 text-muted-foreground hidden md:block">
                  <ChevronRight className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}
        </div>
        <Button onClick={handleNext} disabled={currentStep >= steps.length - 1} className="ml-auto">
          {common("next")}
        </Button>
      </div>
      <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
        <div
          className="bg-primary h-full transition-all duration-300 ease-in-out"
          style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
        ></div>
      </div>
    </div>
  )
}

