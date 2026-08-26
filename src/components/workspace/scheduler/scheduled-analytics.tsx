'use client';

import React from 'react';
import { useSchedulerStore } from '@/store/scheduler-store';
import { useWorkspaceStore } from '@/store/workspace-store';
import {
  Timer,
  Play,
  Pause,
  Plus,
  ArrowUpRight,
  ArrowLeft,
  Sun,
  Calendar,
  Layers,
  Activity,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';

export function ScheduledAnalytics() {
  const {
    jobs,
    selectedJobId,
    selectJob,
    prepareNewJob,
    startJob,
    pauseJob,
    resumeJob,
  } = useSchedulerStore();

  const { setMainView, activeRequest, environments, activeEnvironmentId } = useWorkspaceStore();

  const methodColors: Record<string, string> = {
    GET: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    POST: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    PUT: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    PATCH: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    DELETE: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    HEAD: 'bg-teal-500/15 text-teal-400 border-teal-500/30',
    OPTIONS: 'bg-pink-500/15 text-pink-400 border-pink-500/30',
  };

  const formatCountdown = (totalSec: number) => {
    if (totalSec < 60) return `${totalSec}s`;
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m ${seconds}s`;
  };

  const handleCreateNew = () => {
    const activeEnv = environments.find((e) => e.id === activeEnvironmentId);
    prepareNewJob(activeRequest, activeEnv?.variables || []);
  };

  const handleRowClick = (jobId: string) => {
    selectJob(jobId);
    setMainView('schedules');
  };

  const runningCount = jobs.filter((j) => j.status === 'running').length;

  return (
    <div className="flex flex-col h-full space-y-2 pb-2 select-none">
      {/* 1. Header Toolbar */}
      <div className="flex items-center justify-between px-1 pt-1 pb-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            Schedules ({jobs.length})
          </span>
          {runningCount > 0 && (
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleCreateNew}
            className="h-6 px-2 rounded-md bg-primary hover:bg-primary/90 text-white text-[10px] font-semibold flex items-center gap-1 shadow-xs cursor-pointer transition-all"
            title="Create New Scheduled Job"
          >
            <Plus className="h-3 w-3" />
            <span>New</span>
          </button>

          <button
            type="button"
            onClick={() => setMainView('request')}
            className="h-6 px-2 rounded-md bg-surface-input hover:bg-surface-panel text-muted-foreground hover:text-foreground text-[10px] font-medium flex items-center gap-1 border border-border/30 cursor-pointer transition-colors"
            title="Open Request Builder on the right"
          >
            <ArrowLeft className="h-3 w-3 text-primary" />
            <span>Studio</span>
          </button>
        </div>
      </div>

      {/* 2. Row-Wise Scheduled Jobs List */}
      <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5 min-h-0">
        {jobs.length === 0 ? (
          <div className="h-44 flex flex-col items-center justify-center text-muted-foreground/60 space-y-2 text-center p-3">
            <Timer className="h-7 w-7 stroke-1 text-muted-foreground/40" />
            <span className="text-xs font-medium">No scheduled requests yet.</span>
            <button
              type="button"
              onClick={handleCreateNew}
              className="text-xs text-primary font-semibold hover:underline cursor-pointer"
            >
              + Create your first schedule
            </button>
          </div>
        ) : (
          jobs.map((job) => {
            const isSelected = selectedJobId === job.id;
            const isRunning = job.status === 'running';
            const isPaused = job.status === 'paused';

            return (
              <div
                key={job.id}
                onClick={() => handleRowClick(job.id)}
                className={`group relative p-2.5 rounded-xl border transition-all cursor-pointer card-shadow flex flex-col gap-1.5 ${
                  isSelected
                    ? 'bg-surface-card border-primary/40 ring-1 ring-primary/20'
                    : 'bg-surface-card hover:bg-surface-card-hover border-border/30'
                }`}
              >
                {/* Top Row: Method, Name & Quick Action */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {/* Status Dot */}
                    <span
                      className={`h-2 w-2 rounded-full shrink-0 ${
                        isRunning
                          ? 'bg-emerald-400 animate-pulse'
                          : isPaused
                          ? 'bg-amber-400'
                          : 'bg-muted-foreground/40'
                      }`}
                    />

                    {/* Method Badge */}
                    <span
                      className={`px-1.5 py-0.2 rounded text-[9px] font-bold font-mono border shrink-0 ${
                        methodColors[job.request.method] || 'text-muted-foreground'
                      }`}
                    >
                      {job.request.method}
                    </span>

                    {/* Schedule Name */}
                    <span className="font-bold text-xs text-foreground truncate">
                      {job.name}
                    </span>
                  </div>

                  {/* Inline Quick Play / Pause Toggle */}
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 shrink-0"
                  >
                    {isRunning ? (
                      <button
                        type="button"
                        onClick={() => pauseJob(job.id)}
                        className="h-5.5 w-5.5 rounded flex items-center justify-center bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 border border-amber-500/30 cursor-pointer"
                        title="Pause"
                      >
                        <Pause className="h-2.5 w-2.5" />
                      </button>
                    ) : isPaused ? (
                      <button
                        type="button"
                        onClick={() => resumeJob(job.id)}
                        className="h-5.5 w-5.5 rounded flex items-center justify-center bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30 cursor-pointer"
                        title="Resume"
                      >
                        <Play className="h-2.5 w-2.5 fill-emerald-400" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startJob(job.id)}
                        className="h-5.5 w-5.5 rounded flex items-center justify-center bg-surface-input hover:bg-surface-editor text-muted-foreground hover:text-foreground border border-border/30 cursor-pointer"
                        title="Start Schedule"
                      >
                        <Play className="h-2.5 w-2.5 fill-current" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Bottom Row: Frequency, Countdown & URL snippet */}
                <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                  <span className="truncate max-w-[130px]">
                    {job.config.type === 'daily'
                      ? `Daily @ ${job.config.dailyTime || '09:00'}`
                      : job.config.type === 'interval'
                      ? `Every ${job.config.intervalValue} ${job.config.intervalUnit}`
                      : 'One-time run'}
                  </span>

                  {isRunning ? (
                    <span className="text-emerald-400 font-bold shrink-0">
                      ⏱ {formatCountdown(job.countdownSeconds)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground/60 shrink-0">
                      {job.stats.totalRuns} runs
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 3. Bottom Studio Trigger Banner */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => setMainView('request')}
          className="w-full h-8 px-2.5 rounded-lg bg-surface-card hover:bg-surface-card-hover border border-border/30 text-foreground text-xs font-semibold flex items-center justify-between transition-colors card-shadow cursor-pointer"
          title="Open API Request Studio / Builder on the right"
        >
          <div className="flex items-center gap-1.5 text-primary">
            <Zap className="h-3.5 w-3.5" />
            <span>Open Request Studio</span>
          </div>
          <ArrowLeft className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
