"use client";

import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { locales } from "@/middleware";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { toast } from "sonner";

const languages = [
  { code: "en", name: "English" },
  { code: "vi", name: "Tiếng Việt" },
  { code: "zh", name: "中文" },
  { code: "ja", name: "日本語" },
  { code: "ko", name: "한국어" },
  { code: "fr", name: "Français" },
  { code: "de", name: "Deutsch" },
  { code: "es", name: "Español" },
  { code: "it", name: "Italiano" },
  { code: "ru", name: "Русский" },
  { code: "ar", name: "العربية" },
  { code: "hi", name: "हिन्दी" },
  { code: "pt", name: "Português" },
  { code: "nl", name: "Nederlands" },
  { code: "pl", name: "Polski" },
  { code: "tr", name: "Türkçe" },
  { code: "uk", name: "Українська" },
  { code: "th", name: "ไทย" },
  { code: "id", name: "Bahasa Indonesia" },
  { code: "ms", name: "Bahasa Melayu" },
  { code: "sv", name: "Svenska" },
  { code: "da", name: "Dansk" },
  { code: "fi", name: "Suomi" },
  { code: "no", name: "Norsk" },
  { code: "cs", name: "Čeština" },
  { code: "hu", name: "Magyar" },
  { code: "ro", name: "Română" },
  { code: "sk", name: "Slovenčina" },
  { code: "bg", name: "Български" },
  { code: "el", name: "Ελληνικά" },
  { code: "he", name: "עברית" },
  { code: "bn", name: "বাংলা" },
  { code: "fa", name: "فارسی" },
  { code: "sr", name: "Српски" },
  { code: "hr", name: "Hrvatski" },
  { code: "sl", name: "Slovenščina" },
  { code: "et", name: "Eesti" },
  { code: "lv", name: "Latviešu" },
  { code: "lt", name: "Lietuvių" },
  { code: "ur", name: "اردو" },
  { code: "ta", name: "தமிழ்" },
  { code: "te", name: "తెలుగు" },
  { code: "ml", name: "മലയാളം" },
  { code: "kn", name: "ಕನ್ನಡ" },
  { code: "mr", name: "मराठी" },
  { code: "gu", name: "ગુજરાતી" },
  { code: "my", name: "မြန်မာ" },
  { code: "km", name: "ខ្មែរ" },
  { code: "lo", name: "ລາວ" },
  { code: "ne", name: "नेपाली" }
];

const preTranslatedLocales = ['en', 'vi'];

export default function LanguageSelector() {
  const pathname = usePathname();
  const currentLocale = useLocale();
  const router = useRouter();
  const { translate, isTranslating } = useTranslation();
  const t = useTranslations("common");

  const checkFileExists = async (locale: string) => {
    try {
      const response = await fetch(`/messages/${locale}.json`);
      return response.ok;
    } catch {
      return false;
    }
  };

  const handleLocaleChange = async (newLocale: string) => {
    const targetLanguage = languages.find(l => l.code === newLocale)?.name;
    const currentLanguage = languages.find(l => l.code === currentLocale)?.name;

    // Get the path without the locale prefix
    const pathWithoutLocale = pathname.replace(`/${currentLocale}`, '') || '/';
    
    // Construct the new path with the new locale
    const newPath = `/${newLocale}${pathWithoutLocale}`;

    try {
      // Show initial switching notification
      const switchingToast = toast.loading(
        `Switching from ${currentLanguage} to ${targetLanguage}...`
      );

      // If it's a pre-translated locale or the file already exists, navigate immediately
      if (preTranslatedLocales.includes(newLocale) || await checkFileExists(newLocale)) {
        router.push(newPath);
        toast.success(`Successfully switched to ${targetLanguage}`, {
          id: switchingToast
        });
        return;
      }

      // Show translation in progress
      toast.loading(`Translating content to ${targetLanguage}...`, {
        id: switchingToast
      });

      // Get English messages as source
      const response = await fetch(`/messages/en.json`);
      const messages = await response.json();

      // Translate messages using Next.js API route
      const translationResponse = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          targetLocale: newLocale
        }),
      });

      if (!translationResponse.ok) {
        throw new Error('Translation failed');
      }

      const { messages: translatedMessages } = await translationResponse.json();

      // Save translated messages
      const saveResponse = await fetch('/api/save-translation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          locale: newLocale,
          messages: translatedMessages,
        }),
      });

      if (!saveResponse.ok) {
        throw new Error('Failed to save translation');
      }

      // Show success and navigate
      toast.success(`Successfully switched to ${targetLanguage}`, {
        id: switchingToast
      });

      // Navigate to new locale
      router.push(newPath);

    } catch (error) {
      console.error('Translation error:', error);
      toast.error(`Failed to switch to ${targetLanguage}. Please try again later.`);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Globe className="h-5 w-5" />
          <span className="sr-only">{t("changeLanguage")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-[400px] overflow-y-auto">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLocaleChange(lang.code)}
            className={currentLocale === lang.code ? "font-bold" : ""}
            disabled={isTranslating && !preTranslatedLocales.includes(lang.code)}
          >
            {lang.name}
            {!preTranslatedLocales.includes(lang.code) && (
              <span className="ml-2 text-xs text-muted-foreground">(Auto)</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 