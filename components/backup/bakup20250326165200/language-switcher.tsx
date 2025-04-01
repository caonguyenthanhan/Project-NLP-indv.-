// //chuyển đổi ngôn ngữ trong ứng dụng.
// "use client"

// import { usePathname, useRouter } from "next/navigation"
// import { useLocale } from "next-intl"
// import { Button } from "@/components/ui/button"
// import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
// import { Globe } from "lucide-react"
// import { locales } from "@/config"

// const languageNames = {
//   en: "English",
//   vi: "Tiếng Việt",
//   ja: "日本語",
//   zh: "中文",
// }

// export default function LanguageSwitcher() {
//   const locale = useLocale()
//   const router = useRouter()
//   const pathname = usePathname()

//   const switchLanguage = (newLocale: string) => {
//     // Lấy đường dẫn hiện tại và thay thế locale
//     const newPath = pathname.replace(`/${locale}`, `/${newLocale}`)
//     router.push(newPath)
//   }

//   return (
//     <DropdownMenu>
//       <DropdownMenuTrigger asChild>
//         <Button variant="outline" size="icon">
//           <Globe className="h-4 w-4" />
//           <span className="sr-only">Switch language</span>
//         </Button>
//       </DropdownMenuTrigger>
//       <DropdownMenuContent align="end">
//         {locales.map((lang) => (
//           <DropdownMenuItem
//             key={lang}
//             onClick={() => switchLanguage(lang)}
//             className={locale === lang ? "bg-muted" : ""}
//           >
//             {languageNames[lang as keyof typeof languageNames]}
//           </DropdownMenuItem>
//         ))}
//       </DropdownMenuContent>
//     </DropdownMenu>
//   )
// }
"use client"

import { usePathname, useRouter } from "next/navigation"
import { useLocale } from "next-intl"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Globe } from "lucide-react"
import { locales } from "@/config"

const languageNames = {
  en: "English",
  vi: "Tiếng Việt",
  ja: "日本語",
  zh: "中文",
}

export default function LanguageSwitcher({ initialLocale }: { initialLocale: string }) {
  const locale = useLocale() || initialLocale
  const router = useRouter()
  const pathname = usePathname()

  const switchLanguage = (newLocale: string) => {
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`)
    router.push(newPath)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Globe className="h-4 w-4" />
          <span className="sr-only">Switch language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((lang) => (
          <DropdownMenuItem
            key={lang}
            onClick={() => switchLanguage(lang)}
            className={locale === lang ? "bg-muted" : ""}
          >
            {languageNames[lang as keyof typeof languageNames]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}