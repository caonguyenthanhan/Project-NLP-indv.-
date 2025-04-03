// components/dataset-selector.tsx
"use client"

import { useTranslations } from "next-intl"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useWorkflow } from "@/context/workflow-context"

export default function DatasetSelector({ value, onValueChange, allowedTypes }) {
  const t = useTranslations("datasetSelector")
  const { datasets } = useWorkflow()

  // Lọc các dataset có id hợp lệ và thuộc allowedTypes (nếu có)
  const validDatasets = datasets.filter(
    (dataset) =>
      dataset &&
      dataset.id &&
      dataset.id.trim() !== "" &&
      (!allowedTypes || allowedTypes.includes(dataset.type))
  )

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder={t("selectDataset")} />
      </SelectTrigger>
      <SelectContent>
        {validDatasets.length > 0 ? (
          validDatasets.map((dataset) => (
            <SelectItem key={dataset.id} value={dataset.id}>
              {dataset.name || "Unnamed Dataset"}
            </SelectItem>
          ))
        ) : (
          <SelectItem value="no-data" disabled>
            {t("noDatasetsAvailable")}
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  )
}