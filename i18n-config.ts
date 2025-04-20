import i18next from "i18next";
import HttpBackend from "i18next-http-backend";
import { initReactI18next } from "react-i18next";

i18next
  .use(HttpBackend)
  .use(initReactI18next)
  .init({
    lng: "en",
    fallbackLng: "en",
    supportedLngs: [
      "en", 
      "vi",
      "vi_mien_tay",
      "vi_genz",
      "vi_khmer",
      "vi_tay",
      "vi_cham"
    ],
    backend: {
      loadPath: "/messages/{{lng}}.json",
    },
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18next; 