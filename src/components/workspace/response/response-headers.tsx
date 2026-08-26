'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Copy, Check, Search } from 'lucide-react';
import { toast } from 'sonner';

interface ResponseHeadersProps {
  headers: Record<string, string>;
}

export function ResponseHeaders({ headers }: ResponseHeadersProps) {
  const [search, setSearch] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const headerEntries = Object.entries(headers);
  const filtered = search
    ? headerEntries.filter(
        ([k, v]) =>
          k.toLowerCase().includes(search.toLowerCase()) ||
          v.toLowerCase().includes(search.toLowerCase())
      )
    : headerEntries;

  const copyHeader = (key: string, value: string) => {
    navigator.clipboard.writeText(`${key}: ${value}`);
    setCopiedKey(key);
    toast.success(`Copied "${key}" to clipboard`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="p-3 space-y-3">
      {/* Search Header Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter headers by key or value..."
            className="h-8 pl-8 font-mono text-xs bg-surface-input border-transparent focus-visible:ring-1"
          />
        </div>
        <span className="text-xs font-mono text-muted-foreground">
          {filtered.length} of {headerEntries.length} headers
        </span>
      </div>

      {headerEntries.length === 0 ? (
        <div className="text-center py-8 rounded-xl text-xs text-muted-foreground bg-surface-card/40">
          No response headers available.
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden bg-surface-card card-shadow divide-y divide-border/20">
          <div className="grid grid-cols-[1fr_2fr_36px] px-3 py-2 bg-surface-panel font-mono text-xs font-semibold text-muted-foreground">
            <div>Header</div>
            <div>Value</div>
            <div></div>
          </div>
          {filtered.map(([key, value]) => (
            <div
              key={key}
              className="grid grid-cols-[1fr_2fr_36px] items-center px-3 py-1.5 gap-2 text-xs font-mono hover:bg-surface-panel/50 transition-colors"
            >
              <div className="font-semibold text-primary truncate select-all">{key}</div>
              <div className="text-muted-foreground truncate select-all">{value}</div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => copyHeader(key, value)}
                className="h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-surface-panel"
              >
                {copiedKey === key ? (
                  <Check className="h-3 w-3 text-emerald-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
