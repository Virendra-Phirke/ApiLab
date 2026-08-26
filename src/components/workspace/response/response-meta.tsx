'use client';

import React from 'react';
import { ApiResponse, getStatusDisplay } from '@/types/response';
import { formatBytes, formatDuration, getContentTypeLabel } from '@/lib/formatters';
import { Clock, HardDrive, FileType } from 'lucide-react';

interface ResponseMetaProps {
  response: ApiResponse;
}

export function ResponseMeta({ response }: ResponseMetaProps) {
  const statusDisplay = getStatusDisplay(response.status);
  const latency = response.timing.total;

  const latencyColor =
    latency < 200
      ? 'text-emerald-400'
      : latency < 600
      ? 'text-cyan-400'
      : latency < 1500
      ? 'text-amber-400'
      : 'text-rose-400';

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Semantic Status Typography (Borderless soft pill) */}
      <div
        style={{
          backgroundColor: `${statusDisplay.color}15`,
          color: statusDisplay.color,
        }}
        className="font-mono text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1.5"
      >
        <span>{statusDisplay.icon}</span>
        <span>
          {response.status} {response.statusText}
        </span>
      </div>

      {/* Latency / Duration */}
      <div className={`flex items-center gap-1 text-xs font-mono font-medium ${latencyColor}`}>
        <Clock className="h-3.5 w-3.5" />
        <span>{formatDuration(latency)}</span>
      </div>

      {/* Payload Size */}
      <div className="flex items-center gap-1 text-xs font-mono text-muted-foreground">
        <HardDrive className="h-3.5 w-3.5" />
        <span>{formatBytes(response.size)}</span>
      </div>

      {/* Content Type */}
      {response.contentType && (
        <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-muted-foreground px-2 py-0.5 rounded bg-surface-card">
          <FileType className="h-3 w-3" />
          <span>{getContentTypeLabel(response.contentType)}</span>
        </div>
      )}
    </div>
  );
}
