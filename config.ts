// Supported locales
export const locales = ['en', 'vi', 'fr', 'de', 'es', 'it', 'ja', 'ko', 'zh'] as const;

// Default locale
export const defaultLocale = 'en' as const;

// Locale type
export type Locale = typeof locales[number];

export const languageNames = {
  en: "English",
  vi: "Tiếng Việt",
  vi_mien_tay: "Miền Tây",
  vi_genz: "GenZ",
  vi_khmer: "Tiếng Khmer",
  vi_tay: "Tiếng Tày",
  vi_cham: "Tiếng Chăm",
  fr: "Français",
  de: "Deutsch",
  es: "Español",
  it: "Italiano",
  ja: "日本語",
  ko: "한국어",
  zh: "中文"
} as const;