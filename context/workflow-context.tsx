"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

interface Dataset {
  id: string
  name: string
  data: any[]
  type: "raw" | "augmented" | "cleaned" | "preprocessed" | "represented" | "classified"
  metadata?: Record<string, any>
}

interface WorkflowContextType {
  // Datasets
  datasets: Dataset[]
  currentDataset: Dataset | null
  addDataset: (dataset: Omit<Dataset, "id">) => void
  updateDataset: (id: string, updates: Partial<Omit<Dataset, "id">>) => void
  selectDataset: (id: string) => void

  // Step tracking
  currentStep: number
  setCurrentStep: (step: number) => void

  // Step completion status
  completedSteps: Record<number, boolean>
  markStepCompleted: (step: number) => void

  // Temporary data for current processing
  tempData: any
  setTempData: (data: any) => void
}

const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined)

export function WorkflowProvider({ children }: { children: ReactNode }) {
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [currentDatasetId, setCurrentDatasetId] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({})
  const [tempData, setTempData] = useState<any>(null)

  const currentDataset = datasets.find((d) => d.id === currentDatasetId) || null

  const addDataset = (dataset: Omit<Dataset, "id">) => {
    const id = `dataset-${Date.now()}`
    const newDataset = { ...dataset, id }
    setDatasets((prev) => [...prev, newDataset])
    return id
  }

  const updateDataset = (id: string, updates: Partial<Omit<Dataset, "id">>) => {
    setDatasets((prev) => prev.map((dataset) => (dataset.id === id ? { ...dataset, ...updates } : dataset)))
  }

  const selectDataset = (id: string) => {
    setCurrentDatasetId(id)
  }

  const markStepCompleted = (step: number) => {
    setCompletedSteps((prev) => ({ ...prev, [step]: true }))
  }

  return (
    <WorkflowContext.Provider
      value={{
        datasets,
        currentDataset,
        addDataset,
        updateDataset,
        selectDataset,
        currentStep,
        setCurrentStep,
        completedSteps,
        markStepCompleted,
        tempData,
        setTempData,
      }}
    >
      {children}
    </WorkflowContext.Provider>
  )
}

export function useWorkflow() {
  const context = useContext(WorkflowContext)
  if (context === undefined) {
    throw new Error("useWorkflow must be used within a WorkflowProvider")
  }
  return context
}

