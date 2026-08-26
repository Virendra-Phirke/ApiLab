'use client';

import React, { useState, useEffect } from 'react';
import { Trash2, CheckCircle2, Circle, Eye, EyeOff } from 'lucide-react';
import { Header } from '@/types/request';

interface HeadersEditorProps {
  headers: Header[];
  onChange: (headers: Header[]) => void;
}

export function HeadersEditor({ headers, onChange }: HeadersEditorProps) {
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});

  // Always ensure at least one active row is available to type in immediately
  useEffect(() => {
    if (headers.length === 0) {
      onChange([
        {
          id: crypto.randomUUID(),
          key: '',
          value: '',
          enabled: true,
        },
      ]);
    }
  }, [headers.length, onChange]);

  const toggleReveal = (id: string) => {
    setRevealedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const updateHeader = (id: string, updates: Partial<Header>) => {
    const updated = headers.map((h) => (h.id === id ? { ...h, ...updates } : h));

    // Auto-append next empty row if typing into the last row
    const lastHeader = updated[updated.length - 1];
    if (lastHeader && (lastHeader.key || lastHeader.value)) {
      updated.push({
        id: crypto.randomUUID(),
        key: '',
        value: '',
        enabled: true,
      });
    }

    onChange(updated);
  };

  const deleteHeader = (id: string) => {
    const filtered = headers.filter((h) => h.id !== id);
    if (filtered.length === 0) {
      onChange([
        {
          id: crypto.randomUUID(),
          key: '',
          value: '',
          enabled: true,
        },
      ]);
    } else {
      onChange(filtered);
    }
  };

  const isSensitive = (key: string) => {
    const k = key.toLowerCase();
    return k.includes('auth') || k.includes('key') || k.includes('token') || k.includes('secret');
  };

  const displayHeaders = headers.length > 0 ? headers : [
    {
      id: 'default-row',
      key: '',
      value: '',
      enabled: true,
    },
  ];

  return (
    <div className="p-4 space-y-1.5">
      {displayHeaders.map((header, index) => {
        const sensitive = isSensitive(header.key);
        const isRevealed = revealedIds[header.id];

        return (
          <div
            key={header.id || index}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-card hover:bg-surface-card-hover transition-all card-shadow ${
              !header.enabled ? 'opacity-40' : ''
            }`}
          >
            {/* Checkbox */}
            <button
              type="button"
              onClick={() => updateHeader(header.id, { enabled: !header.enabled })}
              className="text-muted-foreground hover:text-foreground h-6 w-6 flex items-center justify-center shrink-0 cursor-pointer"
            >
              {header.enabled ? (
                <CheckCircle2 className="h-4 w-4 text-primary" />
              ) : (
                <Circle className="h-4 w-4" />
              )}
            </button>

            {/* Key Input */}
            <input
              value={header.key}
              onChange={(e) => updateHeader(header.id, { key: e.target.value })}
              placeholder="Header (e.g. Accept)"
              className="h-7 font-mono text-xs bg-transparent text-foreground placeholder:text-muted-foreground/40 flex-1 outline-none px-1"
            />

            {/* Value Input */}
            <div className="relative flex-1 flex items-center">
              <input
                type={sensitive && !isRevealed ? 'password' : 'text'}
                value={header.value}
                onChange={(e) => updateHeader(header.id, { value: e.target.value })}
                placeholder="Value (e.g. application/json)"
                className="h-7 font-mono text-xs bg-transparent text-foreground placeholder:text-muted-foreground/40 w-full outline-none px-1 pr-6"
              />
              {sensitive && (
                <button
                  type="button"
                  onClick={() => toggleReveal(header.id)}
                  className="absolute right-1 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  {isRevealed ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                </button>
              )}
            </div>

            {/* Delete button */}
            {headers.length > 1 && (
              <button
                type="button"
                onClick={() => deleteHeader(header.id)}
                className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-rose-400 hover:bg-surface-panel transition-colors shrink-0 cursor-pointer"
                title="Delete header"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
