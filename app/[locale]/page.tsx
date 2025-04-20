import HomePage from "@/components/home-page";

export default function Home({ params }: { params: { locale: string } }) {
  return (
    <div className="container mx-auto py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">NLP Toolkit</h1>
        <p className="text-muted-foreground">A comprehensive toolkit for Natural Language Processing techniques</p>
      </div>
      <HomePage />
    </div>
  );
}