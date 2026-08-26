'use client';

import React, { useState, useMemo } from 'react';
import { Trash2, Clock, Search, HardDrive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useHistory } from '@/hooks/use-history';
import { useWorkspaceStore } from '@/store/workspace-store';
import { formatRelativeTime, formatDuration, formatBytes } from '@/lib/formatters';
import { HTTP_METHOD_COLORS, HttpMethod } from '@/types/request';
import { getStatusDisplay } from '@/types/response';

export function HistoryList() {
  const { history, clearHistory, deleteEntry } = useHistory();
  const { updateActiveRequest } = useWorkspaceStore();
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');

  const handleSelectEntry = (entry: typeof history[0]) => {
    updateActiveRequest({
      method: entry.method as HttpMethod,
      url: entry.url,
      name: `${entry.method} ${entry.url.split('/').pop() || 'Request'}`,
    });
  };

  const filteredHistory = useMemo(() => {
    return history.filter((entry) => {
      const matchesSearch =
        !search.trim() ||
        entry.url.toLowerCase().includes(search.toLowerCase()) ||
        entry.method.toLowerCase().includes(search.toLowerCase()) ||
        String(entry.status).includes(search);
      const matchesMethod = methodFilter === 'ALL' || entry.method === methodFilter;
      return matchesSearch && matchesMethod;
    });
  }, [history, search, methodFilter]);

  return (
    <div className="flex flex-col h-full overflow-hidden text-foreground">
      {/* Header */}
      <div className="p-2 space-y-1.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            History
          </span>
          {history.length > 0 && (
            <button
              type="button"
              onClick={clearHistory}
              className="h-5 px-1.5 rounded text-[10px] text-muted-foreground hover:text-rose-400 hover:bg-surface-card transition-colors flex items-center gap-1"
            >
              <Trash2 className="h-2.5 w-2.5" />
              <span>Clear</span>
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search history..."
            className="w-full h-7 text-xs pl-7 pr-2 rounded-md bg-surface-card hover:bg-surface-card-hover text-foreground placeholder:text-muted-foreground/60 focus:bg-surface-input transition-colors outline-none"
          />
        </div>

        {/* Method Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
          {['ALL', 'GET', 'POST', 'PUT', 'DELETE'].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMethodFilter(m)}
              className={`text-[10px] font-mono px-2 py-0.5 rounded transition-colors font-semibold ${
                methodFilter === m
                  ? 'bg-primary text-white'
                  : 'bg-surface-card text-muted-foreground hover:text-foreground'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-1.5 py-1 space-y-1">
        {filteredHistory.length === 0 ? (
          <div className="text-center py-10 px-4 text-xs text-muted-foreground rounded-xl bg-surface-card/40 my-2">
            {search || methodFilter !== 'ALL'
              ? 'No history matches your filter.'
              : 'No history yet. Outbound requests will be recorded here automatically.'}
          </div>
        ) : (
          filteredHistory.map((entry) => {
            const methodColor =
              HTTP_METHOD_COLORS[entry.method as HttpMethod] || '#3b82f6';
            const statusDisplay = getStatusDisplay(entry.status);

            return (
              <div
                key={entry.id}
                onClick={() => handleSelectEntry(entry)}
                className="group p-2 rounded-lg bg-surface-card hover:bg-surface-card-hover transition-all cursor-pointer card-shadow space-y-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <span
                      style={{ color: methodColor }}
                      className="font-mono text-[10px] font-bold shrink-0"
                    >
                      {entry.method}
                    </span>
                    <span className="font-mono text-xs truncate text-foreground/90">
                      {entry.url}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteEntry(entry.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-rose-400 p-0.5 transition-opacity"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span
                      style={{ color: statusDisplay.color }}
                      className="font-bold flex items-center gap-0.5"
                    >
                      {entry.status} {entry.statusText}
                    </span>
                    <span>{formatDuration(entry.duration)}</span>
                    <span>{formatBytes(entry.size)}</span>
                  </div>
                  <span>{formatRelativeTime(entry.timestamp)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
