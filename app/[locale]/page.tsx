// import ClientPage from "@/components/client-page"

// export default function Home({ params: { locale } }: { params: { locale: string } }) {
//   return (
//     <div className="container mx-auto py-8">
//       <div className="text-center mb-8">
//         <h1 className="text-4xl font-bold mb-2">NLP Toolkit</h1>
//         <p className="text-muted-foreground">A comprehensive toolkit for Natural Language Processing techniques</p>
//       </div>
//       <ClientPage />
//     </div>
//   )
// }

import ClientPage from "@/components/client-page"

export default async function Home({ 
  params 
}: { 
  params: Promise<{ locale: string }> // Định nghĩa params là Promise
}) {
  const { locale } = await params; // Await để lấy locale

  return (
    <div className="container mx-auto py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">NLP Toolkit</h1>
        <p className="text-muted-foreground">A comprehensive toolkit for Natural Language Processing techniques</p>
      </div>
      <ClientPage />
    </div>
  )
}