import createMiddleware from "next-intl/middleware"
import { locales } from './config'

// Supported locales
const locales = ['en', 'vi', 'fr', 'de', 'es', 'it', 'ja', 'ko', 'zh']

export default createMiddleware({
  // A list of all locales that are supported
  locales,
  // If this locale is matched, pathnames work without a prefix (e.g. `/about`)
  defaultLocale: 'en',
  // Prefix all locales with their identifier
  localePrefix: 'as-needed',
  pathnames: {
    '/': '/',
    '/data-cleaning': '/data-cleaning',
    '/data-augmentation': '/data-augmentation',
    '/text-preprocessing': '/text-preprocessing',
    '/text-representation': '/text-representation',
    '/text-classification': '/text-classification'
  }
})

export const config = {
  // Skip all paths that should not be internationalized
  matcher: ['/', '/(vi|en)/:path*']
}

