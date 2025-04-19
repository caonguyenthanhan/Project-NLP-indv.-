import { getRequestConfig } from 'next-intl/server';
import { locales } from './config';

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = requestLocale || 'en';
  
  if (!locales.includes(locale as any)) {
    return {
      locale: 'en',
      messages: (await import(`./messages/en.json`)).default,
      timeZone: 'Asia/Ho_Chi_Minh',
      now: new Date()
    };
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
    timeZone: 'Asia/Ho_Chi_Minh',
    now: new Date()
  };
});

