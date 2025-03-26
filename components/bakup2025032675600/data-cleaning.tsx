//công cụ làm sạch dữ liệu văn bản.
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"

export default function DataCleaning() {
  const t = useTranslations("dataCleaning")
  const common = useTranslations("common")

  const [inputText, setInputText] = useState(
    "Hello, World! This is an example text with numbers like 12345 and symbols like @#$%. There are   extra   spaces   too.",
  )
  const [cleanedText, setCleanedText] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const [options, setOptions] = useState({
    removePunctuation: true,
    removeNumbers: true,
    removeExtraSpaces: true,
    removeSymbols: true,
  })

  const handleOptionChange = (option: keyof typeof options, value: boolean) => {
    setOptions((prev) => ({ ...prev, [option]: value }))
  }

  const cleanText = () => {
    setIsLoading(true)

    setTimeout(() => {
      try {
        let text = inputText

        if (options.removePunctuation) {
          text = text.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "")
        }

        if (options.removeNumbers) {
          text = text.replace(/\d+/g, "")
        }

        if (options.removeExtraSpaces) {
          text = text.replace(/\s+/g, " ").trim()
        }

        if (options.removeSymbols) {
          text = text.replace(/[^\w\s]/g, "")
        }

        setCleanedText(text)
      } catch (error) {
        console.error("Error cleaning text:", error)
      } finally {
        setIsLoading(false)
      }
    }, 500)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="cleaning">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="cleaning">{t("cleaningTools")}</TabsTrigger>
              <TabsTrigger value="examples">{t("examples")}</TabsTrigger>
            </TabsList>

            <TabsContent value="cleaning" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Label htmlFor="input-text">{t("inputText")}</Label>
                  <Textarea
                    id="input-text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={t("inputText")}
                    className="min-h-[200px]"
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="remove-punctuation"
                        checked={options.removePunctuation}
                        onCheckedChange={(checked) => handleOptionChange("removePunctuation", checked as boolean)}
                      />
                      <Label htmlFor="remove-punctuation">{t("removePunctuation")}</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="remove-numbers"
                        checked={options.removeNumbers}
                        onCheckedChange={(checked) => handleOptionChange("removeNumbers", checked as boolean)}
                      />
                      <Label htmlFor="remove-numbers">{t("removeNumbers")}</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="remove-extra-spaces"
                        checked={options.removeExtraSpaces}
                        onCheckedChange={(checked) => handleOptionChange("removeExtraSpaces", checked as boolean)}
                      />
                      <Label htmlFor="remove-extra-spaces">{t("removeExtraSpaces")}</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="remove-symbols"
                        checked={options.removeSymbols}
                        onCheckedChange={(checked) => handleOptionChange("removeSymbols", checked as boolean)}
                      />
                      <Label htmlFor="remove-symbols">{t("removeSymbols")}</Label>
                    </div>
                  </div>

                  <Button onClick={cleanText} disabled={isLoading} className="w-full">
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t("cleaning")}
                      </>
                    ) : (
                      t("cleanText")
                    )}
                  </Button>
                </div>

                <div className="space-y-4">
                  <Label>{t("cleanedText")}</Label>
                  <div className="p-4 border rounded-md bg-muted min-h-[200px] whitespace-pre-wrap">
                    {cleanedText || t("cleanedText")}
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">{t("whatWasRemoved")}:</h3>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      {options.removePunctuation && cleanedText && <li>{t("removePunctuation")}</li>}
                      {options.removeNumbers && cleanedText && <li>{t("removeNumbers")}</li>}
                      {options.removeExtraSpaces && cleanedText && <li>{t("removeExtraSpaces")}</li>}
                      {options.removeSymbols && cleanedText && <li>{t("removeSymbols")}</li>}
                    </ul>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="examples" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">{t("removePunctuation")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="p-2 border rounded-md bg-muted">
                        <p className="text-sm font-medium">Before:</p>
                        <p className="text-sm">Hello, world! How are you today?</p>
                      </div>
                      <div className="p-2 border rounded-md bg-muted">
                        <p className="text-sm font-medium">After:</p>
                        <p className="text-sm">Hello world How are you today</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">{t("removeNumbers")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="p-2 border rounded-md bg-muted">
                        <p className="text-sm font-medium">Before:</p>
                        <p className="text-sm">There are 42 apples and 17 oranges.</p>
                      </div>
                      <div className="p-2 border rounded-md bg-muted">
                        <p className="text-sm font-medium">After:</p>
                        <p className="text-sm">There are apples and oranges.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">{t("removeExtraSpaces")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="p-2 border rounded-md bg-muted">
                        <p className="text-sm font-medium">Before:</p>
                        <p className="text-sm">This text has too many spaces.</p>
                      </div>
                      <div className="p-2 border rounded-md bg-muted">
                        <p className="text-sm font-medium">After:</p>
                        <p className="text-sm">This text has too many spaces.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">{t("removeSymbols")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="p-2 border rounded-md bg-muted">
                        <p className="text-sm font-medium">Before:</p>
                        <p className="text-sm">Email: user@example.com #hashtag $price</p>
                      </div>
                      <div className="p-2 border rounded-md bg-muted">
                        <p className="text-sm font-medium">After:</p>
                        <p className="text-sm">Email userexamplecom hashtag price</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

