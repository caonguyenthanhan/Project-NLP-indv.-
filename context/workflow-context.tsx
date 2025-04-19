// context/workflow-context.js
"use client"

import { createContext, useContext, useState, ReactNode } from "react"
import { v4 as uuidv4 } from "uuid"
import { Dataset } from '@/types/dataset'

interface WorkflowContextType {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  datasets: Dataset[];
  setDatasets: (datasets: Dataset[]) => void;
  setCurrentDataset: (dataset: Dataset) => void;
  currentDataset: Dataset | null;
}

interface WorkflowProviderProps {
  children: ReactNode;
}

const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined);

export function WorkflowProvider({ children }: WorkflowProviderProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [currentDataset, setCurrentDataset] = useState<Dataset | null>(null)

  const value = {
    currentStep,
    setCurrentStep,
    datasets,
    setDatasets,
    setCurrentDataset,
    currentDataset,
  }

  return (
    <WorkflowContext.Provider value={value}>
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