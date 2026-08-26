import { useEffect } from 'react';

interface ShortcutOptions {
  onSend?: () => void;
  onSave?: () => void;
  onNewRequest?: () => void;
  onDuplicate?: () => void;
  onCommandPalette?: () => void;
  onFocusUrl?: () => void;
}

export function useKeyboardShortcuts(options: ShortcutOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrMeta = e.ctrlKey || e.metaKey;

      // Ctrl + Enter -> Send request
      if (isCtrlOrMeta && e.key === 'Enter') {
        e.preventDefault();
        options.onSend?.();
        return;
      }

      // Ctrl + S -> Save request
      if (isCtrlOrMeta && (e.key === 's' || e.key === 'S') && !e.shiftKey) {
        e.preventDefault();
        options.onSave?.();
        return;
      }

      // Ctrl + K or Ctrl + Shift + P -> Command palette
      if ((isCtrlOrMeta && (e.key === 'k' || e.key === 'K')) || (isCtrlOrMeta && e.shiftKey && (e.key === 'p' || e.key === 'P'))) {
        e.preventDefault();
        options.onCommandPalette?.();
        return;
      }

      // Ctrl + D -> Duplicate request
      if (isCtrlOrMeta && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        options.onDuplicate?.();
        return;
      }

      // Ctrl + / -> Focus URL
      if (isCtrlOrMeta && e.key === '/') {
        e.preventDefault();
        options.onFocusUrl?.();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [options]);
}
