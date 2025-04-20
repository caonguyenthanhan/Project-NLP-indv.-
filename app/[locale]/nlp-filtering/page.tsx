import { useTranslations } from "next-intl"

export default function NLPFiltering() {
  const t = useTranslations("nlpFiltering")

  return (
    <div className="container mx-auto py-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">{t("title")}</h1>
        <p className="text-xl text-muted-foreground">{t("description")}</p>
      </div>
    </div>
  )
} 