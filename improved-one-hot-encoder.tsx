"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

export default function OneHotEncoderDemo() {
  const [inputText, setInputText] = useState("my name is the first dog.")
  const [processedText, setProcessedText] = useState("")
  const [vocabulary, setVocabulary] = useState<string[]>([])
  const [encodedMatrix, setEncodedMatrix] = useState<number[][]>([])
  const [removeStopwords, setRemoveStopwords] = useState(true)
  const [removePunctuation, setRemovePunctuation] = useState(true)
  const [toLowerCase, setToLowerCase] = useState(true)

  const processText = () => {
    // Simple preprocessing
    let text = inputText
    if (toLowerCase) {
      text = text.toLowerCase()
    }

    if (removePunctuation) {
      text = text.replace(/[^\w\s]/g, "")
    }

    // Tokenize
    let words = text.split(/\s+/).filter((word) => word.length > 0)

    // Remove stopwords if selected
    if (removeStopwords) {
      const stopwords = ["the", "is", "and", "of", "to", "a", "in", "for", "on", "with"]
      words = words.filter((word) => !stopwords.includes(word))
    }

    // Create vocabulary (unique words)
    const uniqueWords = Array.from(new Set(words)).sort()

    // Create one-hot encoding matrix
    const matrix: number[][] = []
    for (const word of words) {
      const vector = new Array(uniqueWords.length).fill(0)
      const index = uniqueWords.indexOf(word)
      if (index !== -1) {
        vector[index] = 1
      }
      matrix.push(vector)
    }

    setProcessedText(words.join(" "))
    setVocabulary(uniqueWords)
    setEncodedMatrix(matrix)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Improved One-Hot Encoder</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="input">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="input">Input</TabsTrigger>
            <TabsTrigger value="options">Options</TabsTrigger>
            <TabsTrigger value="output">Output</TabsTrigger>
          </TabsList>

          <TabsContent value="input" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="input-text">Text to encode</Label>
              <Textarea
                id="input-text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Enter text to encode..."
                className="min-h-[100px]"
              />
            </div>
            <Button onClick={processText}>Process Text</Button>
          </TabsContent>

          <TabsContent value="options" className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="lowercase"
                  checked={toLowerCase}
                  onCheckedChange={(checked) => setToLowerCase(checked as boolean)}
                />
                <Label htmlFor="lowercase">Convert to lowercase</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remove-punctuation"
                  checked={removePunctuation}
                  onCheckedChange={(checked) => setRemovePunctuation(checked as boolean)}
                />
                <Label htmlFor="remove-punctuation">Remove punctuation</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remove-stopwords"
                  checked={removeStopwords}
                  onCheckedChange={(checked) => setRemoveStopwords(checked as boolean)}
                />
                <Label htmlFor="remove-stopwords">Remove stopwords</Label>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="output" className="space-y-4">
            <div className="space-y-2">
              <Label>Processed Text</Label>
              <div className="p-2 border rounded-md bg-muted">{processedText}</div>
            </div>

            <div className="space-y-2">
              <Label>Vocabulary ({vocabulary.length} words)</Label>
              <div className="p-2 border rounded-md bg-muted overflow-x-auto">{vocabulary.join(", ")}</div>
            </div>

            <div className="space-y-2">
              <Label>One-Hot Encoded Matrix</Label>
              <div className="p-2 border rounded-md bg-muted overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr>
                      <th className="px-2 py-1 border-r">Word</th>
                      {vocabulary.map((word, i) => (
                        <th key={i} className="px-2 py-1 text-xs">
                          {word}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {processedText.split(" ").map((word, rowIndex) => (
                      <tr key={rowIndex}>
                        <td className="px-2 py-1 border-r font-medium">{word}</td>
                        {encodedMatrix[rowIndex]?.map((value, colIndex) => (
                          <td key={colIndex} className="px-2 py-1 text-center">
                            {value}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

