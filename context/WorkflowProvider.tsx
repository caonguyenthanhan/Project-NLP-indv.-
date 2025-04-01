"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface Dataset {
  name: string;
  data: { text: string; label: string | null }[];
  type: string;
}

interface WorkflowContextType {
  datasets: Dataset[];
  addDataset: (dataset: Dataset) => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
}

const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined);

export function WorkflowProvider({ children }: { children: ReactNode }) {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [currentStep, setCurrentStep] = useState(1); // Bắt đầu từ bước 1

  const addDataset = (dataset: Dataset) => {
    setDatasets((prev) => [...prev, dataset]);
  };

  return (
    <WorkflowContext.Provider
      value={{ datasets, addDataset, currentStep, setCurrentStep }}
    >
      {children}
    </WorkflowContext.Provider>
  );
}

export function useWorkflow() {
  const context = useContext(WorkflowContext);
  if (!context) {
    throw new Error("useWorkflow must be used within a WorkflowProvider");
  }
  return context;
}