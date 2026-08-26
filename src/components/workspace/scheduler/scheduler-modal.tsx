'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { useSchedulerStore } from '@/store/scheduler-store';
import { TimeUnit } from '@/types/scheduler';
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
  Sun,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';
import { formatBytes, formatDuration } from '@/lib/formatters';
import { toast } from 'sonner';

const INTERVAL_PRESETS: { label: string; value: number; unit: TimeUnit }[] = [
  { label: '1 min', value: 1, unit: 'minutes' },
  { label: '5 min', value: 5, unit: 'minutes' },
  { label: '15 min', value: 15, unit: 'minutes' },
  { label: '30 min', value: 30, unit: 'minutes' },
  { label: '1 hour', value: 1, unit: 'hours' },
  { label: '2 hours', value: 2, unit: 'hours' },
  { label: '6 hours', value: 6, unit: 'hours' },
  { label: '12 hours', value: 12, unit: 'hours' },
  { label: '15 hours', value: 15, unit: 'hours' },
];

const ONE_TIME_PRESETS = [
  { label: 'In 10s', seconds: 10 },
  { label: 'In 1m', seconds: 60 },
  { label: 'In 5m', seconds: 300 },
  { label: 'In 15m', seconds: 900 },
  { label: 'In 1h', seconds: 3600 },
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
    isRetrying,
    lastFailedLog,
    startJob,
    pauseJob,
    resumeJob,
    stopJob,
    clearLogs,
    retryLastFailedRun,
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

  // Human-readable countdown string (e.g. "02h 15m 30s")
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
                <span>API Scheduler & Interval Auto-Runner</span>
                {status === 'running' && (
                  <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 animate-pulse">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Next in: {formatCountdown(countdownSeconds)}
                  </span>
                )}
                {isRetrying && (
                  <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 animate-pulse">
                    <RefreshCw className="h-2.5 w-2.5 animate-spin" />
                    Auto-Retrying...
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
          <div className="p-5 space-y-4 overflow-y-auto flex-1">
            {/* Mode Select (3 Options: Interval 1m-15h, Daily, One-Time) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Execution Frequency
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {/* 1. Interval */}
                <button
                  type="button"
                  onClick={() => updateConfig({ type: 'interval' })}
                  className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                    config.type === 'interval'
                      ? 'border-primary bg-primary/10 text-foreground card-shadow'
                      : 'border-border/30 bg-surface-card hover:bg-surface-card-hover text-muted-foreground'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs text-foreground">
                    <Timer className="h-3.5 w-3.5 text-primary" />
                    <span>Interval Gap</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    From 1 min up to 15 hours.
                  </span>
                </button>

                {/* 2. Daily */}
                <button
                  type="button"
                  onClick={() => updateConfig({ type: 'daily' })}
                  className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                    config.type === 'daily'
                      ? 'border-primary bg-primary/10 text-foreground card-shadow'
                      : 'border-border/30 bg-surface-card hover:bg-surface-card-hover text-muted-foreground'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs text-foreground">
                    <Sun className="h-3.5 w-3.5 text-amber-400" />
                    <span>Daily Schedule</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    Trigger once every day at fixed time.
                  </span>
                </button>

                {/* 3. One-Time */}
                <button
                  type="button"
                  onClick={() => updateConfig({ type: 'once' })}
                  className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                    config.type === 'once'
                      ? 'border-primary bg-primary/10 text-foreground card-shadow'
                      : 'border-border/30 bg-surface-card hover:bg-surface-card-hover text-muted-foreground'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs text-foreground">
                    <Calendar className="h-3.5 w-3.5 text-blue-400" />
                    <span>One-Time Run</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    Specific date/time or delay.
                  </span>
                </button>
              </div>
            </div>

            {/* Mode Parameters */}
            {config.type === 'interval' && (
              /* Interval Mode Settings */
              <div className="space-y-3.5 p-4 rounded-xl bg-surface-card border border-border/20">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                    <span>Select Time Interval (1 min to 15 hours)</span>
                    <span className="font-mono text-primary font-bold">
                      Every {config.intervalValue} {config.intervalUnit}
                    </span>
                  </label>

                  {/* Presets Grid */}
                  <div className="grid grid-cols-5 gap-1.5">
                    {INTERVAL_PRESETS.map((p) => (
                      <button
                        key={`${p.value}-${p.unit}`}
                        type="button"
                        onClick={() =>
                          updateConfig({ intervalValue: p.value, intervalUnit: p.unit })
                        }
                        className={`h-7 px-1.5 rounded-md text-xs font-medium transition-all text-center cursor-pointer ${
                          config.intervalValue === p.value && config.intervalUnit === p.unit
                            ? 'bg-primary text-white shadow-xs font-bold'
                            : 'bg-surface-input text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  {/* Custom Unit Builder */}
                  <div className="flex items-center gap-2 pt-1.5">
                    <span className="text-xs text-muted-foreground">Custom Gap:</span>
                    <input
                      type="number"
                      min={1}
                      max={3600}
                      value={config.intervalValue}
                      onChange={(e) =>
                        updateConfig({
                          intervalValue: Math.max(1, parseInt(e.target.value, 10) || 1),
                        })
                      }
                      className="w-20 h-7 px-2 rounded-md bg-surface-input text-foreground text-xs font-mono outline-none border border-border/30"
                    />
                    <select
                      value={config.intervalUnit}
                      onChange={(e) =>
                        updateConfig({ intervalUnit: e.target.value as TimeUnit })
                      }
                      className="h-7 px-2.5 rounded-md bg-surface-input text-foreground text-xs font-medium outline-none border border-border/30 cursor-pointer"
                    >
                      <option value="minutes">Minutes</option>
                      <option value="hours">Hours</option>
                      <option value="seconds">Seconds</option>
                    </select>
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
              </div>
            )}

            {config.type === 'daily' && (
              /* Daily Schedule Mode */
              <div className="space-y-3.5 p-4 rounded-xl bg-surface-card border border-border/20">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                    <span>Daily Execution Time</span>
                    <span className="font-mono text-amber-400 font-bold">
                      Every day at {config.dailyTime || '09:00'}
                    </span>
                  </label>
                  <p className="text-[11px] text-muted-foreground">
                    The request will trigger automatically each day at this selected time.
                  </p>

                  <input
                    type="time"
                    value={config.dailyTime || '09:00'}
                    onChange={(e) => updateConfig({ dailyTime: e.target.value })}
                    className="w-48 h-8.5 px-3 rounded-lg bg-surface-input text-foreground text-xs font-mono outline-none border border-border/30 cursor-pointer"
                  />
                </div>
              </div>
            )}

            {config.type === 'once' && (
              /* One-Time Schedule Settings */
              <div className="space-y-3.5 p-4 rounded-xl bg-surface-card border border-border/20">
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

            {/* Error Recovery & Retry Strategy Box */}
            <div className="p-4 rounded-xl bg-surface-card border border-border/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-primary" />
                  <div>
                    <span className="text-xs font-bold text-foreground">Error Recovery & Retry</span>
                    <p className="text-[10px] text-muted-foreground">
                      Automatically retry or prompt for try-again attempt on HTTP errors.
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={config.autoRetry}
                  onChange={(e) => updateConfig({ autoRetry: e.target.checked })}
                  className="h-4 w-4 accent-blue-600 rounded cursor-pointer"
                />
              </div>

              {config.autoRetry && (
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/20">
                  <div className="space-y-1">
                    <span className="text-[11px] text-muted-foreground">Max Retry Attempts:</span>
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 5].map((count) => (
                        <button
                          key={count}
                          type="button"
                          onClick={() => updateConfig({ maxRetries: count })}
                          className={`h-6.5 px-2.5 rounded text-xs font-medium transition-all cursor-pointer ${
                            config.maxRetries === count
                              ? 'bg-primary text-white font-bold'
                              : 'bg-surface-input text-muted-foreground'
                          }`}
                        >
                          {count}x
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] text-muted-foreground">Retry Delay:</span>
                    <div className="flex gap-1.5">
                      {[2, 5, 10, 30].map((sec) => (
                        <button
                          key={sec}
                          type="button"
                          onClick={() => updateConfig({ retryDelaySeconds: sec })}
                          className={`h-6.5 px-2.5 rounded text-xs font-medium transition-all cursor-pointer ${
                            config.retryDelaySeconds === sec
                              ? 'bg-primary text-white font-bold'
                              : 'bg-surface-input text-muted-foreground'
                          }`}
                        >
                          {sec}s
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Launch Action */}
            <div className="pt-2 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Executes in background with live metrics & error recovery.
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
                  {config.type === 'daily'
                    ? `Start Daily (${config.dailyTime || '09:00'})`
                    : config.type === 'interval'
                    ? `Start Runner (${config.intervalValue} ${config.intervalUnit})`
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
                  Errors / Retries
                </span>
                <span className="text-base font-bold font-mono text-rose-400 mt-0.5 block">
                  {stats.errorCount}
                  {stats.retryCount > 0 && (
                    <span className="text-xs text-amber-400 font-normal">
                      {' '}
                      ({stats.retryCount} retried)
                    </span>
                  )}
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

            {/* Error Retry Alert Banner */}
            {lastFailedLog && (
              <div className="mx-4 mt-3 p-3 rounded-lg bg-rose-500/10 border border-rose-500/25 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2 text-xs text-rose-400">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>
                    Last request returned <strong>{lastFailedLog.status} {lastFailedLog.statusText}</strong>.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={retryLastFailedRun}
                  className="h-7 px-3 rounded-md bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>Try Again</span>
                </button>
              </div>
            )}

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

                          {log.retryAttempt && log.retryAttempt > 0 ? (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold font-mono bg-amber-500/15 text-amber-400 border border-amber-500/30">
                              Retry #{log.retryAttempt}
                            </span>
                          ) : null}

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
                            <div className="flex items-center gap-2">
                              {log.isError && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    retryLastFailedRun();
                                  }}
                                  className="px-2 py-0.5 rounded bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 border border-rose-500/30 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                                >
                                  <RefreshCw className="h-2.5 w-2.5" />
                                  <span>Try Again</span>
                                </button>
                              )}
                              <span className="font-mono text-[10px]">
                                {new Date(log.timestamp).toISOString()}
                              </span>
                            </div>
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
