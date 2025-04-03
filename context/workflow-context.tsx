// context/workflow-context.js
"use client"

import { createContext, useContext, useState } from "react"
import { v4 as uuidv4 } from "uuid"

const WorkflowContext = createContext()

export function WorkflowProvider({ children }) {
  const [datasets, setDatasets] = useState([])
  const [currentStep, setCurrentStep] = useState(0)

  const addDataset = (dataset) => {
    // Đảm bảo dataset có id hợp lệ
    const newDataset = {
      ...dataset,
      id: dataset.id || uuidv4(), // Nếu không có id, tạo mới
    }
    setDatasets([newDataset])
    console.log("Datasets updated:", [newDataset])
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