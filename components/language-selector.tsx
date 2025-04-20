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
import { Globe, Loader2 } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { toast } from "sonner";
import { useState, useEffect } from "react";

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
] as const;

const preTranslatedLocales = ['en', 'vi'] as const;

export default function LanguageSelector() {
  const pathname = usePathname();
  const currentLocale = useLocale();
  const router = useRouter();
  const { translate, isTranslating } = useTranslation();
  const t = useTranslations("common");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLocaleChange = async (newLocale: string) => {
    const targetLanguage = languages.find(l => l.code === newLocale)?.name || newLocale;
    const currentLanguage = languages.find(l => l.code === currentLocale)?.name || currentLocale;

    // Get the path without the locale prefix
    const pathWithoutLocale = pathname.replace(`/${currentLocale}`, '') || '/';
    
    // Construct the new path with the new locale
    const newPath = `/${newLocale}${pathWithoutLocale}`;

    try {
      // If switching to a pre-translated locale (en or vi)
      if (preTranslatedLocales.includes(newLocale as typeof preTranslatedLocales[number])) {
        // Show a quick switching message
        toast.success(t("switchingToPreTranslated", { 
          language: targetLanguage as string
        }));
        
        // Navigate to new locale
        window.location.href = newPath;
        return;
      }

      // For other languages, show translation progress
      const switchingToast = toast.loading(
        t("switchingLanguage", { 
          from: currentLanguage as string, 
          to: targetLanguage as string
        })
      );

      // Call the switch-language API
      const response = await fetch('/api/switch-language', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          language: newLocale
        }),
      });

      if (!response.ok) {
        throw new Error('Translation failed');
      }

      // Show success message
      toast.success(
        t("translationComplete", { 
          from: currentLanguage as string, 
          to: targetLanguage as string
        }),
        { id: switchingToast }
      );

      // Navigate to new locale
      window.location.href = newPath;

    } catch (error) {
      console.error('Translation error:', error);
      toast.error(t("languageSwitchError"));
    }
  };

  // Prevent hydration issues
  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="relative">
        <Globe className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Globe className="h-4 w-4" />
          {isTranslating && (
            <Loader2 className="absolute top-0 right-0 h-3 w-3 animate-spin text-primary" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLocaleChange(lang.code)}
            className={currentLocale === lang.code ? "bg-accent" : ""}
          >
            {lang.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 