"use client"

import { useWorkflow } from "@/context/workflow-context"
import { useTranslations } from "next-intl"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

interface DatasetSelectorProps {
  allowedTypes?: Array<"raw" | "augmented" | "cleaned" | "preprocessed" | "represented" | "classified">
  onChange?: (datasetId: string) => void
}

export function DatasetSelector({ allowedTypes, onChange }: DatasetSelectorProps) {
  const { datasets, currentDataset, selectDataset } = useWorkflow()
  const workflow = useTranslations("workflow")

  const filteredDatasets = allowedTypes ? datasets.filter((d) => allowedTypes.includes(d.type)) : datasets

  const handleChange = (id: string) => {
    selectDataset(id)
    if (onChange) onChange(id)
  }

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{workflow("currentDataset")}</CardTitle>
        <CardDescription>
          {currentDataset ? workflow("datasetInfo", { name: currentDataset.name }) : workflow("noDataset")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Select value={currentDataset?.id} onValueChange={handleChange} disabled={filteredDatasets.length === 0}>
            <SelectTrigger>
              <SelectValue placeholder={workflow("selectDataset")} />
            </SelectTrigger>
            <SelectContent>
              {filteredDatasets.map((dataset) => (
                <SelectItem key={dataset.id} value={dataset.id}>
                  {dataset.name}
                  <Badge variant="outline" className="ml-2">
                    {dataset.type}
                  </Badge>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {currentDataset && (
            <div className="text-sm text-muted-foreground space-y-1">
              <p>{workflow("datasetSize", { size: currentDataset.data.length })}</p>
              <p>{workflow("datasetSource", { source: currentDataset.metadata?.source || "unknown" })}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

