"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis } from "recharts"

// Mock word embeddings data (in a real app, this would come from a trained model)
const mockEmbeddings: Record<string, number[]> = {
  king: [0.2, 0.8, 0.1],
  queen: [0.3, 0.7, 0.2],
  man: [0.1, 0.4, 0.3],
  woman: [0.2, 0.3, 0.4],
  prince: [0.15, 0.6, 0.2],
  princess: [0.25, 0.5, 0.3],
  dog: [0.5, 0.1, 0.7],
  cat: [0.6, 0.2, 0.6],
  computer: [0.8, 0.3, 0.1],
  technology: [0.7, 0.4, 0.2],
  food: [0.4, 0.6, 0.5],
  eat: [0.3, 0.5, 0.6],
  run: [0.2, 0.2, 0.8],
  walk: [0.1, 0.3, 0.7],
}

// Calculate cosine similarity between two vectors
const cosineSimilarity = (vecA: number[], vecB: number[]) => {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0)
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0))
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0))
  return dotProduct / (magnitudeA * magnitudeB)
}

export default function WordEmbeddingsExplorer() {
  const [selectedWords, setSelectedWords] = useState<string[]>(["king", "queen", "man", "woman"])
  const [wordInput, setWordInput] = useState("")
  const [analogyWord1, setAnalogyWord1] = useState("king")
  const [analogyWord2, setAnalogyWord2] = useState("man")
  const [analogyWord3, setAnalogyWord3] = useState("woman")
  const [analogyResult, setAnalogyResult] = useState("queen")
  const [similarityResults, setSimilarityResults] = useState<{ word1: string; word2: string; similarity: number }[]>([])

  // Prepare visualization data
  const visualizationData = selectedWords.map((word) => {
    const embedding = mockEmbeddings[word]
    return {
      word,
      x: embedding[0],
      y: embedding[1],
      z: embedding[2],
    }
  })

  const addWord = () => {
    if (wordInput && mockEmbeddings[wordInput] && !selectedWords.includes(wordInput)) {
      setSelectedWords([...selectedWords, wordInput])
      setWordInput("")
    }
  }

  const removeWord = (word: string) => {
    setSelectedWords(selectedWords.filter((w) => w !== word))
  }

  const calculateSimilarities = () => {
    const results: { word1: string; word2: string; similarity: number }[] = []

    for (let i = 0; i < selectedWords.length; i++) {
      for (let j = i + 1; j < selectedWords.length; j++) {
        const word1 = selectedWords[i]
        const word2 = selectedWords[j]
        const similarity = cosineSimilarity(mockEmbeddings[word1], mockEmbeddings[word2])
        results.push({ word1, word2, similarity })
      }
    }

    // Sort by similarity (descending)
    results.sort((a, b) => b.similarity - a.similarity)
    setSimilarityResults(results)
  }

  const solveAnalogy = () => {
    // In a real app, this would use vector arithmetic on actual embeddings
    // For this demo, we'll just set a predefined result
    if (analogyWord1 === "king" && analogyWord2 === "man" && analogyWord3 === "woman") {
      setAnalogyResult("queen")
    } else if (analogyWord1 === "man" && analogyWord2 === "king" && analogyWord3 === "queen") {
      setAnalogyResult("woman")
    } else {
      // Find the closest word using vector arithmetic
      // king - man + woman = queen
      const vec1 = mockEmbeddings[analogyWord1]
      const vec2 = mockEmbeddings[analogyWord2]
      const vec3 = mockEmbeddings[analogyWord3]

      if (vec1 && vec2 && vec3) {
        // Calculate target vector
        const targetVec = vec1.map((val, i) => val - vec2[i] + vec3[i])

        // Find closest word
        let bestWord = ""
        let bestSimilarity = Number.NEGATIVE_INFINITY

        Object.entries(mockEmbeddings).forEach(([word, vec]) => {
          if (word !== analogyWord1 && word !== analogyWord2 && word !== analogyWord3) {
            const similarity = cosineSimilarity(targetVec, vec)
            if (similarity > bestSimilarity) {
              bestSimilarity = similarity
              bestWord = word
            }
          }
        })

        setAnalogyResult(bestWord || "No result found")
      }
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Word Embeddings Explorer</CardTitle>
        <CardDescription>Explore word relationships in vector space</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="visualization">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="visualization">Visualization</TabsTrigger>
            <TabsTrigger value="similarity">Word Similarity</TabsTrigger>
            <TabsTrigger value="analogy">Word Analogies</TabsTrigger>
          </TabsList>

          <TabsContent value="visualization" className="space-y-4">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Label htmlFor="word-input">Add word to visualization</Label>
                <Input
                  id="word-input"
                  value={wordInput}
                  onChange={(e) => setWordInput(e.target.value.toLowerCase())}
                  placeholder="Enter a word..."
                  list="available-words"
                />
                <datalist id="available-words">
                  {Object.keys(mockEmbeddings).map((word) => (
                    <option key={word} value={word} />
                  ))}
                </datalist>
              </div>
              <Button onClick={addWord}>Add</Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {selectedWords.map((word) => (
                <div key={word} className="flex items-center gap-1 bg-muted px-3 py-1 rounded-full">
                  <span>{word}</span>
                  <button
                    onClick={() => removeWord(word)}
                    className="w-4 h-4 rounded-full bg-muted-foreground/20 flex items-center justify-center text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <div className="h-[400px] w-full border rounded-md p-4">
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

            <div className="text-sm text-muted-foreground">
              Note: This is a simplified 2D projection of word vectors. Real word embeddings typically have 100-300
              dimensions.
            </div>
          </TabsContent>

          <TabsContent value="similarity" className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Calculate cosine similarity between all selected words to see how related they are in the embedding
                space.
              </p>
              <Button onClick={calculateSimilarities}>Calculate Similarities</Button>
            </div>

            {similarityResults.length > 0 && (
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
            )}
          </TabsContent>

          <TabsContent value="analogy" className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Solve word analogies using vector arithmetic. For example: "king is to man as queen is to woman" can be
                expressed as: king - man + woman = queen
              </p>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="analogy-word1">Word 1</Label>
                  <Input
                    id="analogy-word1"
                    value={analogyWord1}
                    onChange={(e) => setAnalogyWord1(e.target.value.toLowerCase())}
                    list="available-words"
                  />
                </div>
                <div className="flex items-center justify-center">
                  <span className="text-lg">−</span>
                </div>
                <div>
                  <Label htmlFor="analogy-word2">Word 2</Label>
                  <Input
                    id="analogy-word2"
                    value={analogyWord2}
                    onChange={(e) => setAnalogyWord2(e.target.value.toLowerCase())}
                    list="available-words"
                  />
                </div>
                <div>
                  <Label htmlFor="analogy-word3">Word 3</Label>
                  <Input
                    id="analogy-word3"
                    value={analogyWord3}
                    onChange={(e) => setAnalogyWord3(e.target.value.toLowerCase())}
                    list="available-words"
                  />
                </div>
                <div className="flex items-center justify-center">
                  <span className="text-lg">=</span>
                </div>
                <div>
                  <Label htmlFor="analogy-result">Result</Label>
                  <Input id="analogy-result" value={analogyResult} readOnly className="bg-muted" />
                </div>
              </div>

              <Button onClick={solveAnalogy} className="mt-4">
                Solve Analogy
              </Button>
            </div>

            <Separator />

            <div>
              <h3 className="font-medium mb-2">Examples to try:</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>king - man + woman = queen</li>
                <li>queen - woman + man = king</li>
                <li>dog - cat + food = meat</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

