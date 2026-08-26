'use client';

import React, { useMemo } from 'react';
import { AlertCircle, ShieldAlert } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface HtmlPreviewProps {
  htmlContent: string;
}

export function HtmlPreview({ htmlContent }: HtmlPreviewProps) {
  // Safe HTML sanitization / sandboxing:
  // Using an iframe with strictly sandboxed attributes:
  // sandbox="allow-same-origin" WITHOUT allow-scripts or allow-forms
  // to completely block JavaScript execution from remote untrusted APIs.
  const srcDoc = useMemo(() => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              padding: 16px;
              color: #333;
              line-height: 1.5;
            }
            @media (prefers-color-scheme: dark) {
              body { color: #eee; background: #121212; }
              a { color: #60a5fa; }
            }
          </style>
        </head>
        <body>
          ${htmlContent}
        </body>
      </html>
    `;
  }, [htmlContent]);

  return (
    <div className="h-full flex flex-col p-4 space-y-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-md border border-border/40">
        <ShieldAlert className="h-4 w-4 text-emerald-500 shrink-0" />
        <span>Sandboxed HTML Preview — JavaScript execution is strictly disabled for security</span>
      </div>

      <div className="flex-1 border rounded-lg overflow-hidden bg-background min-h-[300px]">
        <iframe
          title="API HTML Response Preview"
          srcDoc={srcDoc}
          sandbox="allow-same-origin"
          className="w-full h-full border-0"
        />
      </div>
    </div>
  );
}
