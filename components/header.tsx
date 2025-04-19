"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { MessageSquare, Filter, Bot } from "lucide-react";
import LanguageSelector from "@/components/language-selector";
import ThemeToggle from "@/components/theme-toggle";

export default function Header() {
  const pathname = usePathname();
  const t = useTranslations();

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold">{t("app.title")}</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link
              href="/text-classification"
              className={`flex items-center space-x-2 transition-colors hover:text-foreground/80 ${
                isActive("/text-classification") ? "text-foreground" : "text-foreground/60"
              }`}
            >
              <MessageSquare className="h-4 w-4" />
              <span>{t("navigation.textClassification")}</span>
            </Link>
            <Link
              href="/nlp-filtering"
              className={`flex items-center space-x-2 transition-colors hover:text-foreground/80 ${
                isActive("/nlp-filtering") ? "text-foreground" : "text-foreground/60"
              }`}
            >
              <Filter className="h-4 w-4" />
              <span>{t("navigation.nlpFiltering")}</span>
            </Link>
            <Link
              href="/chat-box"
              className={`flex items-center space-x-2 transition-colors hover:text-foreground/80 ${
                isActive("/chat-box") ? "text-foreground" : "text-foreground/60"
              }`}
            >
              <Bot className="h-4 w-4" />
              <span>{t("navigation.chatBox")}</span>
            </Link>
          </nav>
        </div>
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          <LanguageSelector />
        </div>
      </div>
    </header>
  );
} 