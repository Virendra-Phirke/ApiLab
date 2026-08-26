'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { useSchedulerStore } from '@/store/scheduler-store';
import { useWorkspaceStore } from '@/store/workspace-store';
import { useSession } from '@/lib/auth-client';
import { AuthModal } from '@/components/auth/auth-modal';
import { TimeUnit } from '@/types/scheduler';
import { HttpMethod } from '@/types/request';
import { MethodSelector } from '../request/method-selector';
import {
  Clock,
  Play,
  Timer,
  Calendar,
  Sun,
  ShieldAlert,
  Save,
  Tag,
  Globe,
  Lock,
} from 'lucide-react';
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
    formName,
    setFormName,
    formConfig,
    updateFormConfig,
    targetRequest,
    updateTargetRequest,
    editingJobId,
    saveJob,
    startJob,
    fetchSchedulesFromDb,
  } = useSchedulerStore();

  const { setMainView } = useWorkspaceStore();
  const { data: session } = useSession();
  const [customDateTime, setCustomDateTime] = useState('');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'save' | 'start' | null>(null);

  const currentMethod = (targetRequest?.method || 'GET') as HttpMethod;
  const currentUrl = targetRequest?.url || '';

  const executeSave = (action: 'save' | 'start') => {
    const newId = saveJob();
    if (newId) {
      if (action === 'start') {
        startJob(newId);
      }
      setMainView('schedules');
    }
  };

  const handleSaveAndStart = () => {
    if (!session?.user) {
      setPendingAction('start');
      setAuthModalOpen(true);
      toast.info('Please sign in to save schedules to your database.');
      return;
    }
    executeSave('start');
  };

  const handleSaveOnly = () => {
    if (!session?.user) {
      setPendingAction('save');
      setAuthModalOpen(true);
      toast.info('Please sign in to save schedules to your database.');
      return;
    }
    executeSave('save');
  };

  const handleAuthSuccess = () => {
    setAuthModalOpen(false);
    fetchSchedulesFromDb();
    if (pendingAction) {
      executeSave(pendingAction);
      setPendingAction(null);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-xl bg-surface-panel text-foreground border-border/40 p-0 overflow-hidden card-shadow max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="bg-surface-card p-4 border-b border-border/20 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <Timer className="h-4 w-4 fill-white" />
              </div>
              <div>
                <DialogTitle className="text-sm font-bold text-foreground">
                  {editingJobId ? 'Edit Scheduled Request' : 'Configure New Scheduled Request'}
                </DialogTitle>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Set up automated API calls with customizable method, endpoint, and intervals.
                </p>
              </div>
            </div>
          </div>

          {/* Configuration Form Body */}
          <div className="p-5 space-y-4 overflow-y-auto flex-1">
            {/* 1. Schedule Job Name Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-primary" />
                <span>Schedule Job Name</span>
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Weather Forecast Ingestion or Auth Health Check"
                className="w-full h-8.5 px-3 rounded-lg bg-surface-input text-foreground text-xs font-medium placeholder:text-muted-foreground/50 outline-none border border-border/30 focus:border-primary transition-colors"
                autoFocus
              />
            </div>

            {/* 2. Target API Endpoint: Method Selector + API URL Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-primary" />
                <span>Target API Method & Endpoint URL</span>
              </label>

              <div className="flex items-center gap-2 p-1.5 rounded-xl bg-surface-card border border-border/30">
                {/* Method Selector Dropdown */}
                <MethodSelector
                  value={currentMethod}
                  onChange={(method) => updateTargetRequest({ method })}
                />

                {/* URL Input Bar */}
                <input
                  type="text"
                  value={currentUrl}
                  onChange={(e) => updateTargetRequest({ url: e.target.value })}
                  placeholder="Enter API URL (e.g. https://api.open-meteo.com/v1/forecast or https://api.example.com)"
                  className="w-full h-9 px-3 rounded-lg bg-surface-input text-foreground text-xs font-mono placeholder:text-muted-foreground/40 outline-none border border-border/20 focus:border-primary/50 transition-colors"
                  spellCheck={false}
                />
              </div>
            </div>

            {/* 3. Execution Frequency Mode Select (3 Options: Interval 1m-15h, Daily, One-Time) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Execution Frequency
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {/* 1. Interval */}
                <button
                  type="button"
                  onClick={() => updateFormConfig({ type: 'interval' })}
                  className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                    formConfig.type === 'interval'
                      ? 'border-primary bg-primary/10 text-foreground card-shadow'
                      : 'border-border/30 bg-surface-card hover:bg-surface-card-hover text-muted-foreground'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs text-foreground">
                    <Timer className="h-3.5 w-3.5 text-primary" />
                    <span>Interval Gap</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    1 min to 15 hours.
                  </span>
                </button>

                {/* 2. Daily */}
                <button
                  type="button"
                  onClick={() => updateFormConfig({ type: 'daily' })}
                  className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                    formConfig.type === 'daily'
                      ? 'border-primary bg-primary/10 text-foreground card-shadow'
                      : 'border-border/30 bg-surface-card hover:bg-surface-card-hover text-muted-foreground'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs text-foreground">
                    <Sun className="h-3.5 w-3.5 text-amber-400" />
                    <span>Daily Schedule</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    Every day at fixed time.
                  </span>
                </button>

                {/* 3. One-Time */}
                <button
                  type="button"
                  onClick={() => updateFormConfig({ type: 'once' })}
                  className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                    formConfig.type === 'once'
                      ? 'border-primary bg-primary/10 text-foreground card-shadow'
                      : 'border-border/30 bg-surface-card hover:bg-surface-card-hover text-muted-foreground'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs text-foreground">
                    <Calendar className="h-3.5 w-3.5 text-blue-400" />
                    <span>One-Time Run</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    Specific date/time.
                  </span>
                </button>
              </div>
            </div>

            {/* Mode Parameters */}
            {formConfig.type === 'interval' && (
              /* Interval Mode Settings */
              <div className="space-y-3.5 p-4 rounded-xl bg-surface-card border border-border/20">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                    <span>Select Time Interval (1 min to 15 hours)</span>
                    <span className="font-mono text-primary font-bold">
                      Every {formConfig.intervalValue} {formConfig.intervalUnit}
                    </span>
                  </label>

                  {/* Presets Grid */}
                  <div className="grid grid-cols-5 gap-1.5">
                    {INTERVAL_PRESETS.map((p) => (
                      <button
                        key={`${p.value}-${p.unit}`}
                        type="button"
                        onClick={() =>
                          updateFormConfig({ intervalValue: p.value, intervalUnit: p.unit })
                        }
                        className={`h-7 px-1.5 rounded-md text-xs font-medium transition-all text-center cursor-pointer ${
                          formConfig.intervalValue === p.value && formConfig.intervalUnit === p.unit
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
                      value={formConfig.intervalValue}
                      onChange={(e) =>
                        updateFormConfig({
                          intervalValue: Math.max(1, parseInt(e.target.value, 10) || 1),
                        })
                      }
                      className="w-20 h-7 px-2 rounded-md bg-surface-input text-foreground text-xs font-mono outline-none border border-border/30"
                    />
                    <select
                      value={formConfig.intervalUnit}
                      onChange={(e) =>
                        updateFormConfig({ intervalUnit: e.target.value as TimeUnit })
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
                        onClick={() => updateFormConfig({ maxRuns: opt.value })}
                        className={`h-7 px-2.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                          formConfig.maxRuns === opt.value
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

            {formConfig.type === 'daily' && (
              /* Daily Schedule Mode */
              <div className="space-y-3.5 p-4 rounded-xl bg-surface-card border border-border/20">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                    <span>Daily Execution Time</span>
                    <span className="font-mono text-amber-400 font-bold">
                      Every day at {formConfig.dailyTime || '09:00'}
                    </span>
                  </label>
                  <p className="text-[11px] text-muted-foreground">
                    The request will trigger automatically each day at this selected time.
                  </p>

                  <input
                    type="time"
                    value={formConfig.dailyTime || '09:00'}
                    onChange={(e) => updateFormConfig({ dailyTime: e.target.value })}
                    className="w-48 h-8.5 px-3 rounded-lg bg-surface-input text-foreground text-xs font-mono outline-none border border-border/30 cursor-pointer"
                  />
                </div>
              </div>
            )}

            {formConfig.type === 'once' && (
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
                          updateFormConfig({
                            delaySeconds: p.seconds,
                            targetTimestamp: undefined,
                          })
                        }
                        className={`h-7 px-2.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                          formConfig.delaySeconds === p.seconds && !formConfig.targetTimestamp
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
                        updateFormConfig({ targetTimestamp: targetTs });
                      }
                    }}
                    className="w-full h-8.5 px-3 rounded-lg bg-surface-input text-foreground text-xs font-mono outline-none border border-border/30"
                  />
                </div>
              </div>
            )}

            {/* 4. Error Recovery & Retry Strategy Box */}
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
                  checked={formConfig.autoRetry}
                  onChange={(e) => updateFormConfig({ autoRetry: e.target.checked })}
                  className="h-4 w-4 accent-blue-600 rounded cursor-pointer"
                />
              </div>

              {formConfig.autoRetry && (
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/20">
                  <div className="space-y-1">
                    <span className="text-[11px] text-muted-foreground">Max Retry Attempts:</span>
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 5].map((count) => (
                        <button
                          key={count}
                          type="button"
                          onClick={() => updateFormConfig({ maxRetries: count })}
                          className={`h-6.5 px-2.5 rounded text-xs font-medium transition-all cursor-pointer ${
                            formConfig.maxRetries === count
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
                          onClick={() => updateFormConfig({ retryDelaySeconds: sec })}
                          className={`h-6.5 px-2.5 rounded text-xs font-medium transition-all cursor-pointer ${
                            formConfig.retryDelaySeconds === sec
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

            {/* Action Footer */}
            <div className="pt-2 flex items-center justify-between gap-2">
              {!session?.user ? (
                <span className="text-[11px] text-amber-400 flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  <span>Sign in required to save in DB</span>
                </span>
              ) : (
                <span className="text-[11px] text-muted-foreground">
                  Saved to account: <strong className="text-foreground">{session.user.name || session.user.email}</strong>
                </span>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveOnly}
                  className="h-9 px-4 rounded-lg bg-surface-card hover:bg-surface-card-hover border border-border/30 text-foreground text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Save className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Save Schedule</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveAndStart}
                  className="h-9 px-5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Play className="h-3.5 w-3.5 fill-white" />
                  <span>Save & Start Runner</span>
                </button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Auth Modal Triggered if user is not logged in */}
      <AuthModal
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
        title="Sign In to Save Schedules"
        description="Sign in or create an account with email & password to persist API schedules to the cloud database."
        onSuccess={handleAuthSuccess}
      />
    </>
  );
}
