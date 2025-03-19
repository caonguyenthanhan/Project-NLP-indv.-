"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

export default function TfIdfVisualization() {
  const [documents, setDocuments] = useState(["Dog bites man.", "Man bites dog.", "Dog eats meat.", "Man eats food."])
  const [tfIdfMatrix, setTfIdfMatrix] = useState<any[]>([])
  const [terms, setTerms] = useState<string[]>([])
  const [chartData, setChartData] = useState<any[]>([])

  const calculateTfIdf = () => {
    // Preprocess documents
    const processedDocs = documents.map((doc) => doc.toLowerCase().replace(/[^\w\s]/g, ""))

    // Tokenize
    const tokenizedDocs = processedDocs.map((doc) => doc.split(/\s+/).filter((word) => word.length > 0))

    // Get unique terms
    const allTerms = Array.from(new Set(tokenizedDocs.flat())).sort()
    setTerms(allTerms)

    // Calculate term frequencies
    const tf = tokenizedDocs.map((doc) => {
      const termFreq: Record<string, number> = {}
      const docLength = doc.length

      // Count occurrences
      doc.forEach((term) => {
        termFreq[term] = (termFreq[term] || 0) + 1
      })

      // Normalize by document length
      Object.keys(termFreq).forEach((term) => {
        termFreq[term] = termFreq[term] / docLength
      })

      return termFreq
    })

    // Calculate document frequencies
    const df: Record<string, number> = {}
    allTerms.forEach((term) => {
      df[term] = tokenizedDocs.filter((doc) => doc.includes(term)).length
    })

    // Calculate IDF
    const numDocs = documents.length
    const idf: Record<string, number> = {}
    allTerms.forEach((term) => {
      idf[term] = Math.log((numDocs + 1) / (df[term] + 1)) + 1
    })

    // Calculate TF-IDF
    const tfIdf = tf.map((docTf) => {
      const docTfIdf: Record<string, number> = {}
      allTerms.forEach((term) => {
        docTfIdf[term] = (docTf[term] || 0) * idf[term]
      })
      return docTfIdf
    })

    // Format for display
    const matrix = allTerms.map((term) => {
      const row: any = { term }
      documents.forEach((_, docIndex) => {
        row[`doc${docIndex + 1}`] = tfIdf[docIndex][term]?.toFixed(4) || 0
      })
      return row
    })

    setTfIdfMatrix(matrix)

    // Prepare chart data
    const chartData = allTerms.map((term) => {
      const data: any = { term }
      documents.forEach((_, docIndex) => {
        data[`Document ${docIndex + 1}`] = Number.parseFloat(tfIdf[docIndex][term]?.toFixed(4) || 0)
      })
      return data
    })

    setChartData(chartData)
  }

  const addDocument = () => {
    setDocuments([...documents, ""])
  }

  const updateDocument = (index: number, value: string) => {
    const newDocs = [...documents]
    newDocs[index] = value
    setDocuments(newDocs)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Improved TF-IDF Visualization</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="input">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="input">Documents</TabsTrigger>
            <TabsTrigger value="matrix">TF-IDF Matrix</TabsTrigger>
            <TabsTrigger value="visualization">Visualization</TabsTrigger>
          </TabsList>

          <TabsContent value="input" className="space-y-4">
            <div className="space-y-4">
              {documents.map((doc, index) => (
                <div key={index} className="space-y-2">
                  <Label htmlFor={`doc-${index}`}>Document {index + 1}</Label>
                  <Textarea
                    id={`doc-${index}`}
                    value={doc}
                    onChange={(e) => updateDocument(index, e.target.value)}
                    placeholder="Enter document text..."
                  />
                </div>
              ))}

              <div className="flex justify-between">
                <Button onClick={addDocument} variant="outline">
                  Add Document
                </Button>
                <Button onClick={calculateTfIdf}>Calculate TF-IDF</Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="matrix" className="space-y-4">
            {tfIdfMatrix.length > 0 ? (
              <div className="border rounded-md overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-muted">
                      <th className="px-4 py-2 text-left">Term</th>
                      {documents.map((_, index) => (
                        <th key={index} className="px-4 py-2 text-left">
                          Document {index + 1}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tfIdfMatrix.map((row, index) => (
                      <tr key={index} className={index % 2 === 0 ? "bg-muted/50" : ""}>
                        <td className="px-4 py-2 font-medium">{row.term}</td>
                        {documents.map((_, docIndex) => (
                          <td key={docIndex} className="px-4 py-2">
                            {row[`doc${docIndex + 1}`]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4 text-center text-muted-foreground">Calculate TF-IDF to see the matrix</div>
            )}
          </TabsContent>

          <TabsContent value="visualization" className="space-y-4">
            {chartData.length > 0 ? (
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
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
            ) : (
              <div className="p-4 text-center text-muted-foreground">Calculate TF-IDF to see the visualization</div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

