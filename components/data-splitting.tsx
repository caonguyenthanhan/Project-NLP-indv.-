import React, { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { ToastContainer } from "@/components/ui/use-toast"

const DataSplitting: React.FC = () => {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = React.useState(false)
  const [currentDataset, setCurrentDataset] = React.useState<Dataset | null>(null)

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !isLoading) {
      splitData()
    } else if (e.key === "Backspace" && !isLoading) {
      skipSplitting()
    }
  }

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isLoading])

  const splitData = () => {
    // Implementation of splitData
  }

  const skipSplitting = () => {
    // Implementation of skipSplitting
  }

  return (
    <div className="space-y-6">
      <ToastContainer />
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent>
          {currentDataset ? (
            <div>
              <p>{t("datasetSize", { size: currentDataset.metadata?.size || 0 })}</p>
              <p className="text-sm text-muted-foreground mt-2">{t("splittingDecisionDescription")}</p>
            </div>
          ) : (
            <p className="text-red-500">{t("noData")}</p>
          )}
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          <Button 
            onClick={splitData} 
            disabled={isLoading || !currentDataset}
            title={t("enterToSplit")}
          >
            {isLoading ? <Loader2 className="animate-spin" /> : t("split")}
          </Button>
          <Button 
            onClick={skipSplitting} 
            variant="outline"
            title={t("backspaceToSkip")}
          >
            {t("next")}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

export default DataSplitting 