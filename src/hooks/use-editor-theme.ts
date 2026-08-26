'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';

export function useEditorTheme() {
  const { resolvedTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    setMounted(true);

    const checkIsDark = () => {
      if (typeof document !== 'undefined') {
        return document.documentElement.classList.contains('dark');
      }
      return (resolvedTheme || theme) === 'dark';
    };

    setIsDark(checkIsDark());

    const observer = new MutationObserver(() => {
      setIsDark(checkIsDark());
    });

    if (typeof document !== 'undefined') {
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class'],
      });
    }

    return () => observer.disconnect();
  }, [resolvedTheme, theme]);

  const activeDark = mounted ? isDark : true;

  return {
    isDark: activeDark,
    editorTheme: activeDark ? 'vs-dark' : 'vs',
  };
}
