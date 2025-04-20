"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { MessageSquare, Filter, Bot, Sun, Moon } from "lucide-react";
import LanguageSelector from "@/components/language-selector";
import ThemeSelector from "@/components/theme-selector";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

export default function Header() {
  const pathname = usePathname();
  const t = useTranslations("Header");
  const { theme, setTheme } = useTheme();

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="hidden font-bold sm:inline-block">
              {t("title")}
            </span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link
              href="/text-classification"
              className={cn(
                "transition-colors hover:text-foreground/80",
                isActive("/text-classification") ? "text-foreground" : "text-foreground/60"
              )}
            >
              {t("navigation.textClassification")}
            </Link>
            <Link
              href="/nlp-filtering"
              className={cn(
                "transition-colors hover:text-foreground/80",
                isActive("/nlp-filtering") ? "text-foreground" : "text-foreground/60"
              )}
            >
              {t("navigation.nlpFiltering")}
            </Link>
            <Link
              href="/chat-box"
              className={cn(
                "transition-colors hover:text-foreground/80",
                isActive("/chat-box") ? "text-foreground" : "text-foreground/60"
              )}
            >
              {t("navigation.chatBox")}
            </Link>
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <ThemeSelector />
          </div>
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <LanguageSelector />
          </div>
        </div>
      </div>
    </header>
  );
} 