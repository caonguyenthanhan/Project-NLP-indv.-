//Một thành phần hiển thị tiến trình theo bước (step indicator).

import { cn } from "@/lib/utils"

interface StepIndicatorProps {
  currentStep: number
  steps: string[]
}

export function StepIndicator({ currentStep, steps }: StepIndicatorProps) {
  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={index} className="flex flex-col items-center">
            <div className="relative flex items-center justify-center">
              <div
                className={cn(
                  "h-10 w-10 rounded-full border-2 flex items-center justify-center font-medium",
                  index < currentStep
                    ? "border-primary bg-primary text-primary-foreground"
                    : index === currentStep
                      ? "border-primary text-primary"
                      : "border-muted-foreground text-muted-foreground",
                )}
              >
                {index + 1}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "absolute top-1/2 left-10 h-0.5 w-[calc(100vw/6)] -translate-y-1/2",
                    index < currentStep ? "bg-primary" : "bg-muted-foreground/30",
                  )}
                />
              )}
            </div>
            <span
              className={cn(
                "mt-2 text-xs",
                index === currentStep ? "font-medium text-primary" : "text-muted-foreground",
              )}
            >
              {step}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

