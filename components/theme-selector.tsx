"use client";

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const themes = [
  { id: 'co-dien', className: 'style-co-dien' },
  { id: 'tuyen-ngon', className: 'style-tuyen-ngon' },
  { id: 'toi-yeu-vn', className: 'style-toi-yeu-vn' },
  { id: 'thong-nhat', className: 'style-thong-nhat' },
  { id: 'doc-lap', className: 'style-doc-lap' },
  { id: 'tu-do', className: 'style-tu-do' },
  { id: 'hanh-phuc', className: 'style-hanh-phuc-maroon' },
];

export default function ThemeSelector() {
  const t = useTranslations('theme');
  const { theme: currentMode, setTheme: setMode } = useTheme();
  const [selectedTheme, setSelectedTheme] = useState(themes[0]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Apply theme to the entire document body
    document.body.classList.remove(...themes.map(t => t.className));
    document.body.classList.add(selectedTheme.className);
  }, [selectedTheme]);

  if (!mounted) return null;

  return (
    <div className="flex items-center gap-4">
      {/* Theme Selector Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            {t(`styles.${selectedTheme.id}`)}
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {themes.map((theme) => (
            <DropdownMenuItem
              key={theme.id}
              onClick={() => setSelectedTheme(theme)}
            >
              <span className={selectedTheme.id === theme.id ? 'font-bold' : ''}>
                {t(`styles.${theme.id}`)}
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Mode Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setMode(currentMode === 'light' ? 'dark' : 'light')}
        className="w-9 h-9 px-0"
      >
        {currentMode === 'light' ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-7.5 0 4 4 0 017.5 0z"
            />
          </svg>
        )}
      </Button>
    </div>
  );
} 