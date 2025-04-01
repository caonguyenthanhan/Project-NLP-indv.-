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

  // Basic Methods state
  const [oneHotMatrix, setOneHotMatrix] = useState<number[][]>([])
  const [oneHotVocabulary, setOneHotVocabulary] = useState<string[]>([])
  const [bowMatrix, setBowMatrix] = useState<number[][]>([])
  const [bowVocabulary, setBowVocabulary] = useState<string[]>([])
  const [ngramMatrix, setNgramMatrix] = useState<any[]>([])
  const [ngramVocabulary, setNgramVocabulary] = useState<string[]>([])
  const [ngramRange, setNgramRange] = useState(2)
  const [tfidfMatrix, setTfidfMatrix] = useState<number[][]>([])
  const [tfidfVocabulary, setTfidfVocabulary] = useState<string[]>([])
  const [tfidfChartData, setTfidfChartData] = useState<any[]>([])

  // Advanced Methods state
  const [wordEmbeddings, setWordEmbeddings] = useState<Record<string, number[]>>({})
  const [docEmbeddings, setDocEmbeddings] = useState<number[][]>([])
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [itemInput, setItemInput] = useState("")
  const [similarityResults, setSimilarityResults] = useState<{ item1: string; item2: string; similarity: number }[]>([])
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

  // Preprocess documents based on options
  const preprocessDocs = () => {
    const stopwords = ["the", "a", "and", "are", "for", "over", "all"] // Simple stopword list
    return documents.map(doc => {
      let processed = doc;
      if (options.lowercase) processed = processed.toLowerCase();
      if (options.removePunctuation) processed = processed.replace(/[^\w\s]/g, "");
      let words = processed.split(/\s+/).filter(word => word.length > 0);
      if (options.removeStopwords) words = words.filter(word => !stopwords.includes(word));
      return words;
    });
  }

  // Basic Methods
  const processOneHot = () => {
    setIsLoading(true)
    setTimeout(() => {
      const processedDocs = preprocessDocs()
      const vocabulary = Array.from(new Set(processedDocs.flat())).sort()
      const matrix = processedDocs.map(doc => {
        const vector = new Array(vocabulary.length).fill(0)
        doc.forEach(word => {
          const index = vocabulary.indexOf(word)
          if (index !== -1) vector[index] = 1
        })
        return vector
      })
      setOneHotMatrix(matrix)
      setOneHotVocabulary(vocabulary)
      setIsLoading(false)
    }, 500)
  }

  const processBagOfWords = () => {
    setIsLoading(true)
    setTimeout(() => {
      const processedDocs = preprocessDocs()
      const vocabulary = Array.from(new Set(processedDocs.flat())).sort()
      const matrix = processedDocs.map(doc => {
        const vector = new Array(vocabulary.length).fill(0)
        doc.forEach(word => {
          const index = vocabulary.indexOf(word)
          if (index !== -1) vector[index]++
        })
        return vector
      })
      setBowMatrix(matrix)
      setBowVocabulary(vocabulary)
      setIsLoading(false)
    }, 500)
  }

  const processNGrams = () => {
    setIsLoading(true)
    setTimeout(() => {
      const processedDocs = preprocessDocs()
      const allNgrams: string[] = []
      processedDocs.forEach(doc => {
        for (let i = 0; i <= doc.length - ngramRange; i++) {
          allNgrams.push(doc.slice(i, i + ngramRange).join(" "))
        }
      })
      const vocabulary = Array.from(new Set(allNgrams)).sort()
      const matrix = processedDocs.map((doc, i) => {
        const docNgrams = []
        for (let j = 0; j <= doc.length - ngramRange; j++) {
          docNgrams.push(doc.slice(j, j + ngramRange).join(" "))
        }
        const row = { document: `Document ${i + 1}` }
        vocabulary.forEach(ngram => {
          row[ngram] = docNgrams.filter(n => n === ngram).length
        })
        return row
      })
      setNgramMatrix(matrix)
      setNgramVocabulary(vocabulary)
      setIsLoading(false)
    }, 500)
  }

  const processTfIdf = () => {
    setIsLoading(true)
    setTimeout(() => {
      const processedDocs = preprocessDocs()
      const vocabulary = Array.from(new Set(processedDocs.flat())).sort()

      const tf = processedDocs.map(doc => {
        const vector = new Array(vocabulary.length).fill(0)
        doc.forEach(word => {
          const index = vocabulary.indexOf(word)
          if (index !== -1) vector[index]++
        })
        return vector.map(val => val / doc.length)
      })

      const df = new Array(vocabulary.length).fill(0)
      processedDocs.forEach(doc => {
        const uniqueWords = new Set(doc)
        uniqueWords.forEach(word => {
          const index = vocabulary.indexOf(word)
          if (index !== -1) df[index]++
        })
      })

      const idf = df.map(freq => Math.log((documents.length + 1) / (freq + 1)) + 1)
      const tfidf = tf.map(docTf => docTf.map((freq, i) => freq * idf[i]))

      const chartData = vocabulary.map((term, i) => {
        const data: any = { term }
        tfidf.forEach((doc, j) => {
          data[`Document ${j + 1}`] = doc[i]
        })
        return data
      })

      setTfidfMatrix(tfidf)
      setTfidfVocabulary(vocabulary)
      setTfidfChartData(chartData)
      setIsLoading(false)
    }, 500)
  }

  // Advanced Methods (API-based or Simulated)
  const processAdvancedEmbeddings = async () => {
    setIsLoading(true)
    try {
      const processedDocs = preprocessDocs()
      const uniqueWords = Array.from(new Set(processedDocs.flat()))

      // Giả lập API call (thay bằng fetch thực nếu có backend)
      const embeddings = await simulateEmbeddings(uniqueWords, activeAdvancedMethod)

      // Word-level embeddings
      setWordEmbeddings(embeddings)

      // Document-level embeddings (trung bình vector từ)
      const docVectors = processedDocs.map(doc => {
        const vectors = doc.map(word => embeddings[word] || [0, 0, 0])
        const avgVector = [0, 0, 0]
        vectors.forEach(vec => {
          avgVector[0] += vec[0]
          avgVector[1] += vec[1]
          avgVector[2] += vec[2]
        })
        return avgVector.map(val => val / (vectors.length || 1))
      })
      setDocEmbeddings(docVectors)

      // Visualization (hiển thị tài liệu hoặc từ tùy thuộc vào phương pháp)
      const isDocLevel = ["doc2vec", "sentence"].includes(activeAdvancedMethod)
      const items = isDocLevel ? documents.map((_, i) => `Doc ${i + 1}`) : uniqueWords
      const visData = (isDocLevel ? docVectors : Object.entries(embeddings).slice(0, 5)).map((item, i) => ({
        word: isDocLevel ? `Doc ${i + 1}` : item[0],
        x: isDocLevel ? item[0] : item[1][0],
        y: isDocLevel ? item[1] : item[1][1],
        z: isDocLevel ? item[2] : item[1][2],
      }))
      setVisualizationData(visData)
      setSelectedItems(visData.map(d => d.word))

      // Similarity
      const results = []
      for (let i = 0; i < visData.length; i++) {
        for (let j = i + 1; j < visData.length; j++) {
          const vec1 = [visData[i].x, visData[i].y, visData[i].z]
          const vec2 = [visData[j].x, visData[j].y, visData[j].z]
          const dotProduct = vec1.reduce((sum, a, idx) => sum + a * vec2[idx], 0)
          const mag1 = Math.sqrt(vec1.reduce((sum, a) => sum + a * a, 0))
          const mag2 = Math.sqrt(vec2.reduce((sum, b) => sum + b * b, 0))
          const similarity = dotProduct / (mag1 * mag2) || 0
          results.push({ item1: visData[i].word, item2: visData[j].word, similarity })
        }
      }
      setSimilarityResults(results.sort((a, b) => b.similarity - a.similarity))
    } catch (error) {
      console.error("Error processing embeddings:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Simulate embeddings (thay bằng API thực tế nếu có)
  const simulateEmbeddings = async (words: string[], method: string): Promise<Record<string, number[]>> => {
    return new Promise(resolve => {
      setTimeout(() => {
        const embeddings: Record<string, number[]> = {}
        words.forEach(word => {
          // Giả lập vector 3 chiều dựa trên hash đơn giản
          const seed = word.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0)
          embeddings[word] = [
            (Math.sin(seed + (method === "word2vec" ? 1 : 2)) + 1) / 2,
            (Math.cos(seed + (method === "glove" ? 2 : 3)) + 1) / 2,
            (Math.sin(seed + (method === "fasttext" ? 3 : 4)) + 1) / 2,
          ]
        })
        resolve(embeddings)
      }, 1000)
    })
  }

  const addItem = () => {
    const isDocLevel = ["doc2vec", "sentence"].includes(activeAdvancedMethod)
    const validItems = isDocLevel ? documents.map((_, i) => `Doc ${i + 1}`) : Object.keys(wordEmbeddings)
    if (itemInput && validItems.includes(itemInput) && !selectedItems.includes(itemInput)) {
      setSelectedItems([...selectedItems, itemInput])
      const newVisData = [...visualizationData]
      const embedding = isDocLevel ? docEmbeddings[parseInt(itemInput.split(" ")[1]) - 1] : wordEmbeddings[itemInput]
      newVisData.push({ word: itemInput, x: embedding[0], y: embedding[1], z: embedding[2] })
      setVisualizationData(newVisData)
      setItemInput("")
    }
  }

  const processActiveTab = () => {
    if (activeTab === "basic") {
      switch (activeBasicMethod) {
        case "one-hot": processOneHot(); break
        case "bow": processBagOfWords(); break
        case "ngram": processNGrams(); break
        case "tfidf": processTfIdf(); break
      }
    } else {
      processAdvancedEmbeddings()
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
                <Button variant={activeBasicMethod === "one-hot" ? "default" : "outline"} onClick={() => setActiveBasicMethod("one-hot")}>{t("oneHot")}</Button>
                <Button variant={activeBasicMethod === "bow" ? "default" : "outline"} onClick={() => setActiveBasicMethod("bow")}>{t("bagOfWords")}</Button>
                <Button variant={activeBasicMethod === "ngram" ? "default" : "outline"} onClick={() => setActiveBasicMethod("ngram")}>{t("nGrams")}</Button>
                <Button variant={activeBasicMethod === "tfidf" ? "default" : "outline"} onClick={() => setActiveBasicMethod("tfidf")}>{t("tfIdf")}</Button>
              </div>

              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <Label>{t("documents")}</Label>
                    <div className="space-y-2">
                      {documents.map((doc, index) => (
                        <div key={index} className="p-2 border rounded-md bg-muted text-sm">{doc}</div>
                      ))}
                    </div>
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <Label htmlFor="new-document">{t("addDocument")}</Label>
                        <Textarea id="new-document" value={currentDocument} onChange={(e) => setCurrentDocument(e.target.value)} placeholder={t("addDocument")} className="mt-1" />
                      </div>
                      <Button onClick={addDocument}>{common("add")}</Button>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="remove-stopwords" checked={options.removeStopwords} onCheckedChange={(checked) => handleOptionChange("removeStopwords", checked as boolean)} />
                        <Label htmlFor="remove-stopwords">{t("removeStopwords")}</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="remove-punctuation" checked={options.removePunctuation} onCheckedChange={(checked) => handleOptionChange("removePunctuation", checked as boolean)} />
                        <Label htmlFor="remove-punctuation">{t("removePunctuation")}</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="lowercase" checked={options.lowercase} onCheckedChange={(checked) => handleOptionChange("lowercase", checked as boolean)} />
                        <Label htmlFor="lowercase">{t("lowercase")}</Label>
                      </div>
                    </div>
                    {activeBasicMethod === "ngram" && (
                      <div className="space-y-2">
                        <Label htmlFor="ngram-range">{t("nGramRange")}</Label>
                        <Input id="ngram-range" type="number" min={1} max={5} value={ngramRange} onChange={(e) => setNgramRange(parseInt(e.target.value))} />
                      </div>
                    )}
                    <Button onClick={processActiveTab} disabled={isLoading} className="w-full">
                      {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{common("processing")}</> : common("process")}
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {activeBasicMethod === "one-hot" && (
                      <div className="space-y-4">
                        <Label>{t("oneHot")}</Label>
                        {oneHotMatrix.length > 0 ? (
                          <div className="border rounded-md overflow-x-auto">
                            <table className="min-w-full">
                              <thead>
                                <tr className="bg-muted">
                                  <th className="px-4 py-2 text-left">Document</th>
                                  {oneHotVocabulary.map((word, i) => <th key={i} className="px-4 py-2 text-left">{word}</th>)}
                                </tr>
                              </thead>
                              <tbody>
                                {oneHotMatrix.map((row, i) => (
                                  <tr key={i} className={i % 2 === 0 ? "bg-muted/50" : ""}>
                                    <td className="px-4 py-2 font-medium">Doc {i + 1}</td>
                                    {row.map((value, j) => <td key={j} className="px-4 py-2">{value}</td>)}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="p-4 text-center text-muted-foreground border rounded-md">{t("processToSee", { method: t("oneHot") })}</div>
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
                                  {bowVocabulary.map((word, i) => <th key={i} className="px-4 py-2 text-left">{word}</th>)}
                                </tr>
                              </thead>
                              <tbody>
                                {bowMatrix.map((row, i) => (
                                  <tr key={i} className={i % 2 === 0 ? "bg-muted/50" : ""}>
                                    <td className="px-4 py-2 font-medium">Doc {i + 1}</td>
                                    {row.map((value, j) => <td key={j} className="px-4 py-2">{value}</td>)}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="p-4 text-center text-muted-foreground border rounded-md">{t("processToSee", { method: t("bagOfWords") })}</div>
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
                                  {ngramVocabulary.map((ngram, i) => <th key={i} className="px-4 py-2 text-left">{ngram}</th>)}
                                </tr>
                              </thead>
                              <tbody>
                                {ngramMatrix.map((row, i) => (
                                  <tr key={i} className={i % 2 === 0 ? "bg-muted/50" : ""}>
                                    <td className="px-4 py-2 font-medium">{row.document}</td>
                                    {ngramVocabulary.map((ngram, j) => <td key={j} className="px-4 py-2">{row[ngram]}</td>)}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="p-4 text-center text-muted-foreground border rounded-md">{t("processToSee", { method: t("nGrams") })}</div>
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
                                    {tfidfMatrix.map((_, i) => <th key={i} className="px-4 py-2 text-left">Doc {i + 1}</th>)}
                                  </tr>
                                </thead>
                                <tbody>
                                  {tfidfVocabulary.map((term, i) => (
                                    <tr key={i} className={i % 2 === 0 ? "bg-muted/50" : ""}>
                                      <td className="px-4 py-2 font-medium">{term}</td>
                                      {tfidfMatrix.map((doc, j) => <td key={j} className="px-4 py-2">{doc[i].toFixed(4)}</td>)}
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
                                    <Bar key={index} dataKey={`Document ${index + 1}`} fill={`hsl(${(index * 360) / documents.length}, 70%, 50%)`} />
                                  ))}
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 text-center text-muted-foreground border rounded-md">{t("processToSee", { method: t("tfIdf") })}</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4 mt-4">
              <div className="grid grid-cols-5 gap-2">
                <Button variant={activeAdvancedMethod === "word2vec" ? "default" : "outline"} onClick={() => setActiveAdvancedMethod("word2vec")}>{t("word2vec")}</Button>
                <Button variant={activeAdvancedMethod === "glove" ? "default" : "outline"} onClick={() => setActiveAdvancedMethod("glove")}>{t("glove")}</Button>
                <Button variant={activeAdvancedMethod === "fasttext" ? "default" : "outline"} onClick={() => setActiveAdvancedMethod("fasttext")}>{t("fasttext")}</Button>
                <Button variant={activeAdvancedMethod === "doc2vec" ? "default" : "outline"} onClick={() => setActiveAdvancedMethod("doc2vec")}>{t("doc2vec")}</Button>
                <Button variant={activeAdvancedMethod === "sentence" ? "default" : "outline"} onClick={() => setActiveAdvancedMethod("sentence")}>{t("sentence")}</Button>
              </div>

              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <Label>{t("advancedMethods")}</Label>
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <Label htmlFor="item-input">{t("addItemToVisualization")}</Label>
                        <Input
                          id="item-input"
                          value={itemInput}
                          onChange={(e) => setItemInput(e.target.value)}
                          placeholder={["doc2vec", "sentence"].includes(activeAdvancedMethod) ? "e.g., Doc 1" : "e.g., quick"}
                          list="available-items"
                        />
                        <datalist id="available-items">
                          {(["doc2vec", "sentence"].includes(activeAdvancedMethod) ? documents.map((_, i) => `Doc ${i + 1}`) : Object.keys(wordEmbeddings)).map(item => (
                            <option key={item} value={item} />
                          ))}
                        </datalist>
                      </div>
                      <Button onClick={addItem}>{common("add")}</Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedItems.map(item => (
                        <div key={item} className="flex items-center gap-1 bg-muted px-3 py-1 rounded-full">
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                    <Button onClick={processActiveTab} disabled={isLoading} className="w-full">
                      {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{common("processing")}</> : t("processEmbeddings")}
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {visualizationData.length > 0 ? (
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
                                labelFormatter={(label) => `${["doc2vec", "sentence"].includes(activeAdvancedMethod) ? "Document" : "Word"}: ${visualizationData[label as number]?.word}`}
                              />
                              <Scatter name={["doc2vec", "sentence"].includes(activeAdvancedMethod) ? "Documents" : "Words"} data={visualizationData} fill="#8884d8" shape="circle" />
                            </ScatterChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="border rounded-md overflow-hidden">
                          <table className="min-w-full">
                            <thead>
                              <tr className="bg-muted">
                                <th className="px-4 py-2 text-left">Item 1</th>
                                <th className="px-4 py-2 text-left">Item 2</th>
                                <th className="px-4 py-2 text-left">Similarity</th>
                              </tr>
                            </thead>
                            <tbody>
                              {similarityResults.map((result, index) => (
                                <tr key={index} className={index % 2 === 0 ? "bg-muted/50" : ""}>
                                  <td className="px-4 py-2">{result.item1}</td>
                                  <td className="px-4 py-2">{result.item2}</td>
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
                          <p className="text-sm">{t("addItemsToSeeRepresentations")}</p>
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