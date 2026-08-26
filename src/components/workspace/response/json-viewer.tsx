'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useEditorTheme } from '@/hooks/use-editor-theme';

const Editor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="h-full min-h-[260px] flex items-center justify-center bg-surface-editor font-mono text-xs text-muted-foreground">
      Rendering formatted response...
    </div>
  ),
});

interface JsonViewerProps {
  content: string;
  language?: string;
}

export function JsonViewer({ content, language = 'json' }: JsonViewerProps) {
  const { editorTheme } = useEditorTheme();

  return (
    <div className="h-full w-full bg-surface-editor overflow-hidden">
      <Editor
        key={editorTheme}
        height="100%"
        language={language}
        value={content}
        theme={editorTheme}
        onMount={(_editor, monaco) => {
          monaco.editor.setTheme(editorTheme);
        }}
        options={{
          readOnly: true,
          minimap: { enabled: false },
          fontSize: 12.5,
          fontFamily: 'var(--font-mono), monospace',
          lineNumbers: 'on',
          folding: true,
          automaticLayout: true,
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          domReadOnly: true,
          renderValidationDecorations: 'off',
        }}
      />
    </div>
  );
}
