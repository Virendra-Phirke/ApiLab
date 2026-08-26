'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useSchedulerStore } from '@/store/scheduler-store';
import { useWorkspaceStore } from '@/store/workspace-store';
import {
  Clock,
  Play,
  Pause,
  Square,
  RotateCcw,
  Download,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Timer,
  Calendar,
  Layers,
  ChevronRight,
  ChevronDown,
  Activity,
  Zap,
} from 'lucide-react';
import { formatBytes, formatDuration } from '@/lib/formatters';
import { toast } from 'sonner';

const ONE_TIME_PRESETS = [
  { label: 'In 5s', seconds: 5 },
  { label: 'In 10s', seconds: 10 },
  { label: 'In 30s', seconds: 30 },
  { label: 'In 1m', seconds: 60 },
  { label: 'In 5m', seconds: 300 },
  { label: 'In 15m', seconds: 900 },
  { label: 'In 1h', seconds: 3600 },
];

const INTERVAL_PRESETS = [
  { label: 'Every 1s', seconds: 1 },
  { label: 'Every 2s', seconds: 2 },
  { label: 'Every 5s', seconds: 5 },
  { label: 'Every 10s', seconds: 10 },
  { label: 'Every 30s', seconds: 30 },
  { label: 'Every 1m', seconds: 60 },
  { label: 'Every 5m', seconds: 300 },
];

const MAX_RUN_OPTIONS = [
  { label: 'Unlimited (until stopped)', value: 0 },
  { label: '5 runs', value: 5 },
  { label: '10 runs', value: 10 },
  { label: '25 runs', value: 25 },
  { label: '50 runs', value: 50 },
  { label: '100 runs', value: 100 },
];

export function SchedulerModal() {
  const {
    isOpen,
    setIsOpen,
    activeTab,
    setActiveTab,
    config,
    updateConfig,
    status,
    countdownSeconds,
    logs,
    stats,
    targetRequest,
    targetEnvVariables,
    startJob,
    pauseJob,
    resumeJob,
    stopJob,
    clearLogs,
  } = useSchedulerStore();

  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [customDateTime, setCustomDateTime] = useState('');

  const methodColors: Record<string, string> = {
    GET: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    POST: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    PUT: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    PATCH: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    DELETE: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    HEAD: 'bg-teal-500/15 text-teal-400 border-teal-500/30',
    OPTIONS: 'bg-pink-500/15 text-pink-400 border-pink-500/30',
  };

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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-2xl bg-surface-panel text-foreground border-border/40 p-0 overflow-hidden card-shadow max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-surface-card p-4 border-b border-border/20 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Timer className="h-4 w-4 fill-white" />
            </div>
            <div>
              <DialogTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <span>API Request Scheduler & Auto-Runner</span>
                {status === 'running' && (
                  <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 animate-pulse">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Running (Next: {countdownSeconds}s)
                  </span>
                )}
                {status === 'paused' && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    Paused
                  </span>
                )}
              </DialogTitle>
              <p className="text-[11px] text-muted-foreground mt-0.5 truncate max-w-md">
                Target:{' '}
                <span className="font-mono text-foreground font-semibold">
                  {targetRequest?.method} {targetRequest?.url || 'No URL configured'}
                </span>
              </p>
            </div>
          </div>

          {/* Top Tabs */}
          <div className="flex items-center p-0.5 rounded-lg bg-surface-input gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('config')}
              className={`h-7 px-3 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'config'
                  ? 'bg-surface-panel text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Clock className="h-3 w-3" />
              <span>Configure</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('runner')}
              className={`h-7 px-3 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'runner'
                  ? 'bg-surface-panel text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Activity className="h-3 w-3" />
              <span>Live Monitor ({logs.length})</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Configuration */}
        {activeTab === 'config' && (
          <div className="p-5 space-y-5 overflow-y-auto flex-1">
            {/* Mode Select */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Execution Mode
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => updateConfig({ type: 'interval' })}
                  className={`p-3.5 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                    config.type === 'interval'
                      ? 'border-primary bg-primary/10 text-foreground card-shadow'
                      : 'border-border/30 bg-surface-card hover:bg-surface-card-hover text-muted-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-xs text-foreground">
                    <Timer className="h-4 w-4 text-primary" />
                    <span>Recurring Time Gap / Interval</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    Repeatedly send request every N seconds/minutes with limits.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => updateConfig({ type: 'once' })}
                  className={`p-3.5 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                    config.type === 'once'
                      ? 'border-primary bg-primary/10 text-foreground card-shadow'
                      : 'border-border/30 bg-surface-card hover:bg-surface-card-hover text-muted-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-xs text-foreground">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span>One-Time Scheduled Time</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    Trigger request once at a specific date/time or after a delay.
                  </span>
                </button>
              </div>
            </div>

            {/* Mode Parameters */}
            {config.type === 'interval' ? (
              /* Interval Mode Settings */
              <div className="space-y-4 p-4 rounded-xl bg-surface-card border border-border/20">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                    <span>Time Gap Between Requests</span>
                    <span className="font-mono text-primary font-bold">
                      Every {config.intervalSeconds}s
                    </span>
                  </label>

                  <div className="flex flex-wrap gap-1.5">
                    {INTERVAL_PRESETS.map((p) => (
                      <button
                        key={p.seconds}
                        type="button"
                        onClick={() => updateConfig({ intervalSeconds: p.seconds })}
                        className={`h-7 px-2.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                          config.intervalSeconds === p.seconds
                            ? 'bg-primary text-white shadow-xs font-bold'
                            : 'bg-surface-input text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-xs text-muted-foreground">Custom seconds:</span>
                    <input
                      type="number"
                      min={1}
                      max={3600}
                      value={config.intervalSeconds}
                      onChange={(e) =>
                        updateConfig({
                          intervalSeconds: Math.max(1, parseInt(e.target.value, 10) || 1),
                        })
                      }
                      className="w-20 h-7 px-2 rounded-md bg-surface-input text-foreground text-xs font-mono outline-none border border-border/30"
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-border/20">
                  <label className="text-xs font-semibold text-foreground">
                    Maximum Number of Runs
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {MAX_RUN_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => updateConfig({ maxRuns: opt.value })}
                        className={`h-7 px-2.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                          config.maxRuns === opt.value
                            ? 'bg-primary text-white shadow-xs font-bold'
                            : 'bg-surface-input text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-border/20 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-foreground">Stop on First Error</span>
                    <p className="text-[11px] text-muted-foreground">
                      Automatically halt execution if server returns a 4xx or 5xx status code.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.stopOnError}
                    onChange={(e) => updateConfig({ stopOnError: e.target.checked })}
                    className="h-4 w-4 accent-blue-600 rounded cursor-pointer"
                  />
                </div>
              </div>
            ) : (
              /* One-Time Schedule Settings */
              <div className="space-y-4 p-4 rounded-xl bg-surface-card border border-border/20">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground">
                    Quick Delay Presets
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {ONE_TIME_PRESETS.map((p) => (
                      <button
                        key={p.seconds}
                        type="button"
                        onClick={() =>
                          updateConfig({
                            delaySeconds: p.seconds,
                            targetTimestamp: undefined,
                          })
                        }
                        className={`h-7 px-2.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                          config.delaySeconds === p.seconds && !config.targetTimestamp
                            ? 'bg-primary text-white shadow-xs font-bold'
                            : 'bg-surface-input text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-border/20">
                  <label className="text-xs font-semibold text-foreground">
                    Or Pick Exact Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={customDateTime}
                    onChange={(e) => {
                      setCustomDateTime(e.target.value);
                      const targetTs = new Date(e.target.value).getTime();
                      if (!isNaN(targetTs)) {
                        updateConfig({ targetTimestamp: targetTs });
                      }
                    }}
                    className="w-full h-8.5 px-3 rounded-lg bg-surface-input text-foreground text-xs font-mono outline-none border border-border/30"
                  />
                </div>
              </div>
            )}

            {/* Launch Action */}
            <div className="pt-2 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Executes via secure SSRF-safe client proxy.
              </span>

              <button
                type="button"
                onClick={() => {
                  startJob();
                  setActiveTab('runner');
                }}
                disabled={status === 'running'}
                className="h-9 px-6 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                <Play className="h-3.5 w-3.5 fill-white" />
                <span>
                  {config.type === 'interval'
                    ? `Start Runner (Every ${config.intervalSeconds}s)`
                    : 'Schedule Execution'}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Live Runner & Logs */}
        {activeTab === 'runner' && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Metric Summary Cards */}
            <div className="grid grid-cols-4 gap-2 p-4 pb-3 border-b border-border/20 bg-surface-card/60 shrink-0">
              <div className="p-2.5 rounded-lg bg-surface-panel border border-border/20">
                <span className="text-[10px] text-muted-foreground font-semibold block uppercase">
                  Total Runs
                </span>
                <span className="text-base font-bold font-mono text-foreground mt-0.5 block">
                  {stats.totalRuns}
                  {config.type === 'interval' && config.maxRuns > 0 && (
                    <span className="text-xs text-muted-foreground font-normal">
                      {' '}
                      / {config.maxRuns}
                    </span>
                  )}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-surface-panel border border-border/20">
                <span className="text-[10px] text-emerald-400 font-semibold block uppercase">
                  Success (2xx)
                </span>
                <span className="text-base font-bold font-mono text-emerald-400 mt-0.5 block">
                  {stats.successCount}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-surface-panel border border-border/20">
                <span className="text-[10px] text-rose-400 font-semibold block uppercase">
                  Errors
                </span>
                <span className="text-base font-bold font-mono text-rose-400 mt-0.5 block">
                  {stats.errorCount}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-surface-panel border border-border/20">
                <span className="text-[10px] text-muted-foreground font-semibold block uppercase">
                  Avg Latency
                </span>
                <span className="text-base font-bold font-mono text-foreground mt-0.5 block">
                  {stats.avgDurationMs} ms
                </span>
              </div>
            </div>

            {/* Runner Control Action Bar */}
            <div className="px-4 py-2 bg-surface-card border-b border-border/20 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                {status === 'running' ? (
                  <button
                    type="button"
                    onClick={pauseJob}
                    className="h-7 px-2.5 rounded-md bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Pause className="h-3 w-3" />
                    <span>Pause</span>
                  </button>
                ) : status === 'paused' ? (
                  <button
                    type="button"
                    onClick={resumeJob}
                    className="h-7 px-2.5 rounded-md bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Play className="h-3 w-3 fill-emerald-400" />
                    <span>Resume</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={startJob}
                    className="h-7 px-2.5 rounded-md bg-blue-600 text-white hover:bg-blue-500 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Play className="h-3 w-3 fill-white" />
                    <span>Start</span>
                  </button>
                )}

                {(status === 'running' || status === 'paused') && (
                  <button
                    type="button"
                    onClick={() => stopJob('Stopped by user')}
                    className="h-7 px-2.5 rounded-md bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Square className="h-3 w-3 fill-rose-400" />
                    <span>Stop</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={clearLogs}
                  disabled={logs.length === 0}
                  className="h-7 px-2.5 rounded-md bg-surface-input hover:bg-surface-editor text-muted-foreground hover:text-foreground text-xs font-medium flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                  title="Clear execution log stream"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Clear</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportLogs}
                  disabled={logs.length === 0}
                  className="h-7 px-2.5 rounded-md bg-surface-input hover:bg-surface-editor text-muted-foreground hover:text-foreground text-xs font-medium flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                  title="Export execution stream as JSON"
                >
                  <Download className="h-3 w-3" />
                  <span>Export</span>
                </button>
              </div>
            </div>

            {/* Log Stream List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {logs.length === 0 ? (
                <div className="h-44 flex flex-col items-center justify-center text-muted-foreground/60 space-y-2">
                  <Activity className="h-7 w-7 stroke-1" />
                  <span className="text-xs">No scheduled requests executed yet.</span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('config')}
                    className="text-xs text-primary font-semibold hover:underline"
                  >
                    Configure and start a runner
                  </button>
                </div>
              ) : (
                logs.map((log) => {
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
                      className="rounded-lg bg-surface-card border border-border/30 overflow-hidden text-xs card-shadow"
                    >
                      <div
                        onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                        className="p-2.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-surface-card-hover transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono text-[10px] text-muted-foreground font-bold">
                            #{log.runIndex}
                          </span>

                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono border ${
                              methodColors[log.method] || 'text-muted-foreground'
                            }`}
                          >
                            {log.method}
                          </span>

                          <span className="font-mono text-xs text-foreground truncate max-w-xs">
                            {log.url}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span
                            className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold border ${statusColor}`}
                          >
                            {log.status} {log.statusText}
                          </span>

                          <span className="font-mono text-[11px] text-muted-foreground">
                            {log.duration} ms
                          </span>

                          <span className="font-mono text-[10px] text-muted-foreground/60 hidden sm:inline">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>

                          {isExpanded ? (
                            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                        </div>
                      </div>

                      {/* Expanded Payload Preview */}
                      {isExpanded && (
                        <div className="p-3 bg-surface-editor border-t border-border/30 space-y-2">
                          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                            <span>Response Body ({formatBytes(log.responseSize)}):</span>
                            <span className="font-mono text-[10px]">
                              {new Date(log.timestamp).toISOString()}
                            </span>
                          </div>
                          <pre className="p-2.5 rounded-md bg-surface-input font-mono text-[11px] text-foreground overflow-x-auto max-h-48 whitespace-pre-wrap select-text">
                            {log.responseBody || '(Empty response)'}
                          </pre>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
