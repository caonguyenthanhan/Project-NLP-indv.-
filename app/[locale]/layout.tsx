import { Inter } from "next/font/google";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { ThemeProvider } from "@/components/theme-provider";
import Header from "@/components/header";
import { WorkflowProvider } from "@/context/workflow-context";
import { ToasterProvider } from "@/components/providers/toaster-provider";
import path from "path";
import fs from "fs/promises";

const inter = Inter({ 
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter"
});

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "vi" }];
}

async function getMessages(locale: string) {
  try {
    const messagesPath = path.join(process.cwd(), "messages", `${locale}.json`);
    const fileExists = await fs.access(messagesPath).then(() => true).catch(() => false);
    
    if (!fileExists) {
      console.error(`Messages file not found for locale ${locale} at path: ${messagesPath}`);
      notFound();
    }

    const messagesContent = await fs.readFile(messagesPath, "utf-8");
    return JSON.parse(messagesContent);
  } catch (error) {
    console.error(`Error loading messages for locale ${locale}:`, error);
    notFound();
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const locale = params.locale;
  const messages = await getMessages(locale);

  return (
    <div className="min-h-screen bg-background font-sans antialiased text-sm md:text-base">
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <NextIntlClientProvider 
          locale={locale}
          messages={messages}
        >
          <WorkflowProvider>
            <Header />
            <main className="container py-6">
              {children}
            </main>
            <ToasterProvider />
          </WorkflowProvider>
        </NextIntlClientProvider>
      </ThemeProvider>
    </div>
  );
}