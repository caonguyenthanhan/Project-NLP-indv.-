import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import OneHotEncoderDemo from "./improved-one-hot-encoder"
import TfIdfVisualization from "./tf-idf-visualization"
import WordEmbeddingsExplorer from "./word-embeddings-explorer"

export default function TextRepresentationDashboard() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Text Representation Techniques</h1>
        <p className="text-muted-foreground">
          Interactive demonstrations of various text representation methods for NLP
        </p>
      </div>

      <Tabs defaultValue="one-hot">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="one-hot">One-Hot Encoding</TabsTrigger>
          <TabsTrigger value="tf-idf">TF-IDF</TabsTrigger>
          <TabsTrigger value="word-embeddings">Word Embeddings</TabsTrigger>
        </TabsList>

        <TabsContent value="one-hot" className="mt-6">
          <OneHotEncoderDemo />
        </TabsContent>

        <TabsContent value="tf-idf" className="mt-6">
          <TfIdfVisualization />
        </TabsContent>

        <TabsContent value="word-embeddings" className="mt-6">
          <WordEmbeddingsExplorer />
        </TabsContent>
      </Tabs>
    </div>
  )
}

