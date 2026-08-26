'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Send, Loader2, Copy, Check, X, CornerDownLeft, Timer, Activity } from 'lucide-react';
import { MethodSelector } from './method-selector';
import { HttpMethod } from '@/types/request';
import { generateCurl } from '@/lib/curl';
import { useWorkspaceStore } from '@/store/workspace-store';
import { useSchedulerStore } from '@/store/scheduler-store';
import { toast } from 'sonner';

interface UrlBarProps {
  method: HttpMethod;
  url: string;
  isLoading: boolean;
  onMethodChange: (method: HttpMethod) => void;
  onUrlChange: (url: string) => void;
  onSend: () => void;
}

export function UrlBar({
  method,
  url,
  isLoading,
  onMethodChange,
  onUrlChange,
  onSend,
}: UrlBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [sendFeedback, setSendFeedback] = useState<'idle' | 'success' | 'error'>('idle');
  const { activeRequest, response, environments, activeEnvironmentId, setMainView } = useWorkspaceStore();
  const { prepareNewJob, jobs } = useSchedulerStore();

  const activeRunningJob = jobs.find((j) => j.status === 'running');

  // Watch response to show temporary success/error feedback on Send button
  useEffect(() => {
    if (response) {
      if (response.status >= 200 && response.status < 400) {
        setSendFeedback('success');
      } else {
        setSendFeedback('error');
      }
      const timer = setTimeout(() => setSendFeedback('idle'), 2200);
      return () => clearTimeout(timer);
    }
  }, [response]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSend();
    }
  };

  const handleCopyCurl = () => {
    try {
      const curlCmd = generateCurl({
        method: activeRequest.method,
        url: activeRequest.url || 'https://api.example.com',
        headers: activeRequest.headers,
        body: activeRequest.body,
        auth: activeRequest.auth,
        redactSecrets: false,
      });

      navigator.clipboard.writeText(curlCmd);
      setCopiedCurl(true);
      toast.success('Copied cURL command to clipboard');
      setTimeout(() => setCopiedCurl(false), 2000);
    } catch {
      toast.error('Failed to generate cURL');
    }
  };

  const handleOpenScheduler = () => {
    const activeEnv = environments.find((e) => e.id === activeEnvironmentId);
    prepareNewJob(activeRequest, activeEnv?.variables || []);
  };

  return (
    <div className="px-4 py-2 bg-surface-panel flex flex-col gap-2 shrink-0">
      <div className="flex items-center gap-2">
        {/* Method Selector Dropdown */}
        <MethodSelector value={method} onChange={onMethodChange} />

        {/* Borderless URL Input Container */}
        <div className="relative flex-1 group">
          <input
            ref={inputRef}
            value={url}
            onChange={(e) => onUrlChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter request URL (e.g. https://api.open-meteo.com/v1/forecast or https://api.example.com)"
            className="w-full h-9 pl-3 pr-20 rounded-lg bg-surface-input text-foreground placeholder:text-muted-foreground/50 font-mono text-xs focus:bg-surface-editor outline-none card-shadow transition-colors"
            spellCheck={false}
            autoComplete="off"
          />

          {/* Right Action Icons inside URL Bar */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <button
              type="button"
              onClick={handleCopyCurl}
              className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-surface-card transition-colors cursor-pointer"
              title="Copy cURL"
            >
              {copiedCurl ? (
                <Check className="h-3 w-3 text-emerald-400" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </button>

            <span className="hidden md:inline-flex items-center text-[10px] font-mono text-muted-foreground/50 px-1 py-0.5 rounded bg-surface-card select-none">
              <CornerDownLeft className="h-2.5 w-2.5" />
            </span>
          </div>
        </div>

        {/* Active Schedule Runner Pulsing Badge */}
        {activeRunningJob && (
          <button
            type="button"
            onClick={() => setMainView('schedules')}
            className="h-9 px-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer animate-pulse hover:bg-emerald-500/25 transition-all shrink-0"
            title={`"${activeRunningJob.name}" is running. Click to view live studio.`}
          >
            <Activity className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{activeRunningJob.name}: {activeRunningJob.countdownSeconds}s</span>
          </button>
        )}

        {/* Schedule / Auto-Runner Config Trigger */}
        <button
          type="button"
          onClick={handleOpenScheduler}
          className="h-9 px-2.5 rounded-lg bg-surface-card hover:bg-surface-card-hover border border-border/30 text-muted-foreground hover:text-foreground text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
          title="Schedule request or setup interval runner"
        >
          <Timer className="h-3.5 w-3.5 text-primary" />
          <span className="hidden md:inline">Schedule</span>
        </button>

        {/* Send Button with Theme-Adaptive High-Contrast Solid Colors */}
        <button
          type="button"
          onClick={onSend}
          disabled={isLoading}
          className={`h-9 px-5 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 shrink-0 select-none cursor-pointer text-white ${
            isLoading
              ? 'bg-blue-600/70 cursor-wait'
              : sendFeedback === 'success'
              ? 'bg-emerald-600 shadow-sm shadow-emerald-600/30'
              : sendFeedback === 'error'
              ? 'bg-rose-600 shadow-sm shadow-rose-600/30'
              : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 shadow-sm shadow-blue-600/30 dark:glow-primary hover:scale-[1.01] active:scale-[0.98]'
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Sending...</span>
            </>
          ) : sendFeedback === 'success' ? (
            <>
              <Check className="h-3.5 w-3.5" />
              <span>Sent</span>
            </>
          ) : sendFeedback === 'error' ? (
            <>
              <X className="h-3.5 w-3.5" />
              <span>Failed</span>
            </>
          ) : (
            <>
              <Send className="h-3 w-3" />
              <span>SEND</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
