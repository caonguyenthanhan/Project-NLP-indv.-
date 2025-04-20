import createMiddleware from "next-intl/middleware"
import { defaultLocale } from "./config"

// Supported locales
export const locales = [
  "en", "vi", "zh", "ja", "ko", "fr", "de", "es", "it", "ru", 
  "ar", "hi", "pt", "nl", "pl", "tr", "uk", "th", "id", "ms",
  "sv", "da", "fi", "no", "cs", "hu", "ro", "sk", "bg", "el",
  "he", "bn", "fa", "sr", "hr", "sl", "et", "lv", "lt", "ur",
  "ta", "te", "ml", "kn", "mr", "gu", "my", "km", "lo", "ne"
]

export default createMiddleware({
  // A list of all locales that are supported
  locales,
  // Used when no locale matches
  defaultLocale,
  // Enable locale detection
  localeDetection: true
})

export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/((?!api|_next|.*\\..*).*)']
}

