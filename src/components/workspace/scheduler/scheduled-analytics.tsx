'use client';

import React, { useState } from 'react';
import { useSchedulerStore } from '@/store/scheduler-store';
import { useWorkspaceStore } from '@/store/workspace-store';
import {
  Timer,
  Play,
  Pause,
  Square,
  RotateCcw,
  Download,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Activity,
  Zap,
  ArrowUpRight,
  RefreshCw,
  Clock,
  Layers,
  ChevronRight,
  ChevronDown,
  ExternalLink,
} from 'lucide-react';
import { formatBytes } from '@/lib/formatters';
import { toast } from 'sonner';

export function ScheduledAnalytics() {
  const {
    config,
    status,
    countdownSeconds,
    logs,
    stats,
    targetRequest,
    isRetrying,
    lastFailedLog,
    setIsOpen,
    setActiveTab,
    startJob,
    pauseJob,
    resumeJob,
    stopJob,
    clearLogs,
    retryLastFailedRun,
  } = useSchedulerStore();

  const { updateActiveRequest } = useWorkspaceStore();
  const [filter, setFilter] = useState<'all' | 'success' | 'error'>('all');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const methodColors: Record<string, string> = {
    GET: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    POST: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    PUT: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    PATCH: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    DELETE: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    HEAD: 'bg-teal-500/15 text-teal-400 border-teal-500/30',
    OPTIONS: 'bg-pink-500/15 text-pink-400 border-pink-500/30',
  };

  const filteredLogs = logs.filter((log) => {
    if (filter === 'success') return log.status >= 200 && log.status < 400;
    if (filter === 'error') return log.status >= 400 || log.status === 0;
    return true;
  });

  const successRate =
    stats.totalRuns > 0
      ? Math.round((stats.successCount / stats.totalRuns) * 100)
      : 100;

  const handleExportLogs = () => {
    if (logs.length === 0) {
      toast.info('No execution logs to export.');
      return;
    }
    const blob = new Blob([JSON.stringify({ stats, logs }, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `apilab-runner-logs-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Runner logs exported');
  };

  const formatCountdown = (totalSec: number) => {
    if (totalSec < 60) return `${totalSec}s`;
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    }
    return `${minutes}m ${seconds}s`;
  };

  const handleLoadInEditor = (log: typeof logs[0]) => {
    updateActiveRequest({
      method: log.method,
      url: log.url,
    });
    toast.success(`Loaded ${log.method} ${log.url} into editor`);
  };

  return (
    <div className="flex flex-col h-full space-y-3 pb-2 select-none">
      {/* 1. Active Runner Controller Card */}
      <div className="p-3 rounded-xl bg-surface-card border border-border/30 space-y-2.5 card-shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-xs">
              <Timer className="h-3 w-3 fill-white" />
            </div>
            <div>
              <span className="text-xs font-bold text-foreground">Auto-Runner</span>
              <span className="text-[10px] text-muted-foreground block font-mono">
                {config.type === 'daily'
                  ? `Daily @ ${config.dailyTime || '09:00'}`
                  : config.type === 'interval'
                  ? `Every ${config.intervalValue} ${config.intervalUnit}`
                  : 'One-time run'}
              </span>
            </div>
          </div>

          {/* Status Badge */}
          {status === 'running' ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 animate-pulse">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {formatCountdown(countdownSeconds)}
            </span>
          ) : status === 'paused' ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
              Paused
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono text-muted-foreground bg-surface-input">
              Idle
            </span>
          )}
        </div>

        {/* Target Request Info */}
        <div className="p-2 rounded-lg bg-surface-panel border border-border/20 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className={`px-1 py-0.2 rounded text-[9px] font-bold font-mono border shrink-0 ${
                methodColors[targetRequest?.method || 'GET']
              }`}
            >
              {targetRequest?.method || 'GET'}
            </span>
            <span className="font-mono text-[11px] text-foreground truncate">
              {targetRequest?.url || 'No active request URL'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              setActiveTab('config');
              setIsOpen(true);
            }}
            className="text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
            title="Configure schedule"
          >
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Runner Action Controls */}
        <div className="flex items-center gap-1.5 pt-0.5">
          {status === 'running' ? (
            <button
              type="button"
              onClick={pauseJob}
              className="flex-1 h-7 rounded-lg bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 border border-amber-500/30 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-all"
            >
              <Pause className="h-3 w-3" />
              <span>Pause</span>
            </button>
          ) : status === 'paused' ? (
            <button
              type="button"
              onClick={resumeJob}
              className="flex-1 h-7 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-all"
            >
              <Play className="h-3 w-3 fill-emerald-400" />
              <span>Resume</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={startJob}
              className="flex-1 h-7 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-1 shadow-xs cursor-pointer transition-all"
            >
              <Play className="h-3 w-3 fill-white" />
              <span>Start</span>
            </button>
          )}

          {(status === 'running' || status === 'paused') && (
            <button
              type="button"
              onClick={() => stopJob('Stopped by user')}
              className="h-7 px-2.5 rounded-lg bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 border border-rose-500/30 text-xs font-semibold flex items-center justify-center cursor-pointer transition-all"
              title="Stop Runner"
            >
              <Square className="h-3 w-3 fill-rose-400" />
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setActiveTab('runner');
              setIsOpen(true);
            }}
            className="h-7 px-2.5 rounded-lg bg-surface-input hover:bg-surface-editor text-muted-foreground hover:text-foreground text-xs font-medium flex items-center justify-center cursor-pointer"
            title="Open Full Monitor & Telemetry"
          >
            <Activity className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Analytics KPI Cards */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            Telemetry & Health
          </span>
          <span className="text-[10px] font-mono text-muted-foreground">
            {stats.totalRuns} requests sent
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* Success Rate Card */}
          <div className="p-2.5 rounded-xl bg-surface-card border border-border/20 space-y-1.5">
            <span className="text-[10px] text-muted-foreground font-medium block">
              Success Rate
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-base font-bold font-mono text-foreground">
                {successRate}%
              </span>
              <span className="text-[10px] font-mono text-emerald-400">
                {stats.successCount} OK
              </span>
            </div>
            {/* Progress Bar */}
            <div className="w-full h-1 rounded-full bg-surface-input overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-300"
                style={{ width: `${successRate}%` }}
              />
            </div>
          </div>

          {/* Latency Card */}
          <div className="p-2.5 rounded-xl bg-surface-card border border-border/20 space-y-1.5">
            <span className="text-[10px] text-muted-foreground font-medium block">
              Avg Latency
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-base font-bold font-mono text-foreground">
                {stats.avgDurationMs} <span className="text-xs font-normal">ms</span>
              </span>
              {stats.errorCount > 0 && (
                <span className="text-[10px] font-mono text-rose-400">
                  {stats.errorCount} Err
                </span>
              )}
            </div>
            <div className="flex items-center justify-between text-[9px] font-mono text-muted-foreground/70">
              <span>Min: {stats.minDurationMs === Infinity ? 0 : stats.minDurationMs}ms</span>
              <span>Max: {stats.maxDurationMs}ms</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Execution Stream Logs Header */}
      <div className="flex items-center justify-between px-1 pt-1">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
              filter === 'all'
                ? 'bg-surface-panel text-foreground font-bold shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            All ({logs.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('success')}
            className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
              filter === 'success'
                ? 'bg-emerald-500/15 text-emerald-400 font-bold shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Success ({stats.successCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('error')}
            className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
              filter === 'error'
                ? 'bg-rose-500/15 text-rose-400 font-bold shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Errors ({stats.errorCount})
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={clearLogs}
            disabled={logs.length === 0}
            className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-surface-card transition-colors cursor-pointer disabled:opacity-30"
            title="Clear logs"
          >
            <RotateCcw className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={handleExportLogs}
            disabled={logs.length === 0}
            className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-surface-card transition-colors cursor-pointer disabled:opacity-30"
            title="Export JSON"
          >
            <Download className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* 4. Stream Log Items List */}
      <div className="flex-1 overflow-y-auto space-y-1.5 min-h-[140px] pr-0.5">
        {filteredLogs.length === 0 ? (
          <div className="h-32 flex flex-col items-center justify-center text-muted-foreground/60 space-y-1">
            <Activity className="h-5 w-5 stroke-1" />
            <span className="text-[11px]">No logs for this filter.</span>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const isExpanded = expandedLogId === log.id;
            const is2xx = log.status >= 200 && log.status < 300;
            const is3xx = log.status >= 300 && log.status < 400;

            const statusColor = is2xx
              ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
              : is3xx
              ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
              : 'text-rose-400 bg-rose-500/10 border-rose-500/20';

            return (
              <div
                key={log.id}
                className="rounded-lg bg-surface-card border border-border/30 overflow-hidden text-xs card-shadow transition-colors"
              >
                <div
                  onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                  className="p-2 flex items-center justify-between gap-1.5 cursor-pointer hover:bg-surface-card-hover"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className={`px-1 py-0.2 rounded text-[9px] font-bold font-mono border shrink-0 ${
                        methodColors[log.method] || 'text-muted-foreground'
                      }`}
                    >
                      {log.method}
                    </span>

                    <span className="font-mono text-[11px] text-foreground truncate max-w-[110px]">
                      {log.url.replace(/^https?:\/\//, '')}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold border ${statusColor}`}
                    >
                      {log.status}
                    </span>

                    <span className="font-mono text-[10px] text-muted-foreground">
                      {log.duration}ms
                    </span>

                    {isExpanded ? (
                      <ChevronDown className="h-3 w-3 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-2.5 bg-surface-editor border-t border-border/30 space-y-2 text-[11px]">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                      <span className="font-mono">{formatBytes(log.responseSize)}</span>
                    </div>

                    <pre className="p-2 rounded bg-surface-input font-mono text-[10px] text-foreground overflow-x-auto max-h-32 whitespace-pre-wrap select-text">
                      {log.responseBody || '(Empty response)'}
                    </pre>

                    <div className="flex items-center gap-1.5 pt-0.5">
                      <button
                        type="button"
                        onClick={() => handleLoadInEditor(log)}
                        className="flex-1 h-6 rounded bg-surface-input hover:bg-surface-panel text-muted-foreground hover:text-foreground text-[10px] font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                      >
                        <ExternalLink className="h-2.5 w-2.5" />
                        <span>Load in Editor</span>
                      </button>

                      {log.isError && (
                        <button
                          type="button"
                          onClick={() => retryLastFailedRun()}
                          className="h-6 px-2.5 rounded bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 border border-rose-500/30 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <RefreshCw className="h-2.5 w-2.5" />
                          <span>Try Again</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
