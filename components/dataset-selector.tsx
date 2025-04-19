// components/dataset-selector.tsx
"use client"

import { useTranslations } from "next-intl"
import { useWorkflow } from "@/context/workflow-context"
import { Button } from "./ui/button"
import { Dataset } from "@/types/dataset"

export default function DatasetSelector() {
  const t = useTranslations("datasetSelector")
  const { datasets, currentDataset, setCurrentDataset } = useWorkflow()

  if (!datasets) {
    return (
      <div className="text-center py-4">
        <p>{t("noDatasetsAvailable")}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{t("selectDataset")}</h3>
      <div className="grid grid-cols-1 gap-2">
        {datasets.map((dataset: Dataset) => (
          <Button
            key={dataset.id}
            variant={currentDataset?.id === dataset.id ? "default" : "outline"}
            onClick={() => setCurrentDataset(dataset)}
            className="w-full justify-start"
          >
            {dataset.name}
          </Button>
        ))}
      </div>
    </div>
  )
}