import { NextIntlClientProvider } from 'next-intl';
import { notFound } from 'next/navigation';
import LanguageSwitcher from '@/components/language-switcher';

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  let messages;
  try {
    messages = (await import(`../../messages/${locale}.json`)).default;
  } catch (error) {
    notFound(); // Được phép gọi trong segment layout
  }

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <header className="border-b">
        <div className="container mx-auto py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">NLP Toolkit</h1>
          <LanguageSwitcher initialLocale={locale} />
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t mt-12">
        <div className="container mx-auto py-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} NLP Course - All rights reserved
        </div>
      </footer>
    </NextIntlClientProvider>
  );
}