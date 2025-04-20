import { useState } from 'react';

export function useTranslation() {
  const [isTranslating, setIsTranslating] = useState(false);

  const translate = async (targetLocale: string) => {
    setIsTranslating(true);
    try {
      const response = await fetch('/api/switch-language', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ language: targetLocale }),
      });

      if (!response.ok) {
        throw new Error('Failed to translate content');
      }

      const data = await response.json();
      console.log('Translation status:', data);
    } catch (error) {
      console.error('Translation error:', error);
      throw error;
    } finally {
      setIsTranslating(false);
    }
  };

  return { translate, isTranslating };
} 