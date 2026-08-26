'use client';

import React, { useEffect } from 'react';
import { Trash2, CheckCircle2, Circle } from 'lucide-react';
import { QueryParam } from '@/types/request';

interface ParamsEditorProps {
  params: QueryParam[];
  onChange: (params: QueryParam[]) => void;
}

export function ParamsEditor({ params, onChange }: ParamsEditorProps) {
  // Always ensure at least one active row is available to type in immediately
  useEffect(() => {
    if (params.length === 0) {
      onChange([
        {
          id: crypto.randomUUID(),
          key: '',
          value: '',
          enabled: true,
        },
      ]);
    }
  }, [params.length, onChange]);

  const updateParam = (id: string, updates: Partial<QueryParam>) => {
    const updated = params.map((p) => (p.id === id ? { ...p, ...updates } : p));

    // Auto-append next empty row if typing into the last row
    const lastParam = updated[updated.length - 1];
    if (lastParam && (lastParam.key || lastParam.value)) {
      updated.push({
        id: crypto.randomUUID(),
        key: '',
        value: '',
        enabled: true,
      });
    }

    onChange(updated);
  };

  const deleteParam = (id: string) => {
    const filtered = params.filter((p) => p.id !== id);
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

  const displayParams = params.length > 0 ? params : [
    {
      id: 'default-row',
      key: '',
      value: '',
      enabled: true,
    },
  ];

  return (
    <div className="p-4 space-y-1.5">
      {displayParams.map((param, index) => (
        <div
          key={param.id || index}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-card hover:bg-surface-card-hover transition-all card-shadow ${
            !param.enabled ? 'opacity-40' : ''
          }`}
        >
          {/* Checkbox */}
          <button
            type="button"
            onClick={() => updateParam(param.id, { enabled: !param.enabled })}
            className="text-muted-foreground hover:text-foreground h-6 w-6 flex items-center justify-center shrink-0 cursor-pointer"
          >
            {param.enabled ? (
              <CheckCircle2 className="h-4 w-4 text-primary" />
            ) : (
              <Circle className="h-4 w-4" />
            )}
          </button>

          {/* Key Input */}
          <input
            value={param.key}
            onChange={(e) => updateParam(param.id, { key: e.target.value })}
            placeholder="Key (e.g. page)"
            className="h-7 font-mono text-xs bg-transparent text-foreground placeholder:text-muted-foreground/40 flex-1 outline-none px-1"
          />

          {/* Value Input */}
          <input
            value={param.value}
            onChange={(e) => updateParam(param.id, { value: e.target.value })}
            placeholder="Value (e.g. 1)"
            className="h-7 font-mono text-xs bg-transparent text-foreground placeholder:text-muted-foreground/40 flex-1 outline-none px-1"
          />

          {/* Delete Icon */}
          {params.length > 1 && (
            <button
              type="button"
              onClick={() => deleteParam(param.id)}
              className="text-muted-foreground hover:text-rose-500 h-6 w-6 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
              title="Delete parameter"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
