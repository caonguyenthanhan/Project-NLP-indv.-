"use client"

import { createContext, useContext, useState } from "react"

const WorkflowContext = createContext()

export function WorkflowProvider({ children }) {
  const [datasets, setDatasets] = useState([])
  const [currentStep, setCurrentStep] = useState(0)

  const addDataset = (dataset) => {
    setDatasets([dataset])
    console.log("Datasets updated:", [dataset]) // Debug
  }
  const currentDataset = datasets[0]

  return (
    <WorkflowContext.Provider value={{ datasets, addDataset, currentDataset, currentStep, setCurrentStep }}>
      {children}
    </WorkflowContext.Provider>
  )
}

export function useWorkflow() {
  return useContext(WorkflowContext)
}