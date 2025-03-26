"\"use client"

import { useWorkflow } from "@/context/workflow-context"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTranslations } from "next-intl"

interface DatasetSelectorProps {
  allowedTypes?: string[]
}

export function DatasetSelector({ allowedTypes }: DatasetSelectorProps) {
  const { datasets, currentDataset, selectDataset } = useWorkflow()
  const t = useTranslations("workflow")

  const filteredDatasets = allowedTypes ? datasets.filter((dataset) => allowedTypes.includes(dataset.type)) : datasets

  return (
    <div className="space-y-2">
      <Label htmlFor="dataset-select">{t("selectDataset")}</Label>
      <Select onValueChange={selectDataset} defaultValue={currentDataset?.id || ""}>
        <SelectTrigger id="dataset-select">
          <SelectValue
            placeholder={currentDataset ? t("datasetInfo", { name: currentDataset.name }) : t("noDataset")}
          />
        </SelectTrigger>
        <SelectContent>
          {filteredDatasets.length > 0 ? (
            filteredDatasets.map((dataset) => (
              <SelectItem key={dataset.id} value={dataset.id}>
                {dataset.name}
              </SelectItem>
            ))
          ) : (
            <SelectItem disabled value="">
              No datasets available
            </SelectItem>
          )}
        </SelectContent>
      </Select>
      {currentDataset && (
        <div className="text-sm text-muted-foreground">
          {t("datasetSize", { size: currentDataset.data.length })} •{" "}
          {t("datasetSource", { source: currentDataset.metadata?.source || "Unknown" })}
        </div>
      )}
    </div>
  )
}

