import { getRequestConfig } from 'next-intl/server';
import { locales } from './config';

export default getRequestConfig(async ({ locale }) => {
  const requestLocale = locale || 'en';
  
  if (!locales.includes(requestLocale as any)) {
    return {
      locale: 'en',
      messages: (await import(`./messages/en.json`)).default,
      timeZone: 'Asia/Ho_Chi_Minh',
      now: new Date()
    };
  }

  // First try to load from main messages directory
  try {
    const mainMessages = (await import(`./messages/${requestLocale}.json`)).default;
    return {
      locale: requestLocale,
      messages: mainMessages,
      timeZone: 'Asia/Ho_Chi_Minh',
      now: new Date()
    };
  } catch (error) {
    // If not found in main directory, try auto-translations
    try {
      const autoMessages = (await import(`./messages/auto-translations/${requestLocale}.json`)).default;
      return {
        locale: requestLocale,
        messages: autoMessages,
        timeZone: 'Asia/Ho_Chi_Minh',
        now: new Date()
      };
    } catch (error) {
      // If not found anywhere, fallback to English
      return {
        locale: 'en',
        messages: (await import(`./messages/en.json`)).default,
        timeZone: 'Asia/Ho_Chi_Minh',
        now: new Date()
      };
    }
  }
});

