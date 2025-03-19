import { getRequestConfig } from "next-intl/server"
import { locales } from "./config"

export default getRequestConfig(async ({ locale }) => {
  // Đảm bảo locale hợp lệ
  if (!locales.includes(locale as any)) {
    locale = "en"
  }

  // Tải file ngôn ngữ tương ứng
  return {
    locale: locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  }
})

