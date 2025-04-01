"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

export type DatasetType = "raw" | "augmented" | "cleaned" | "preprocessed" | "represented" | "classified"

export interface Dataset {
  id: string
  name: string
  type: DatasetType
  data: any[]
  metadata?: {
    source?: string
    createdAt?: string
    size?: number
    [key: string]: any
  }
}

interface WorkflowContextType {
  datasets: Dataset[]
  currentDataset: Dataset | null
  currentStep: number
  addDataset: (dataset: Dataset) => void
  updateDataset: (id: string, updates: Partial<Dataset>) => void
  selectDataset: (id: string) => void
  setCurrentStep: (step: number) => void
  getDatasetsByType: (type: DatasetType) => Dataset[]
}

const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined)

export function WorkflowProvider({ children }: { children: ReactNode }) {
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [currentDatasetId, setCurrentDatasetId] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(0)

  const currentDataset = datasets.find((d) => d.id === currentDatasetId) || null

  const addDataset = (dataset: Dataset) => {
    setDatasets((prev) => [...prev, dataset])
    if (!currentDatasetId) {
      setCurrentDatasetId(dataset.id)
    }
  }

  const updateDataset = (id: string, updates: Partial<Dataset>) => {
    setDatasets((prev) => prev.map((dataset) => (dataset.id === id ? { ...dataset, ...updates } : dataset)))
  }

  const selectDataset = (id: string) => {
    setCurrentDatasetId(id)
  }

  const getDatasetsByType = (type: DatasetType) => {
    return datasets.filter((dataset) => dataset.type === type)
  }

  return (
    <WorkflowContext.Provider
      value={{
        datasets,
        currentDataset,
        currentStep,
        addDataset,
        updateDataset,
        selectDataset,
        setCurrentStep,
        getDatasetsByType,
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

