import { redirect } from "next/navigation"
import { defaultLocale } from "@/config"

// Chuyển hướng từ / đến /en (hoặc locale mặc định)
export default function Home() {
  redirect(`/${defaultLocale}`)
}

