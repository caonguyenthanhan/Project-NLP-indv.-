import { useState } from 'react';

export function useTranslation() {
  const [isTranslating, setIsTranslating] = useState(false);

  const translate = async (messages: any, targetLocale: string) => {
    setIsTranslating(true);
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages, targetLocale }),
      });

      if (!response.ok) {
        throw new Error('Translation failed');
      }

      const data = await response.json();
      return data.messages;
    } catch (error) {
      console.error('Translation error:', error);
      throw error;
    } finally {
      setIsTranslating(false);
    }
  };

  return { translate, isTranslating };
} 