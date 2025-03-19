//công cụ xử lý trước văn bản (text preprocessing).
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"

export default function TextPreprocessing() {
  const t = useTranslations("textPreprocessing")
  const common = useTranslations("common")

  const [inputText, setInputText] = useState(
    "The quick brown fox jumps over the lazy dog. She'd like to know how I'd do that! This sintence has misspelled werds.",
  )
  const [processedText, setProcessedText] = useState("")
  const [sentences, setSentences] = useState<string[]>([])
  const [tokens, setTokens] = useState<string[]>([])
  const [filteredTokens, setFilteredTokens] = useState<string[]>([])
  const [stems, setStems] = useState<string[]>([])
  const [lemmas, setLemmas] = useState<string[]>([])
  const [expandedText, setExpandedText] = useState("")
  const [correctedText, setCorrectedText] = useState("")
  const [entities, setEntities] = useState<Array<{ text: string; label: string }>>([])
  const [isLoading, setIsLoading] = useState(false)

  const [options, setOptions] = useState({
    removeStopwords: true,
    removePunctuation: true,
    removeWhitespace: true,
    lowercase: true,
    stem: true,
    lemmatize: true,
    expandContractions: true,
    correctSpelling: true,
    detectEntities: true,
  })

  const handleOptionChange = (option: keyof typeof options, value: boolean) => {
    setOptions((prev) => ({ ...prev, [option]: value }))
  }

  const processText = async () => {
    setIsLoading(true)

    try {
      // Simulate API call to backend for processing
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Sentence tokenization (simplified simulation)
      const sentenceList = inputText.split(/[.!?]+/).filter((s) => s.trim().length > 0)
      setSentences(sentenceList)

      // Word tokenization (simplified simulation)
      const tokenList = inputText.split(/\s+/).filter((t) => t.length > 0)
      setTokens(tokenList)

      // Filter tokens (remove stopwords, punctuation, etc.)
      const stopwords = [
        "the",
        "a",
        "an",
        "and",
        "or",
        "but",
        "is",
        "are",
        "was",
        "were",
        "to",
        "of",
        "in",
        "for",
        "with",
        "on",
        "at",
        "by",
        "that",
        "this",
        "these",
        "those",
      ]
      const punctuation = [".", ",", "!", "?", ";", ":", '"', "'", "(", ")", "[", "]", "{", "}"]

      let filtered = tokenList

      if (options.removeStopwords) {
        filtered = filtered.filter((t) => !stopwords.includes(t.toLowerCase()))
      }

      if (options.removePunctuation) {
        filtered = filtered.filter((t) => !punctuation.includes(t))
        filtered = filtered.map((t) => t.replace(/[^\w\s]|_/g, ""))
      }

      if (options.lowercase) {
        filtered = filtered.map((t) => t.toLowerCase())
      }

      setFilteredTokens(filtered)

      // Stemming (simplified simulation)
      if (options.stem) {
        // Very basic stemming simulation
        const stemmed = filtered.map((t) => {
          if (t.endsWith("ing")) return t.slice(0, -3)
          if (t.endsWith("ed")) return t.slice(0, -2)
          if (t.endsWith("s")) return t.slice(0, -1)
          if (t.endsWith("ly")) return t.slice(0, -2)
          return t
        })
        setStems(stemmed)
      }

      // Lemmatization (simplified simulation)
      if (options.lemmatize) {
        // Very basic lemmatization simulation
        const lemmaMap: Record<string, string> = {
          am: "be",
          is: "be",
          are: "be",
          was: "be",
          were: "be",
          has: "have",
          had: "have",
          goes: "go",
          went: "go",
          better: "good",
          best: "good",
          worse: "bad",
          worst: "bad",
          running: "run",
          ran: "run",
          saying: "say",
          said: "say",
          jumps: "jump",
          jumped: "jump",
          jumping: "jump",
        }

        const lemmatized = filtered.map((t) => lemmaMap[t.toLowerCase()] || t)
        setLemmas(lemmatized)
      }

      // Expand contractions
      if (options.expandContractions) {
        const contractionMap: Record<string, string> = {
          "I'm": "I am",
          "I'd": "I would",
          "I'll": "I will",
          "I've": "I have",
          "you're": "you are",
          "you'd": "you would",
          "you'll": "you will",
          "you've": "you have",
          "he's": "he is",
          "he'd": "he would",
          "he'll": "he will",
          "she's": "she is",
          "she'd": "she would",
          "she'll": "she will",
          "it's": "it is",
          "it'd": "it would",
          "it'll": "it will",
          "we're": "we are",
          "we'd": "we would",
          "we'll": "we will",
          "we've": "we have",
          "they're": "they are",
          "they'd": "they would",
          "they'll": "they will",
          "they've": "they have",
          "that's": "that is",
          "that'd": "that would",
          "that'll": "that will",
          "who's": "who is",
          "who'd": "who would",
          "who'll": "who will",
          "what's": "what is",
          "what'd": "what would",
          "what'll": "what will",
          "where's": "where is",
          "where'd": "where would",
          "where'll": "where will",
          "when's": "when is",
          "when'd": "when would",
          "when'll": "when will",
          "why's": "why is",
          "why'd": "why would",
          "why'll": "why will",
          "how's": "how is",
          "how'd": "how would",
          "how'll": "how will",
          "isn't": "is not",
          "aren't": "are not",
          "wasn't": "was not",
          "weren't": "were not",
          "haven't": "have not",
          "hasn't": "has not",
          "hadn't": "had not",
          "don't": "do not",
          "doesn't": "does not",
          "didn't": "did not",
          "can't": "cannot",
          "couldn't": "could not",
          "shouldn't": "should not",
          "won't": "will not",
          "wouldn't": "would not",
          "let's": "let us",
          "that's": "that is",
          "who's": "who is",
          "what's": "what is",
          "here's": "here is",
          "there's": "there is",
          "when's": "when is",
          "where's": "where is",
          "why's": "why is",
          "how's": "how is",
        }

        let expanded = inputText
        for (const [contraction, expansion] of Object.entries(contractionMap)) {
          expanded = expanded.replace(new RegExp(contraction, "gi"), expansion)
        }
        setExpandedText(expanded)
      }

      // Spell correction (simplified simulation)
      if (options.correctSpelling) {
        const spellingMap: Record<string, string> = {
          sintence: "sentence",
          werds: "words",
          teh: "the",
          gud: "good",
          recieve: "receive",
          beleive: "believe",
          freind: "friend",
          wierd: "weird",
          acheive: "achieve",
          accomodate: "accommodate",
          accross: "across",
          agressive: "aggressive",
          apparant: "apparent",
          appearence: "appearance",
          arguement: "argument",
          assasination: "assassination",
          basicly: "basically",
          begining: "beginning",
          beleive: "believe",
          belive: "believe",
          buisness: "business",
          calender: "calendar",
          camoflage: "camouflage",
          catagory: "category",
          cemetary: "cemetery",
          changable: "changeable",
          cheif: "chief",
          collegue: "colleague",
          comming: "coming",
          commitee: "committee",
          completly: "completely",
          concious: "conscious",
          curiousity: "curiosity",
          definately: "definitely",
          desparate: "desperate",
          dissapoint: "disappoint",
          embarass: "embarrass",
          enviroment: "environment",
          existance: "existence",
          familar: "familiar",
          finaly: "finally",
          foriegn: "foreign",
          freind: "friend",
          goverment: "government",
          gaurd: "guard",
          happend: "happened",
          harrass: "harass",
          honourary: "honorary",
          humourous: "humorous",
          independant: "independent",
          intresting: "interesting",
          knowlege: "knowledge",
          liason: "liaison",
          libary: "library",
          lisence: "license",
          maintainance: "maintenance",
          millenium: "millennium",
          miniscule: "minuscule",
          mischevious: "mischievous",
          mispell: "misspell",
          neccessary: "necessary",
          noticable: "noticeable",
          occassion: "occasion",
          occurance: "occurrence",
          occured: "occurred",
          paralel: "parallel",
          parliment: "parliament",
          persistant: "persistent",
          posession: "possession",
          prefered: "preferred",
          propoganda: "propaganda",
          publically: "publicly",
          realy: "really",
          recieve: "receive",
          refered: "referred",
          relevent: "relevant",
          religous: "religious",
          remeber: "remember",
          resistence: "resistance",
          responsability: "responsibility",
          rythm: "rhythm",
          seperate: "separate",
          seige: "siege",
          succesful: "successful",
          supercede: "supersede",
          supress: "suppress",
          surpise: "surprise",
          tendancy: "tendency",
          therefor: "therefore",
          threshhold: "threshold",
          tommorow: "tomorrow",
          tounge: "tongue",
          truely: "truly",
          unforseen: "unforeseen",
          unfortunatly: "unfortunately",
          untill: "until",
          wierd: "weird",
        }

        const corrected = inputText
          .split(/\s+/)
          .map((word) => {
            const lowerWord = word.toLowerCase().replace(/[^\w]/g, "")
            return spellingMap[lowerWord] ? word.replace(new RegExp(lowerWord, "i"), spellingMap[lowerWord]) : word
          })
          .join(" ")

        setCorrectedText(corrected)
      }

      // Named Entity Recognition (simplified simulation)
      if (options.detectEntities) {
        const entityPatterns = [
          { pattern: /\b(John|Mary|Robert|Lisa|Michael|Sarah|David|Jennifer|James|Elizabeth)\b/g, label: "PERSON" },
          {
            pattern: /\b(Google|Apple|Microsoft|Amazon|Facebook|Twitter|Netflix|Tesla|IBM|Intel)\b/g,
            label: "ORGANIZATION",
          },
          { pattern: /\b(New York|London|Paris|Tokyo|Berlin|Rome|Moscow|Beijing|Sydney|Cairo)\b/g, label: "LOCATION" },
          {
            pattern:
              /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(st|nd|rd|th)?(,\s+\d{4})?\b/g,
            label: "DATE",
          },
          { pattern: /\b\d{1,2}:\d{2}\s*(am|pm|AM|PM)?\b/g, label: "TIME" },
          { pattern: /\b\$\d+(\.\d{2})?\b/g, label: "MONEY" },
          { pattern: /\b\d+(\.\d+)?%\b/g, label: "PERCENT" },
        ]

        const detectedEntities = []

        for (const { pattern, label } of entityPatterns) {
          let match
          while ((match = pattern.exec(inputText)) !== null) {
            detectedEntities.push({
              text: match[0],
              label,
            })
          }
        }

        setEntities(detectedEntities)
      }

      // Set final processed text
      setProcessedText(
        options.correctSpelling
          ? correctedText
          : options.expandContractions
            ? expandedText
            : options.lemmatize
              ? lemmas.join(" ")
              : options.stem
                ? stems.join(" ")
                : filteredTokens.join(" "),
      )
    } catch (error) {
      console.error("Error processing text:", error)
    } finally {
      setIsLoading(false)
    }
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remove-stopwords"
                      checked={options.removeStopwords}
                      onCheckedChange={(checked) => handleOptionChange("removeStopwords", checked as boolean)}
                    />
                    <Label htmlFor="remove-stopwords">{t("removeStopwords")}</Label>
                  </div>

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
                      id="remove-whitespace"
                      checked={options.removeWhitespace}
                      onCheckedChange={(checked) => handleOptionChange("removeWhitespace", checked as boolean)}
                    />
                    <Label htmlFor="remove-whitespace">{t("removeWhitespace")}</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="lowercase"
                      checked={options.lowercase}
                      onCheckedChange={(checked) => handleOptionChange("lowercase", checked as boolean)}
                    />
                    <Label htmlFor="lowercase">{t("lowercase")}</Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="stem"
                      checked={options.stem}
                      onCheckedChange={(checked) => handleOptionChange("stem", checked as boolean)}
                    />
                    <Label htmlFor="stem">{t("stem")}</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="lemmatize"
                      checked={options.lemmatize}
                      onCheckedChange={(checked) => handleOptionChange("lemmatize", checked as boolean)}
                    />
                    <Label htmlFor="lemmatize">{t("lemmatize")}</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="expand-contractions"
                      checked={options.expandContractions}
                      onCheckedChange={(checked) => handleOptionChange("expandContractions", checked as boolean)}
                    />
                    <Label htmlFor="expand-contractions">{t("expandContractions")}</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="correct-spelling"
                      checked={options.correctSpelling}
                      onCheckedChange={(checked) => handleOptionChange("correctSpelling", checked as boolean)}
                    />
                    <Label htmlFor="correct-spelling">{t("correctSpelling")}</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="detect-entities"
                      checked={options.detectEntities}
                      onCheckedChange={(checked) => handleOptionChange("detectEntities", checked as boolean)}
                    />
                    <Label htmlFor="detect-entities">{t("detectEntities")}</Label>
                  </div>
                </div>
              </div>

              <Button onClick={processText} disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {common("processing")}
                  </>
                ) : (
                  t("processText")
                )}
              </Button>
            </div>

            <div className="space-y-4">
              <Tabs defaultValue="processed">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="processed">{t("processedText")}</TabsTrigger>
                  <TabsTrigger value="tokens">{t("tokens")}</TabsTrigger>
                  <TabsTrigger value="entities">{t("entities")}</TabsTrigger>
                  <TabsTrigger value="steps">{t("steps")}</TabsTrigger>
                </TabsList>

                <TabsContent value="processed" className="space-y-4">
                  <Label>{t("processedText")}</Label>
                  <div className="p-4 border rounded-md bg-muted min-h-[200px] whitespace-pre-wrap">
                    {processedText || t("processedText")}
                  </div>
                </TabsContent>

                <TabsContent value="tokens" className="space-y-4">
                  <Label>{t("tokens")}</Label>
                  <div className="p-4 border rounded-md bg-muted min-h-[200px] overflow-y-auto">
                    {tokens.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {tokens.map((token, i) => (
                          <span key={i} className="px-2 py-1 bg-primary/10 rounded-md text-sm">
                            {token}
                          </span>
                        ))}
                      </div>
                    ) : (
                      t("tokens")
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="entities" className="space-y-4">
                  <Label>{t("entities")}</Label>
                  <div className="p-4 border rounded-md bg-muted min-h-[200px] overflow-y-auto">
                    {entities.length > 0 ? (
                      <div className="space-y-2">
                        {entities.map((entity, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className="px-2 py-1 bg-primary/10 rounded-md text-sm">{entity.text}</span>
                            <span className="text-xs px-2 py-0.5 bg-secondary text-secondary-foreground rounded-full">
                              {entity.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      t("entities")
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="steps" className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <Label>Original Text</Label>
                      <div className="p-2 border rounded-md bg-muted mt-1">{inputText}</div>
                    </div>

                    <Separator />

                    {options.expandContractions && (
                      <div>
                        <Label>{t("expandContractions")}</Label>
                        <div className="p-2 border rounded-md bg-muted mt-1">{expandedText || t("processedText")}</div>
                      </div>
                    )}

                    {options.correctSpelling && (
                      <div>
                        <Label>{t("correctSpelling")}</Label>
                        <div className="p-2 border rounded-md bg-muted mt-1">{correctedText || t("processedText")}</div>
                      </div>
                    )}

                    {filteredTokens.length > 0 && (
                      <div>
                        <Label>Filtered Tokens</Label>
                        <div className="p-2 border rounded-md bg-muted mt-1 flex flex-wrap gap-1">
                          {filteredTokens.map((token, i) => (
                            <span key={i} className="px-1.5 py-0.5 bg-primary/10 rounded text-xs">
                              {token}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {options.stem && stems.length > 0 && (
                      <div>
                        <Label>{t("stem")}</Label>
                        <div className="p-2 border rounded-md bg-muted mt-1 flex flex-wrap gap-1">
                          {stems.map((stem, i) => (
                            <span key={i} className="px-1.5 py-0.5 bg-primary/10 rounded text-xs">
                              {stem}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {options.lemmatize && lemmas.length > 0 && (
                      <div>
                        <Label>{t("lemmatize")}</Label>
                        <div className="p-2 border rounded-md bg-muted mt-1 flex flex-wrap gap-1">
                          {lemmas.map((lemma, i) => (
                            <span key={i} className="px-1.5 py-0.5 bg-primary/10 rounded text-xs">
                              {lemma}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

