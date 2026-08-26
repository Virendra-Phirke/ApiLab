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
  ArrowLeft,
  RefreshCw,
  Plus,
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Radio,
  Sliders,
  Copy,
  Trash2,
  Sun,
  Globe,
} from 'lucide-react';
import { formatBytes } from '@/lib/formatters';
import { toast } from 'sonner';

export function ScheduleDashboard() {
  const {
    jobs,
    selectedJobId,
    selectJob,
    prepareNewJob,
    prepareEditJob,
    deleteJob,
    duplicateJob,
    startJob,
    pauseJob,
    resumeJob,
    stopJob,
    clearJobLogs,
    retryJobFailedRun,
    executeJobRun,
  } = useSchedulerStore();

  const { setMainView, updateActiveRequest, activeRequest, environments, activeEnvironmentId } = useWorkspaceStore();
  const [filter, setFilter] = useState<'all' | 'success' | 'error'>('all');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const selectedJob = jobs.find((j) => j.id === selectedJobId) || jobs[0];

  const methodColors: Record<string, string> = {
    GET: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    POST: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    PUT: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    PATCH: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    DELETE: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    HEAD: 'bg-teal-500/15 text-teal-400 border-teal-500/30',
    OPTIONS: 'bg-pink-500/15 text-pink-400 border-pink-500/30',
  };

  const logs = selectedJob?.logs || [];
  const stats = selectedJob?.stats || {
    totalRuns: 0,
    successCount: 0,
    errorCount: 0,
    retryCount: 0,
    totalDurationMs: 0,
    avgDurationMs: 0,
    minDurationMs: Infinity,
    maxDurationMs: 0,
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
    if (!selectedJob || logs.length === 0) {
      toast.info('No execution telemetry to export.');
      return;
    }
    const blob = new Blob([JSON.stringify({ job: selectedJob.name, stats, logs }, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `apilab-${selectedJob.name.toLowerCase().replace(/\s+/g, '-')}-logs.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Telemetry exported');
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

  const handleLoadInEditor = (request: typeof selectedJob.request) => {
    updateActiveRequest({
      method: request.method,
      url: request.url,
      headers: request.headers,
      body: request.body,
      queryParams: request.queryParams,
      auth: request.auth,
    });
    setMainView('request');
    toast.success(`Loaded "${request.name || request.url}" into Request Builder`);
  };

  const handleCreateNew = () => {
    const activeEnv = environments.find((e) => e.id === activeEnvironmentId);
    prepareNewJob(activeRequest, activeEnv?.variables || []);
  };

  const isRunning = selectedJob?.status === 'running';
  const isPaused = selectedJob?.status === 'paused';

  return (
    <div className="flex-1 w-full h-full min-h-0 flex flex-col bg-surface-panel rounded-xl card-shadow overflow-hidden select-none">
      {/* 1. Dashboard Top Header Bar */}
      <div className="h-12 px-5 border-b border-border/30 bg-surface-card flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMainView('request')}
            className="h-7.5 px-3 rounded-lg bg-surface-input hover:bg-surface-panel text-muted-foreground hover:text-foreground text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-border/30"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Request Builder</span>
          </button>

          <div className="h-4 w-[1px] bg-border/40" />

          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-xs">
              <Timer className="h-3.5 w-3.5 fill-white" />
            </div>
            <h1 className="text-sm font-bold text-foreground">
              Automation & Scheduler Studio
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCreateNew}
            className="h-7.5 px-3.5 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>+ New Schedule</span>
          </button>

          <button
            type="button"
            onClick={handleExportLogs}
            disabled={logs.length === 0}
            className="h-7.5 px-3 rounded-lg bg-surface-input hover:bg-surface-panel text-muted-foreground hover:text-foreground text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer border border-border/30 disabled:opacity-40"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* 2. Main Dashboard Scroll Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {!selectedJob ? (
          <div className="h-64 rounded-xl border border-border/30 bg-surface-card flex flex-col items-center justify-center text-center p-6 space-y-3">
            <Timer className="h-10 w-10 stroke-1 text-muted-foreground/40" />
            <div>
              <p className="text-sm font-bold text-foreground">No Schedule Selected</p>
              <p className="text-xs text-muted-foreground mt-1">
                Select a schedule from the sidebar, or create a new automated task.
              </p>
            </div>
            <button
              type="button"
              onClick={handleCreateNew}
              className="h-8 px-4 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-all cursor-pointer"
            >
              + Create New Schedule
            </button>
          </div>
        ) : (
          <>
            {/* Dedicated Active Schedule Hero Command Card */}
            <div className="p-4 rounded-xl bg-surface-card border border-border/30 card-shadow space-y-3.5">
              {/* Top Row: Identity, Status, Endpoint */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Status Indicator */}
                  <span
                    className={`h-3 w-3 rounded-full shrink-0 ${
                      isRunning
                        ? 'bg-emerald-400 animate-pulse ring-4 ring-emerald-400/20'
                        : isPaused
                        ? 'bg-amber-400'
                        : 'bg-muted-foreground/40'
                    }`}
                  />

                  {/* Method Pill */}
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-bold font-mono border shrink-0 ${
                      methodColors[selectedJob.request.method] || 'text-muted-foreground'
                    }`}
                  >
                    {selectedJob.request.method}
                  </span>

                  {/* Schedule Name */}
                  <div className="min-w-0">
                    <h2 className="text-base font-bold text-foreground truncate">
                      {selectedJob.name}
                    </h2>
                    <span className="font-mono text-xs text-muted-foreground block truncate max-w-xl">
                      {selectedJob.request.url}
                    </span>
                  </div>
                </div>

                {/* Right: Frequency & Live Countdown */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground font-mono shrink-0">
                  <div className="flex items-center gap-1.5 text-foreground bg-surface-input px-3 py-1.5 rounded-lg border border-border/20">
                    {selectedJob.config.type === 'daily' ? (
                      <Sun className="h-4 w-4 text-amber-400" />
                    ) : (
                      <Clock className="h-4 w-4 text-primary" />
                    )}
                    <span className="font-semibold">
                      {selectedJob.config.type === 'daily'
                        ? `Daily @ ${selectedJob.config.dailyTime || '09:00'}`
                        : selectedJob.config.type === 'interval'
                        ? `Every ${selectedJob.config.intervalValue} ${selectedJob.config.intervalUnit}`
                        : 'One-time run'}
                    </span>
                  </div>

                  {isRunning && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold">
                      <Radio className="h-3.5 w-3.5 animate-pulse" />
                      <span>Next in: {formatCountdown(selectedJob.countdownSeconds)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Action Bar for Selected Schedule */}
              <div className="pt-2 border-t border-border/20 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {isRunning ? (
                    <button
                      type="button"
                      onClick={() => pauseJob(selectedJob.id)}
                      className="h-8 px-3.5 rounded-lg bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      <Pause className="h-3.5 w-3.5" />
                      <span>Pause Schedule</span>
                    </button>
                  ) : isPaused ? (
                    <button
                      type="button"
                      onClick={() => resumeJob(selectedJob.id)}
                      className="h-8 px-3.5 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      <Play className="h-3.5 w-3.5 fill-emerald-400" />
                      <span>Resume Schedule</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => startJob(selectedJob.id)}
                      className="h-8 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                    >
                      <Play className="h-3.5 w-3.5 fill-white" />
                      <span>Start Runner</span>
                    </button>
                  )}

                  {(isRunning || isPaused) && (
                    <button
                      type="button"
                      onClick={() => stopJob(selectedJob.id, 'Stopped by user')}
                      className="h-8 px-3 rounded-lg bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      <Square className="h-3.5 w-3.5 fill-rose-400" />
                      <span>Stop</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => executeJobRun(selectedJob.id, 0)}
                    className="h-8 px-3 rounded-lg bg-surface-input hover:bg-surface-panel text-foreground text-xs font-medium border border-border/30 flex items-center gap-1.5 cursor-pointer transition-colors"
                    title="Execute request immediately once"
                  >
                    <RefreshCw className="h-3.5 w-3.5 text-primary" />
                    <span>Run Now</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => prepareEditJob(selectedJob.id)}
                    className="h-8 px-3 rounded-lg bg-surface-input hover:bg-surface-panel text-muted-foreground hover:text-foreground text-xs font-medium border border-border/30 flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Sliders className="h-3.5 w-3.5" />
                    <span>Edit Config</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => duplicateJob(selectedJob.id)}
                    className="h-8 px-2.5 rounded-lg bg-surface-input hover:bg-surface-panel text-muted-foreground hover:text-foreground text-xs border border-border/30 flex items-center cursor-pointer transition-colors"
                    title="Duplicate Schedule"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleLoadInEditor(selectedJob.request)}
                    className="h-8 px-3 rounded-lg bg-surface-input hover:bg-surface-panel text-muted-foreground hover:text-foreground text-xs font-medium border border-border/30 flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Load in Editor</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteJob(selectedJob.id)}
                    className="h-8 px-2.5 rounded-lg bg-surface-input hover:bg-rose-500/15 text-muted-foreground hover:text-rose-400 text-xs border border-border/30 flex items-center cursor-pointer transition-colors"
                    title="Delete Schedule"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Selected Schedule Telemetry KPIs */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Telemetry & Health Metrics
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  {stats.totalRuns} requests dispatched
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Total Runs */}
                <div className="p-3.5 rounded-xl bg-surface-card border border-border/30 card-shadow space-y-1">
                  <span className="text-xs text-muted-foreground font-medium block">
                    Total Runs
                  </span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-bold font-mono text-foreground">
                      {stats.totalRuns}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground">
                      {selectedJob.config.maxRuns > 0 ? `Max ${selectedJob.config.maxRuns}` : 'Continuous'}
                    </span>
                  </div>
                </div>

                {/* Success Rate */}
                <div className="p-3.5 rounded-xl bg-surface-card border border-border/30 card-shadow space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                    <span>Success Rate</span>
                    <span className="text-emerald-400 font-mono font-bold">
                      {stats.successCount} OK
                    </span>
                  </div>
                  <div className="text-2xl font-bold font-mono text-emerald-400">
                    {successRate}%
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-surface-input overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-300"
                      style={{ width: `${successRate}%` }}
                    />
                  </div>
                </div>

                {/* Errors & Retries */}
                <div className="p-3.5 rounded-xl bg-surface-card border border-border/30 card-shadow space-y-1">
                  <span className="text-xs text-muted-foreground font-medium block">
                    Errors & Retries
                  </span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-bold font-mono text-rose-400">
                      {stats.errorCount}
                    </span>
                    {stats.retryCount > 0 && (
                      <span className="text-xs font-mono text-amber-400">
                        {stats.retryCount} retried
                      </span>
                    )}
                  </div>
                </div>

                {/* Latency */}
                <div className="p-3.5 rounded-xl bg-surface-card border border-border/30 card-shadow space-y-1">
                  <span className="text-xs text-muted-foreground font-medium block">
                    Average Latency
                  </span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-bold font-mono text-foreground">
                      {stats.avgDurationMs}{' '}
                      <span className="text-xs font-normal text-muted-foreground">ms</span>
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      Min: {stats.minDurationMs === Infinity ? 0 : stats.minDurationMs}ms / Max: {stats.maxDurationMs}ms
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Execution Stream Telemetry Logs for Selected Job */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Live Response Stream ({logs.length})
                  </span>

                  <div className="flex items-center p-0.5 rounded-lg bg-surface-input gap-1 ml-2">
                    <button
                      type="button"
                      onClick={() => setFilter('all')}
                      className={`px-2.5 py-0.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
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
                      className={`px-2.5 py-0.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
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
                      className={`px-2.5 py-0.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                        filter === 'error'
                          ? 'bg-rose-500/15 text-rose-400 font-bold shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Errors ({stats.errorCount})
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => clearJobLogs(selectedJob.id)}
                  disabled={logs.length === 0}
                  className="h-7 px-2.5 rounded-lg bg-surface-input hover:bg-surface-panel text-muted-foreground hover:text-foreground text-xs font-medium flex items-center gap-1.5 border border-border/30 cursor-pointer disabled:opacity-40"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Clear Logs</span>
                </button>
              </div>

              {/* Stream Logs List */}
              <div className="space-y-2">
                {filteredLogs.length === 0 ? (
                  <div className="h-36 rounded-xl bg-surface-card border border-border/30 flex flex-col items-center justify-center text-muted-foreground space-y-1.5">
                    <Activity className="h-6 w-6 stroke-1 text-muted-foreground/50" />
                    <span className="text-xs font-medium">No execution logs for this filter.</span>
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
                        className="rounded-xl bg-surface-card border border-border/30 overflow-hidden card-shadow text-xs"
                      >
                        <div
                          onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                          className="p-3 flex items-center justify-between gap-4 cursor-pointer hover:bg-surface-card-hover transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="font-mono text-[11px] text-muted-foreground font-bold shrink-0">
                              #{log.runIndex}
                            </span>

                            {log.retryAttempt && log.retryAttempt > 0 ? (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold font-mono bg-amber-500/15 text-amber-400 border border-amber-500/30 shrink-0">
                                Retry #{log.retryAttempt}
                              </span>
                            ) : null}

                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border shrink-0 ${
                                methodColors[log.method] || 'text-muted-foreground'
                              }`}
                            >
                              {log.method}
                            </span>

                            <span className="font-mono text-xs text-foreground truncate max-w-md">
                              {log.url}
                            </span>
                          </div>

                          <div className="flex items-center gap-4 shrink-0">
                            <span
                              className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold border ${statusColor}`}
                            >
                              {log.status} {log.statusText}
                            </span>

                            <span className="font-mono text-xs text-muted-foreground">
                              {log.duration} ms
                            </span>

                            <span className="font-mono text-[11px] text-muted-foreground/60 hidden sm:inline">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </span>

                            <div className="flex items-center gap-1">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Expandable Response Snippet */}
                        {isExpanded && (
                          <div className="p-4 bg-surface-editor border-t border-border/30 space-y-2 text-xs">
                            <div className="flex items-center justify-between text-muted-foreground">
                              <span>
                                Response Payload ({formatBytes(log.responseSize)}):
                              </span>
                              <div className="flex items-center gap-3">
                                {log.isError && (
                                  <button
                                    type="button"
                                    onClick={() => retryJobFailedRun(selectedJob.id)}
                                    className="px-2.5 py-1 rounded bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                                  >
                                    <RefreshCw className="h-3 w-3" />
                                    <span>Try Again</span>
                                  </button>
                                )}
                                <span className="font-mono text-[11px]">
                                  {new Date(log.timestamp).toISOString()}
                                </span>
                              </div>
                            </div>
                            <pre className="p-3 rounded-lg bg-surface-input font-mono text-xs text-foreground overflow-x-auto max-h-56 whitespace-pre-wrap select-text">
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
          </>
        )}
      </div>
    </div>
  );
}
