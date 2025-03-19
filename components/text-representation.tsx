//công cụ biểu diễn văn bản (text representation).
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
} from "recharts"

export default function TextRepresentation() {
  const t = useTranslations("textRepresentation")
  const common = useTranslations("common")

  const [documents, setDocuments] = useState([
    "The quick brown fox jumps over the lazy dog.",
    "A quick brown dog outpaces the fox.",
    "The lazy dog sleeps all day long.",
    "Foxes are known for being quick and clever animals.",
  ])
  const [currentDocument, setCurrentDocument] = useState("")
  const [activeTab, setActiveTab] = useState("basic")
  const [activeBasicMethod, setActiveBasicMethod] = useState("one-hot")
  const [activeAdvancedMethod, setActiveAdvancedMethod] = useState("word2vec")
  const [isLoading, setIsLoading] = useState(false)

  // One-Hot Encoding state
  const [oneHotMatrix, setOneHotMatrix] = useState<number[][]>([])
  const [oneHotVocabulary, setOneHotVocabulary] = useState<string[]>([])
  const [oneHotTokens, setOneHotTokens] = useState<string[]>([])

  // Bag of Words state
  const [bowMatrix, setBowMatrix] = useState<number[][]>([])
  const [bowVocabulary, setBowVocabulary] = useState<string[]>([])

  // N-Grams state
  const [ngramMatrix, setNgramMatrix] = useState<any[]>([])
  const [ngramVocabulary, setNgramVocabulary] = useState<string[]>([])
  const [ngramRange, setNgramRange] = useState(2)

  // TF-IDF state
  const [tfidfMatrix, setTfidfMatrix] = useState<number[][]>([])
  const [tfidfVocabulary, setTfidfVocabulary] = useState<string[]>([])
  const [tfidfChartData, setTfidfChartData] = useState<any[]>([])

  // Word Embeddings state
  const [wordEmbeddings, setWordEmbeddings] = useState<Record<string, number[]>>({})
  const [selectedWords, setSelectedWords] = useState<string[]>([])
  const [wordInput, setWordInput] = useState("")
  const [similarityResults, setSimilarityResults] = useState<{ word1: string; word2: string; similarity: number }[]>([])
  const [visualizationData, setVisualizationData] = useState<any[]>([])

  // Options
  const [options, setOptions] = useState({
    removeStopwords: true,
    removePunctuation: true,
    lowercase: true,
  })

  const handleOptionChange = (option: keyof typeof options, value: boolean) => {
    setOptions((prev) => ({ ...prev, [option]: value }))
  }

  const addDocument = () => {
    if (currentDocument.trim()) {
      setDocuments([...documents, currentDocument])
      setCurrentDocument("")
    }
  }

  const processOneHot = () => {
    setIsLoading(true)

    setTimeout(() => {
      try {
        // Preprocess documents
        const processedDoc = documents[0]
          .toLowerCase()
          .replace(/[^\w\s]/g, "")
          .split(/\s+/)
          .filter((word) => word.length > 0)

        // Create vocabulary (unique words)
        const vocabulary = Array.from(
          new Set(
            documents
              .join(" ")
              .toLowerCase()
              .replace(/[^\w\s]/g, "")
              .split(/\s+/)
              .filter((word) => word.length > 0),
          ),
        ).sort()

        // Create one-hot encoding matrix
        const matrix: number[][] = []
        for (const word of processedDoc) {
          const vector = new Array(vocabulary.length).fill(0)
          const index = vocabulary.indexOf(word)
          if (index !== -1) {
            vector[index] = 1
          }
          matrix.push(vector)
        }

        setOneHotMatrix(matrix)
        setOneHotVocabulary(vocabulary)
        setOneHotTokens(processedDoc)
      } catch (error) {
        console.error("Error processing one-hot encoding:", error)
      } finally {
        setIsLoading(false)
      }
    }, 1000)
  }

  const processBagOfWords = () => {
    setIsLoading(true)

    setTimeout(() => {
      try {
        // Preprocess documents
        const processedDocs = documents.map((doc) =>
          doc
            .toLowerCase()
            .replace(/[^\w\s]/g, "")
            .split(/\s+/)
            .filter((word) => word.length > 0),
        )

        // Create vocabulary (unique words)
        const vocabulary = Array.from(
          new Set(
            documents
              .join(" ")
              .toLowerCase()
              .replace(/[^\w\s]/g, "")
              .split(/\s+/)
              .filter((word) => word.length > 0),
          ),
        ).sort()

        // Create bag of words matrix
        const matrix: number[][] = []
        for (const doc of processedDocs) {
          const vector = new Array(vocabulary.length).fill(0)
          for (const word of doc) {
            const index = vocabulary.indexOf(word)
            if (index !== -1) {
              vector[index]++
            }
          }
          matrix.push(vector)
        }

        setBowMatrix(matrix)
        setBowVocabulary(vocabulary)
      } catch (error) {
        console.error("Error processing bag of words:", error)
      } finally {
        setIsLoading(false)
      }
    }, 1000)
  }

  const processNGrams = () => {
    setIsLoading(true)

    setTimeout(() => {
      try {
        // Preprocess documents
        const processedDocs = documents.map((doc) =>
          doc
            .toLowerCase()
            .replace(/[^\w\s]/g, "")
            .split(/\s+/)
            .filter((word) => word.length > 0),
        )

        // Generate n-grams
        const allNgrams: string[] = []
        for (const doc of processedDocs) {
          for (let i = 0; i <= doc.length - ngramRange; i++) {
            const ngram = doc.slice(i, i + ngramRange).join(" ")
            allNgrams.push(ngram)
          }
        }

        // Create vocabulary (unique n-grams)
        const vocabulary = Array.from(new Set(allNgrams)).sort()

        // Create n-gram matrix
        const matrix: any[] = []
        for (let i = 0; i < documents.length; i++) {
          const docNgrams: string[] = []
          for (let j = 0; j <= processedDocs[i].length - ngramRange; j++) {
            const ngram = processedDocs[i].slice(j, j + ngramRange).join(" ")
            docNgrams.push(ngram)
          }

          const ngramCounts: Record<string, number> = {}
          for (const ngram of vocabulary) {
            ngramCounts[ngram] = 0
          }

          for (const ngram of docNgrams) {
            ngramCounts[ngram]++
          }

          const row = { document: `Document ${i + 1}` }
          for (const [ngram, count] of Object.entries(ngramCounts)) {
            row[ngram] = count
          }

          matrix.push(row)
        }

        setNgramMatrix(matrix)
        setNgramVocabulary(vocabulary)
      } catch (error) {
        console.error("Error processing n-grams:", error)
      } finally {
        setIsLoading(false)
      }
    }, 1000)
  }

  const processTfIdf = () => {
    setIsLoading(true)

    setTimeout(() => {
      try {
        // Preprocess documents
        const processedDocs = documents.map((doc) =>
          doc
            .toLowerCase()
            .replace(/[^\w\s]/g, "")
            .split(/\s+/)
            .filter((word) => word.length > 0),
        )

        // Create vocabulary (unique words)
        const vocabulary = Array.from(
          new Set(
            documents
              .join(" ")
              .toLowerCase()
              .replace(/[^\w\s]/g, "")
              .split(/\s+/)
              .filter((word) => word.length > 0),
          ),
        ).sort()

        // Calculate term frequencies
        const tf: number[][] = []
        for (const doc of processedDocs) {
          const vector = new Array(vocabulary.length).fill(0)
          for (const word of doc) {
            const index = vocabulary.indexOf(word)
            if (index !== -1) {
              vector[index]++
            }
          }
          // Normalize by document length
          for (let i = 0; i < vector.length; i++) {
            vector[i] = vector[i] / doc.length
          }
          tf.push(vector)
        }

        // Calculate document frequencies
        const df = new Array(vocabulary.length).fill(0)
        for (const doc of processedDocs) {
          const uniqueWords = new Set(doc)
          for (const word of uniqueWords) {
            const index = vocabulary.indexOf(word)
            if (index !== -1) {
              df[index]++
            }
          }
        }

        // Calculate IDF
        const idf = df.map((freq) => Math.log((documents.length + 1) / (freq + 1)) + 1)

        // Calculate TF-IDF
        const tfidf: number[][] = []
        for (const docTf of tf) {
          const vector = docTf.map((freq, i) => freq * idf[i])
          tfidf.push(vector)
        }

        // Prepare chart data
        const chartData = vocabulary.map((term, i) => {
          const data: any = { term }
          for (let j = 0; j < documents.length; j++) {
            data[`Document ${j + 1}`] = tfidf[j][i]
          }
          return data
        })

        setTfidfMatrix(tfidf)
        setTfidfVocabulary(vocabulary)
        setTfidfChartData(chartData)
      } catch (error) {
        console.error("Error processing TF-IDF:", error)
      } finally {
        setIsLoading(false)
      }
    }, 1000)
  }

  const processWordEmbeddings = () => {
    setIsLoading(true)

    setTimeout(() => {
      try {
        // Mock word embeddings (in a real app, this would come from a trained model)
        const mockEmbeddings: Record<string, number[]> = {
          quick: [0.2, 0.8, 0.1],
          brown: [0.3, 0.7, 0.2],
          fox: [0.1, 0.4, 0.3],
          jumps: [0.2, 0.3, 0.4],
          over: [0.15, 0.6, 0.2],
          lazy: [0.25, 0.5, 0.3],
          dog: [0.5, 0.1, 0.7],
          outpaces: [0.6, 0.2, 0.6],
          sleeps: [0.8, 0.3, 0.1],
          day: [0.7, 0.4, 0.2],
          long: [0.4, 0.6, 0.5],
          foxes: [0.3, 0.5, 0.6],
          known: [0.2, 0.2, 0.8],
          being: [0.1, 0.3, 0.7],
          clever: [0.4, 0.7, 0.3],
          animals: [0.6, 0.4, 0.2],
        }

        // Additional mock embeddings for different models
        const mockModelEmbeddings = {
          word2vec: {
            quick: [0.2, 0.8, 0.1],
            brown: [0.3, 0.7, 0.2],
            fox: [0.1, 0.4, 0.3],
            jumps: [0.2, 0.3, 0.4],
            over: [0.15, 0.6, 0.2],
            lazy: [0.25, 0.5, 0.3],
            dog: [0.5, 0.1, 0.7],
            outpaces: [0.6, 0.2, 0.6],
            sleeps: [0.8, 0.3, 0.1],
            day: [0.7, 0.4, 0.2],
            long: [0.4, 0.6, 0.5],
            foxes: [0.3, 0.5, 0.6],
            known: [0.2, 0.2, 0.8],
            being: [0.1, 0.3, 0.7],
            clever: [0.4, 0.7, 0.3],
            animals: [0.6, 0.4, 0.2],
          },
          glove: {
            quick: [0.25, 0.75, 0.15],
            brown: [0.35, 0.65, 0.25],
            fox: [0.15, 0.45, 0.35],
            jumps: [0.25, 0.35, 0.45],
            over: [0.2, 0.55, 0.25],
            lazy: [0.3, 0.45, 0.35],
            dog: [0.55, 0.15, 0.65],
            outpaces: [0.65, 0.25, 0.55],
            sleeps: [0.85, 0.35, 0.15],
            day: [0.75, 0.45, 0.25],
            long: [0.45, 0.55, 0.55],
            foxes: [0.35, 0.55, 0.65],
            known: [0.25, 0.25, 0.75],
            being: [0.15, 0.35, 0.65],
            clever: [0.45, 0.65, 0.35],
            animals: [0.65, 0.45, 0.25],
          },
          fasttext: {
            quick: [0.22, 0.82, 0.12],
            brown: [0.32, 0.72, 0.22],
            fox: [0.12, 0.42, 0.32],
            jumps: [0.22, 0.32, 0.42],
            over: [0.17, 0.62, 0.22],
            lazy: [0.27, 0.52, 0.32],
            dog: [0.52, 0.12, 0.72],
            outpaces: [0.62, 0.22, 0.62],
            sleeps: [0.82, 0.32, 0.12],
            day: [0.72, 0.42, 0.22],
            long: [0.42, 0.62, 0.52],
            foxes: [0.32, 0.52, 0.62],
            known: [0.22, 0.22, 0.82],
            being: [0.12, 0.32, 0.72],
            clever: [0.42, 0.72, 0.32],
            animals: [0.62, 0.42, 0.22],
          },
          doc2vec: {
            quick: [0.18, 0.78, 0.08],
            brown: [0.28, 0.68, 0.18],
            fox: [0.08, 0.38, 0.28],
            jumps: [0.18, 0.28, 0.38],
            over: [0.13, 0.58, 0.18],
            lazy: [0.23, 0.48, 0.28],
            dog: [0.48, 0.08, 0.68],
            outpaces: [0.58, 0.18, 0.58],
            sleeps: [0.78, 0.28, 0.08],
            day: [0.68, 0.38, 0.18],
            long: [0.38, 0.58, 0.48],
            foxes: [0.28, 0.48, 0.58],
            known: [0.18, 0.18, 0.78],
            being: [0.08, 0.28, 0.68],
            clever: [0.38, 0.68, 0.28],
            animals: [0.58, 0.38, 0.18],
          },
          sentence: {
            quick: [0.15, 0.85, 0.05],
            brown: [0.25, 0.75, 0.15],
            fox: [0.05, 0.45, 0.25],
            jumps: [0.15, 0.35, 0.45],
            over: [0.1, 0.65, 0.15],
            lazy: [0.2, 0.55, 0.25],
            dog: [0.45, 0.05, 0.75],
            outpaces: [0.55, 0.15, 0.65],
            sleeps: [0.75, 0.25, 0.05],
            day: [0.65, 0.35, 0.15],
            long: [0.35, 0.65, 0.45],
            foxes: [0.25, 0.55, 0.65],
            known: [0.15, 0.15, 0.85],
            being: [0.05, 0.25, 0.75],
            clever: [0.35, 0.75, 0.25],
            animals: [0.55, 0.35, 0.15],
          },
        }

        // Use the appropriate model based on the selected method
        const selectedEmbeddings =
          mockModelEmbeddings[activeAdvancedMethod as keyof typeof mockModelEmbeddings] || mockEmbeddings
        setWordEmbeddings(selectedEmbeddings)

        setSelectedWords(["fox", "dog", "quick", "lazy"])

        // Prepare visualization data
        const visData = ["fox", "dog", "quick", "lazy"].map((word) => {
          const embedding = selectedEmbeddings[word]
          return {
            word,
            x: embedding[0],
            y: embedding[1],
            z: embedding[2],
          }
        })

        setVisualizationData(visData)

        // Calculate similarities
        const results: { word1: string; word2: string; similarity: number }[] = []
        const words = ["fox", "dog", "quick", "lazy"]

        for (let i = 0; i < words.length; i++) {
          for (let j = i + 1; j < words.length; j++) {
            const word1 = words[i]
            const word2 = words[j]

            // Calculate cosine similarity
            const vec1 = selectedEmbeddings[word1]
            const vec2 = selectedEmbeddings[word2]

            const dotProduct = vec1.reduce((sum, a, i) => sum + a * vec2[i], 0)
            const magnitudeA = Math.sqrt(vec1.reduce((sum, a) => sum + a * a, 0))
            const magnitudeB = Math.sqrt(vec2.reduce((sum, b) => sum + b * b, 0))
            const similarity = dotProduct / (magnitudeA * magnitudeB)

            results.push({ word1, word2, similarity })
          }
        }

        // Sort by similarity (descending)
        results.sort((a, b) => b.similarity - a.similarity)
        setSimilarityResults(results)
      } catch (error) {
        console.error("Error processing word embeddings:", error)
      } finally {
        setIsLoading(false)
      }
    }, 1000)
  }

  const addWord = () => {
    if (wordInput && wordEmbeddings[wordInput] && !selectedWords.includes(wordInput)) {
      setSelectedWords([...selectedWords, wordInput])

      // Update visualization data
      const newVisData = [...visualizationData]
      const embedding = wordEmbeddings[wordInput]

      newVisData.push({
        word: wordInput,
        x: embedding[0],
        y: embedding[1],
        z: embedding[2],
      })

      setVisualizationData(newVisData)
      setWordInput("")
    }
  }

  const processActiveTab = () => {
    if (activeTab === "basic") {
      switch (activeBasicMethod) {
        case "one-hot":
          processOneHot()
          break
        case "bow":
          processBagOfWords()
          break
        case "ngram":
          processNGrams()
          break
        case "tfidf":
          processTfIdf()
          break
      }
    } else if (activeTab === "advanced") {
      processWordEmbeddings()
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="basic" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">{t("basicMethods")}</TabsTrigger>
              <TabsTrigger value="advanced">{t("advancedMethods")}</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid grid-cols-4 gap-2">
                <Button
                  variant={activeBasicMethod === "one-hot" ? "default" : "outline"}
                  onClick={() => setActiveBasicMethod("one-hot")}
                  className="w-full"
                >
                  {t("oneHot")}
                </Button>
                <Button
                  variant={activeBasicMethod === "bow" ? "default" : "outline"}
                  onClick={() => setActiveBasicMethod("bow")}
                  className="w-full"
                >
                  {t("bagOfWords")}
                </Button>
                <Button
                  variant={activeBasicMethod === "ngram" ? "default" : "outline"}
                  onClick={() => setActiveBasicMethod("ngram")}
                  className="w-full"
                >
                  {t("nGrams")}
                </Button>
                <Button
                  variant={activeBasicMethod === "tfidf" ? "default" : "outline"}
                  onClick={() => setActiveBasicMethod("tfidf")}
                  className="w-full"
                >
                  {t("tfIdf")}
                </Button>
              </div>

              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left column - Documents and options */}
                  <div className="space-y-4">
                    <Label>{t("documents")}</Label>
                    <div className="space-y-2">
                      {documents.map((doc, index) => (
                        <div key={index} className="p-2 border rounded-md bg-muted text-sm">
                          {doc}
                        </div>
                      ))}
                    </div>

                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <Label htmlFor="new-document">{t("addDocument")}</Label>
                        <Textarea
                          id="new-document"
                          value={currentDocument}
                          onChange={(e) => setCurrentDocument(e.target.value)}
                          placeholder={t("addDocument")}
                          className="mt-1"
                        />
                      </div>
                      <Button onClick={addDocument}>{common("add")}</Button>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
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
                          id="lowercase"
                          checked={options.lowercase}
                          onCheckedChange={(checked) => handleOptionChange("lowercase", checked as boolean)}
                        />
                        <Label htmlFor="lowercase">{t("lowercase")}</Label>
                      </div>
                    </div>

                    {activeBasicMethod === "ngram" && (
                      <div className="space-y-2">
                        <Label htmlFor="ngram-range">{t("nGramRange")}</Label>
                        <Input
                          id="ngram-range"
                          type="number"
                          min={1}
                          max={5}
                          value={ngramRange}
                          onChange={(e) => setNgramRange(Number.parseInt(e.target.value))}
                        />
                        => setNgramRange(Number.parseInt(e.target.value))} />
                      </div>
                    )}

                    <Button onClick={processActiveTab} disabled={isLoading} className="w-full">
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {common("processing")}
                        </>
                      ) : (
                        common("process")
                      )}
                    </Button>
                  </div>

                  {/* Right column - Results based on selected method */}
                  <div className="space-y-4">
                    {activeBasicMethod === "one-hot" && (
                      <div className="space-y-4">
                        <Label>{t("oneHot")}</Label>
                        {oneHotMatrix.length > 0 ? (
                          <div className="border rounded-md overflow-x-auto">
                            <table className="min-w-full">
                              <thead>
                                <tr className="bg-muted">
                                  <th className="px-4 py-2 text-left">Token</th>
                                  {oneHotVocabulary.map((word, i) => (
                                    <th key={i} className="px-4 py-2 text-left">
                                      {word}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {oneHotTokens.map((token, i) => (
                                  <tr key={i} className={i % 2 === 0 ? "bg-muted/50" : ""}>
                                    <td className="px-4 py-2 font-medium">{token}</td>
                                    {oneHotMatrix[i].map((value, j) => (
                                      <td key={j} className="px-4 py-2">
                                        {value}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="p-4 text-center text-muted-foreground border rounded-md">
                            {t("processToSee", { method: t("oneHot") })}
                          </div>
                        )}
                      </div>
                    )}

                    {activeBasicMethod === "bow" && (
                      <div className="space-y-4">
                        <Label>{t("bagOfWords")}</Label>
                        {bowMatrix.length > 0 ? (
                          <div className="border rounded-md overflow-x-auto">
                            <table className="min-w-full">
                              <thead>
                                <tr className="bg-muted">
                                  <th className="px-4 py-2 text-left">Document</th>
                                  {bowVocabulary.map((word, i) => (
                                    <th key={i} className="px-4 py-2 text-left">
                                      {word}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {bowMatrix.map((row, i) => (
                                  <tr key={i} className={i % 2 === 0 ? "bg-muted/50" : ""}>
                                    <td className="px-4 py-2 font-medium">Document {i + 1}</td>
                                    {row.map((value, j) => (
                                      <td key={j} className="px-4 py-2">
                                        {value}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="p-4 text-center text-muted-foreground border rounded-md">
                            {t("processToSee", { method: t("bagOfWords") })}
                          </div>
                        )}
                      </div>
                    )}

                    {activeBasicMethod === "ngram" && (
                      <div className="space-y-4">
                        <Label>{t("nGrams", { n: ngramRange })}</Label>
                        {ngramMatrix.length > 0 ? (
                          <div className="border rounded-md overflow-x-auto">
                            <table className="min-w-full">
                              <thead>
                                <tr className="bg-muted">
                                  <th className="px-4 py-2 text-left">Document</th>
                                  {ngramVocabulary.map((ngram, i) => (
                                    <th key={i} className="px-4 py-2 text-left">
                                      {ngram}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {ngramMatrix.map((row, i) => (
                                  <tr key={i} className={i % 2 === 0 ? "bg-muted/50" : ""}>
                                    <td className="px-4 py-2 font-medium">{row.document}</td>
                                    {ngramVocabulary.map((ngram, j) => (
                                      <td key={j} className="px-4 py-2">
                                        {row[ngram]}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="p-4 text-center text-muted-foreground border rounded-md">
                            {t("processToSee", { method: t("nGrams") })}
                          </div>
                        )}
                      </div>
                    )}

                    {activeBasicMethod === "tfidf" && (
                      <div className="space-y-4">
                        <Label>{t("tfIdf")}</Label>
                        {tfidfMatrix.length > 0 ? (
                          <div className="space-y-4">
                            <div className="border rounded-md overflow-x-auto">
                              <table className="min-w-full">
                                <thead>
                                  <tr className="bg-muted">
                                    <th className="px-4 py-2 text-left">Term</th>
                                    {tfidfMatrix.map((_, i) => (
                                      <th key={i} className="px-4 py-2 text-left">
                                        Document {i + 1}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {tfidfVocabulary.map((term, i) => (
                                    <tr key={i} className={i % 2 === 0 ? "bg-muted/50" : ""}>
                                      <td className="px-4 py-2 font-medium">{term}</td>
                                      {tfidfMatrix.map((doc, j) => (
                                        <td key={j} className="px-4 py-2">
                                          {doc[i].toFixed(4)}
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            <div className="h-[300px] w-full border rounded-md p-4">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={tfidfChartData} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="term" angle={-45} textAnchor="end" height={70} />
                                  <YAxis label={{ value: "TF-IDF Score", angle: -90, position: "insideLeft" }} />
                                  <Tooltip />
                                  <Legend />
                                  {documents.map((_, index) => (
                                    <Bar
                                      key={index}
                                      dataKey={`Document ${index + 1}`}
                                      fill={`hsl(${(index * 360) / documents.length}, 70%, 50%)`}
                                    />
                                  ))}
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 text-center text-muted-foreground border rounded-md">
                            {t("processToSee", { method: t("tfIdf") })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4 mt-4">
              <div className="grid grid-cols-5 gap-2">
                <Button
                  variant={activeAdvancedMethod === "word2vec" ? "default" : "outline"}
                  onClick={() => setActiveAdvancedMethod("word2vec")}
                  className="w-full"
                >
                  {t("word2vec")}
                </Button>
                <Button
                  variant={activeAdvancedMethod === "glove" ? "default" : "outline"}
                  onClick={() => setActiveAdvancedMethod("glove")}
                  className="w-full"
                >
                  {t("glove")}
                </Button>
                <Button
                  variant={activeAdvancedMethod === "fasttext" ? "default" : "outline"}
                  onClick={() => setActiveAdvancedMethod("fasttext")}
                  className="w-full"
                >
                  {t("fasttext")}
                </Button>
                <Button
                  variant={activeAdvancedMethod === "doc2vec" ? "default" : "outline"}
                  onClick={() => setActiveAdvancedMethod("doc2vec")}
                  className="w-full"
                >
                  {t("doc2vec")}
                </Button>
                <Button
                  variant={activeAdvancedMethod === "sentence" ? "default" : "outline"}
                  onClick={() => setActiveAdvancedMethod("sentence")}
                  className="w-full"
                >
                  {t("sentence")}
                </Button>
              </div>

              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <Label>{t("wordEmbeddings")}</Label>
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <Label htmlFor="word-input">{t("addWordToVisualization")}</Label>
                        <Input
                          id="word-input"
                          value={wordInput}
                          onChange={(e) => setWordInput(e.target.value.toLowerCase())}
                          placeholder={t("addWordToVisualization")}
                          list="available-words"
                        />
                        <datalist id="available-words">
                          {Object.keys(wordEmbeddings).map((word) => (
                            <option key={word} value={word} />
                          ))}
                        </datalist>
                      </div>
                      <Button onClick={addWord}>{common("add")}</Button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {selectedWords.map((word) => (
                        <div key={word} className="flex items-center gap-1 bg-muted px-3 py-1 rounded-full">
                          <span>{word}</span>
                        </div>
                      ))}
                    </div>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">
                          {activeAdvancedMethod === "word2vec" && t("word2vec")}
                          {activeAdvancedMethod === "glove" && t("glove")}
                          {activeAdvancedMethod === "fasttext" && t("fasttext")}
                          {activeAdvancedMethod === "doc2vec" && t("doc2vec")}
                          {activeAdvancedMethod === "sentence" && t("sentence")}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <Button onClick={processWordEmbeddings} disabled={isLoading} className="w-full mt-4">
                            {isLoading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {common("processing")}
                              </>
                            ) : (
                              t("processEmbeddings")
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-4">
                    {Object.keys(wordEmbeddings).length > 0 ? (
                      <div className="space-y-4">
                        <div className="h-[300px] w-full border rounded-md p-4">
                          <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                              <CartesianGrid />
                              <XAxis type="number" dataKey="x" name="Dimension 1" />
                              <YAxis type="number" dataKey="y" name="Dimension 2" />
                              <ZAxis type="number" dataKey="z" range={[50, 400]} name="Dimension 3" />
                              <Tooltip
                                cursor={{ strokeDasharray: "3 3" }}
                                formatter={(value: any) => [value.toFixed(2), ""]}
                                labelFormatter={(label) => `Word: ${visualizationData[label as number]?.word}`}
                              />
                              <Scatter name="Words" data={visualizationData} fill="#8884d8" shape="circle" />
                            </ScatterChart>
                          </ResponsiveContainer>
                        </div>

                        <div className="border rounded-md overflow-hidden">
                          <table className="min-w-full">
                            <thead>
                              <tr className="bg-muted">
                                <th className="px-4 py-2 text-left">Word 1</th>
                                <th className="px-4 py-2 text-left">Word 2</th>
                                <th className="px-4 py-2 text-left">Similarity</th>
                              </tr>
                            </thead>
                            <tbody>
                              {similarityResults.map((result, index) => (
                                <tr key={index} className={index % 2 === 0 ? "bg-muted/50" : ""}>
                                  <td className="px-4 py-2">{result.word1}</td>
                                  <td className="px-4 py-2">{result.word2}</td>
                                  <td className="px-4 py-2">{result.similarity.toFixed(4)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 text-center text-muted-foreground border rounded-md h-full flex items-center justify-center">
                        <div>
                          <p className="mb-4">{t("processToSeeVisualization")}</p>
                          <p className="text-sm text-muted-foreground">{t("addWordsToSeeRepresentations")}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

