import createMiddleware from "next-intl/middleware"
import { locales, defaultLocale } from "./config"

export default createMiddleware({
  // Danh sách các ngôn ngữ được hỗ trợ
  locales,
  defaultLocale,
  // Chuyển hướng tự động dựa trên ngôn ngữ trình duyệt
  localeDetection: true,
})

export const config = {
  // Áp dụng middleware cho tất cả các đường dẫn
  matcher: ["/((?!api|_next|.*\\..*).*)"],
}

