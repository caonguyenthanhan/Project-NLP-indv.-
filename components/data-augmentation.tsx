//công cụ tăng cường dữ liệu văn bản (data augmentation).
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Download } from "lucide-react"
import { useTranslations } from "next-intl"

export default function DataAugmentation() {
  const t = useTranslations("dataAugmentation")
  const common = useTranslations("common")

  const [inputText, setInputText] = useState("The quick brown fox jumps over the lazy dog.")
  const [augmentedTexts, setAugmentedTexts] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Augmentation parameters
  const [synonymProbability, setSynonymProbability] = useState(0.3)
  const [noiseProbability, setNoiseProbability] = useState(0.1)
  const [deletionProbability, setDeletionProbability] = useState(0.2)
  const [backTranslationLanguage, setBackTranslationLanguage] = useState("fr")

  const performAugmentation = () => {
    setIsLoading(true)

    setTimeout(() => {
      try {
        // Simulate augmentation techniques

        // 1. Synonym Replacement
        const synonymReplacement = simulateSynonymReplacement(inputText, synonymProbability)

        // 2. Word Shuffling
        const wordShuffling = simulateWordShuffling(inputText)

        // 3. Noise Injection
        const noiseInjection = simulateNoiseInjection(inputText, noiseProbability)

        // 4. Random Word Deletion
        const randomDeletion = simulateRandomDeletion(inputText, deletionProbability)

        // 5. Back Translation
        const backTranslation = simulateBackTranslation(inputText, backTranslationLanguage)

        // 6. Contextual Word Substitution
        const contextualSubstitution = simulateContextualSubstitution(inputText)

        setAugmentedTexts([
          synonymReplacement,
          wordShuffling,
          noiseInjection,
          randomDeletion,
          backTranslation,
          contextualSubstitution,
        ])
      } catch (error) {
        console.error("Error performing augmentation:", error)
      } finally {
        setIsLoading(false)
      }
    }, 1500)
  }

  const simulateSynonymReplacement = (text: string, probability: number) => {
    const words = text.split(" ")
    const result = words
      .map((word) => {
        if (Math.random() < probability) {
          // Simulate synonym replacement with a simple mapping
          const synonymMap: Record<string, string[]> = {
            quick: ["fast", "rapid", "swift"],
            brown: ["tan", "chestnut", "amber"],
            fox: ["vixen", "reynard", "canid"],
            jumps: ["leaps", "hops", "springs"],
            over: ["above", "across", "beyond"],
            lazy: ["idle", "sluggish", "indolent"],
            dog: ["canine", "hound", "pooch"],
          }

          const synonyms = synonymMap[word.toLowerCase()] || []
          if (synonyms.length > 0) {
            return synonyms[Math.floor(Math.random() * synonyms.length)]
          }
        }
        return word
      })
      .join(" ")

    return result
  }

  const simulateWordShuffling = (text: string) => {
    const words = text.split(" ")

    // Fisher-Yates shuffle algorithm
    for (let i = words.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[words[i], words[j]] = [words[j], words[i]]
    }

    return words.join(" ")
  }

  const simulateNoiseInjection = (text: string, probability: number) => {
    const chars = text.split("")
    const result = chars
      .map((char) => {
        if (Math.random() < probability && /[a-zA-Z]/.test(char)) {
          // Replace with a random letter
          const letters = "abcdefghijklmnopqrstuvwxyz"
          return letters[Math.floor(Math.random() * letters.length)]
        }
        return char
      })
      .join("")

    return result
  }

  const simulateRandomDeletion = (text: string, probability: number) => {
    const words = text.split(" ")
    const result = words.filter(() => Math.random() > probability)

    // Ensure at least one word remains
    if (result.length === 0 && words.length > 0) {
      return words[Math.floor(Math.random() * words.length)]
    }

    return result.join(" ")
  }

  const simulateBackTranslation = (text: string, language: string) => {
    // Simulate back translation with predefined examples
    const backTranslations: Record<string, Record<string, string>> = {
      fr: {
        "The quick brown fox jumps over the lazy dog.": "The fast brown fox leaps over the idle dog.",
        "Hello world": "Hello to the world",
        "I love programming": "I adore coding",
      },
      es: {
        "The quick brown fox jumps over the lazy dog.": "The rapid brown fox jumps above the sleepy dog.",
        "Hello world": "Hello to the world",
        "I love programming": "I love to program",
      },
      de: {
        "The quick brown fox jumps over the lazy dog.": "The swift brown fox jumps over the sluggish dog.",
        "Hello world": "Hello to the world",
        "I love programming": "I love to code",
      },
    }

    return backTranslations[language]?.[text] || `${text} (translated to ${language} and back)`
  }

  const simulateContextualSubstitution = (text: string) => {
    // Simulate contextual substitution with predefined examples
    const substitutions: Record<string, string> = {
      "The quick brown fox jumps over the lazy dog.": "The swift brown fox leaps over the sleeping dog.",
      "Hello world": "Greetings universe",
      "I love programming": "I enjoy coding",
    }

    return (
      substitutions[text] ||
      text.replace(/\b\w{5,}\b/g, (match) => {
        // Replace some longer words with alternatives
        const alternatives: Record<string, string> = {
          quick: "rapid",
          jumps: "leaps",
          brown: "tawny",
          lazy: "sleepy",
        }

        return alternatives[match.toLowerCase()] || match
      })
    )
  }

  const downloadAugmentedData = () => {
    // Create CSV content
    const csvContent = [
      "Original Text,Augmented Text,Technique",
      ...augmentedTexts.map((text, index) => {
        const technique = [
          t("synonymReplacement"),
          t("wordShuffling"),
          t("noiseInjection"),
          t("randomWordDeletion"),
          t("backTranslation"),
          t("contextualWordSubstitution"),
        ][index]

        return `"${inputText}","${text}","${technique}"`
      }),
    ].join("\n")

    // Create a blob and download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", "augmented_data.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <CardContent>
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

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="synonym-probability">{t("synonymReplacementProbability")}</Label>
                    <span className="text-sm text-muted-foreground">{synonymProbability.toFixed(2)}</span>
                  </div>
                  <Slider
                    id="synonym-probability"
                    min={0}
                    max={1}
                    step={0.05}
                    value={[synonymProbability]}
                    onValueChange={(value) => setSynonymProbability(value[0])}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="noise-probability">{t("noiseInjectionProbability")}</Label>
                    <span className="text-sm text-muted-foreground">{noiseProbability.toFixed(2)}</span>
                  </div>
                  <Slider
                    id="noise-probability"
                    min={0}
                    max={0.5}
                    step={0.05}
                    value={[noiseProbability]}
                    onValueChange={(value) => setNoiseProbability(value[0])}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="deletion-probability">{t("wordDeletionProbability")}</Label>
                    <span className="text-sm text-muted-foreground">{deletionProbability.toFixed(2)}</span>
                  </div>
                  <Slider
                    id="deletion-probability"
                    min={0}
                    max={0.5}
                    step={0.05}
                    value={[deletionProbability]}
                    onValueChange={(value) => setDeletionProbability(value[0])}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="back-translation-language">{t("backTranslationLanguage")}</Label>
                  <Select value={backTranslationLanguage} onValueChange={setBackTranslationLanguage}>
                    <SelectTrigger id="back-translation-language">
                      <SelectValue placeholder={t("backTranslationLanguage")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={performAugmentation} disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("augmenting")}
                  </>
                ) : (
                  t("augmentText")
                )}
              </Button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>{t("augmentedResults")}</Label>
                {augmentedTexts.length > 0 && (
                  <Button variant="outline" size="sm" onClick={downloadAugmentedData}>
                    <Download className="h-4 w-4 mr-2" />
                    {common("download")} CSV
                  </Button>
                )}
              </div>

              {augmentedTexts.length > 0 ? (
                <Tabs defaultValue="synonym">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="synonym">{t("synonymReplacement")}</TabsTrigger>
                    <TabsTrigger value="shuffle">{t("wordShuffling")}</TabsTrigger>
                    <TabsTrigger value="noise">{t("noiseInjection")}</TabsTrigger>
                  </TabsList>
                  <TabsList className="grid w-full grid-cols-3 mt-1">
                    <TabsTrigger value="deletion">{t("randomWordDeletion")}</TabsTrigger>
                    <TabsTrigger value="translation">{t("backTranslation")}</TabsTrigger>
                    <TabsTrigger value="contextual">{t("contextualWordSubstitution")}</TabsTrigger>
                  </TabsList>

                  <TabsContent value="synonym" className="mt-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">{t("synonymReplacement")}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">{augmentedTexts[0]}</p>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="shuffle" className="mt-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">{t("wordShuffling")}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">{augmentedTexts[1]}</p>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="noise" className="mt-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">{t("noiseInjection")}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">{augmentedTexts[2]}</p>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="deletion" className="mt-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">{t("randomWordDeletion")}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">{augmentedTexts[3]}</p>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="translation" className="mt-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">
                          {t("backTranslation")} ({backTranslationLanguage})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">{augmentedTexts[4]}</p>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="contextual" className="mt-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">{t("contextualWordSubstitution")}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">{augmentedTexts[5]}</p>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="p-8 text-center text-muted-foreground border rounded-md">{t("augmentedResults")}</div>
              )}

              {augmentedTexts.length > 0 && (
                <div className="space-y-2 mt-4">
                  <Label>{t("allAugmentations")}</Label>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto p-2 border rounded-md">
                    {augmentedTexts.map((text, index) => {
                      const techniques = [
                        t("synonymReplacement"),
                        t("wordShuffling"),
                        t("noiseInjection"),
                        t("randomWordDeletion"),
                        t("backTranslation"),
                        t("contextualWordSubstitution"),
                      ]

                      return (
                        <div key={index} className="p-2 border-b last:border-0">
                          <div className="text-xs font-medium text-muted-foreground mb-1">{techniques[index]}</div>
                          <div className="text-sm">{text}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

