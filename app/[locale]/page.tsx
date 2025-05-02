import HomePage from "@/components/home-page";

export default function Home({ params }: { params: { locale: string } }) {
  return (
    <div className="container mx-auto">
      <HomePage />
    </div>
  );
}