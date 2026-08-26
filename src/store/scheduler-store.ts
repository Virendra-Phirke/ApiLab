import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import {
  ScheduleJobConfig,
  ScheduleRunLog,
  ScheduleStats,
  ScheduleStatus,
} from '@/types/scheduler';
import { ApiRequest } from '@/types/request';
import { EnvironmentVariable } from '@/types/environment';
import { sendRequest } from '@/lib/http-client';
import { toast } from 'sonner';

interface SchedulerStore {
  isOpen: boolean;
  activeTab: 'config' | 'runner';
  config: ScheduleJobConfig;
  status: ScheduleStatus;
  countdownSeconds: number;
  currentRunIndex: number;
  logs: ScheduleRunLog[];
  stats: ScheduleStats;
  targetRequest: ApiRequest | null;
  targetEnvVariables: EnvironmentVariable[];

  // Actions
  setIsOpen: (isOpen: boolean) => void;
  setActiveTab: (tab: 'config' | 'runner') => void;
  updateConfig: (partial: Partial<ScheduleJobConfig>) => void;
  setTargetRequest: (request: ApiRequest, envVars: EnvironmentVariable[]) => void;
  startJob: () => void;
  pauseJob: () => void;
  resumeJob: () => void;
  stopJob: (reason?: string) => void;
  clearLogs: () => void;
  executeSingleRun: () => Promise<void>;
}

// Timer references outside React component lifecycle
let timerInterval: ReturnType<typeof setInterval> | null = null;
let oneTimeTimeout: ReturnType<typeof setTimeout> | null = null;
let nextTriggerTime: number = 0;

const initialConfig: ScheduleJobConfig = {
  type: 'interval',
  delaySeconds: 10,
  intervalSeconds: 5,
  maxRuns: 10,
  stopOnError: false,
};

const initialStats: ScheduleStats = {
  totalRuns: 0,
  successCount: 0,
  errorCount: 0,
  totalDurationMs: 0,
  avgDurationMs: 0,
  minDurationMs: Infinity,
  maxDurationMs: 0,
};

export const useSchedulerStore = create<SchedulerStore>((set, get) => ({
  isOpen: false,
  activeTab: 'config',
  config: initialConfig,
  status: 'idle',
  countdownSeconds: 0,
  currentRunIndex: 0,
  logs: [],
  stats: initialStats,
  targetRequest: null,
  targetEnvVariables: [],

  setIsOpen: (isOpen) => set({ isOpen }),
  setActiveTab: (activeTab) => set({ activeTab }),
  updateConfig: (partial) =>
    set((state) => ({ config: { ...state.config, ...partial } })),
  setTargetRequest: (request, envVars) =>
    set({ targetRequest: request, targetEnvVariables: envVars }),

  clearLogs: () =>
    set({
      logs: [],
      stats: initialStats,
      currentRunIndex: 0,
    }),

  executeSingleRun: async () => {
    const { targetRequest, targetEnvVariables, config, logs, stats, currentRunIndex } = get();
    if (!targetRequest) return;

    const nextIndex = currentRunIndex + 1;
    set({ currentRunIndex: nextIndex });

    const startTime = Date.now();
    try {
      const response = await sendRequest({
        request: targetRequest,
        environmentVariables: targetEnvVariables,
      });

      const isError = response.status >= 400 || response.status === 0;
      const duration = response.timing?.total ?? (Date.now() - startTime);
      const responseSize = response.size || 0;
      const responseBody =
        typeof response.body === 'string'
          ? response.body
          : JSON.stringify(response.body, null, 2);

      const logEntry: ScheduleRunLog = {
        id: uuidv4(),
        runIndex: nextIndex,
        timestamp: Date.now(),
        method: targetRequest.method,
        url: targetRequest.url,
        status: response.status,
        statusText: response.statusText || (isError ? 'Error' : 'OK'),
        duration,
        responseSize,
        responseBody,
        isError,
      };

      const newTotal = stats.totalRuns + 1;
      const newSuccess = stats.successCount + (isError ? 0 : 1);
      const newError = stats.errorCount + (isError ? 1 : 0);
      const newTotalDuration = stats.totalDurationMs + duration;

      set({
        logs: [logEntry, ...logs],
        stats: {
          totalRuns: newTotal,
          successCount: newSuccess,
          errorCount: newError,
          totalDurationMs: newTotalDuration,
          avgDurationMs: Math.round(newTotalDuration / newTotal),
          minDurationMs: Math.min(stats.minDurationMs, duration),
          maxDurationMs: Math.max(stats.maxDurationMs, duration),
        },
      });

      // Stop on error condition
      if (isError && config.stopOnError) {
        get().stopJob(`Stopped automatically due to HTTP error (${response.status})`);
        return;
      }

      // Check max iterations reached
      if (config.type === 'interval' && config.maxRuns > 0 && nextIndex >= config.maxRuns) {
        get().stopJob(`Completed all ${config.maxRuns} scheduled runs`);
        toast.success(`Completed all ${config.maxRuns} runs!`);
      }
    } catch (err: any) {
      const logEntry: ScheduleRunLog = {
        id: uuidv4(),
        runIndex: nextIndex,
        timestamp: Date.now(),
        method: targetRequest.method,
        url: targetRequest.url,
        status: 500,
        statusText: 'Execution Error',
        duration: Date.now() - startTime,
        responseSize: 0,
        responseBody: err?.message || 'Failed to dispatch request',
        isError: true,
      };

      set({
        logs: [logEntry, ...logs],
        stats: {
          ...stats,
          totalRuns: stats.totalRuns + 1,
          errorCount: stats.errorCount + 1,
        },
      });

      if (config.stopOnError) {
        get().stopJob('Stopped due to connection failure');
      }
    }
  },

  startJob: () => {
    const { config, targetRequest } = get();
    if (!targetRequest || !targetRequest.url) {
      toast.error('Please specify a valid request URL before scheduling.');
      return;
    }

    // Clear previous timers
    if (timerInterval) clearInterval(timerInterval);
    if (oneTimeTimeout) clearTimeout(oneTimeTimeout);

    set({
      status: 'running',
      activeTab: 'runner',
    });

    if (config.type === 'once') {
      const delayMs = config.targetTimestamp
        ? Math.max(0, config.targetTimestamp - Date.now())
        : (config.delaySeconds || 10) * 1000;

      const targetTime = Date.now() + delayMs;
      nextTriggerTime = targetTime;

      set({ countdownSeconds: Math.ceil(delayMs / 1000) });

      // Countdown ticker interval
      timerInterval = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((nextTriggerTime - Date.now()) / 1000));
        set({ countdownSeconds: remaining });
        if (remaining <= 0) {
          if (timerInterval) clearInterval(timerInterval);
        }
      }, 500);

      oneTimeTimeout = setTimeout(async () => {
        await get().executeSingleRun();
        get().stopJob('One-time schedule completed');
        toast.success('Scheduled API request executed!');
      }, delayMs);

      toast.info(`Request scheduled to run in ${Math.ceil(delayMs / 1000)}s`);
    } else {
      // Interval Runner Mode
      const intervalMs = Math.max(1, config.intervalSeconds) * 1000;
      nextTriggerTime = Date.now() + intervalMs;
      set({ countdownSeconds: config.intervalSeconds });

      // Execute first run immediately
      get().executeSingleRun();

      // Countdown ticker & runner loop
      timerInterval = setInterval(() => {
        const current = get();
        if (current.status !== 'running') return;

        const remainingMs = nextTriggerTime - Date.now();
        const remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
        set({ countdownSeconds: remainingSeconds });

        if (remainingMs <= 0) {
          nextTriggerTime = Date.now() + intervalMs;
          set({ countdownSeconds: config.intervalSeconds });
          current.executeSingleRun();
        }
      }, 250);

      toast.info(`Interval runner started (Every ${config.intervalSeconds}s)`);
    }
  },

  pauseJob: () => {
    set({ status: 'paused' });
    toast.info('Runner paused');
  },

  resumeJob: () => {
    const { config } = get();
    const intervalMs = Math.max(1, config.intervalSeconds) * 1000;
    nextTriggerTime = Date.now() + intervalMs;
    set({ status: 'running', countdownSeconds: config.intervalSeconds });
    toast.info('Runner resumed');
  },

  stopJob: (reason) => {
    if (timerInterval) clearInterval(timerInterval);
    if (oneTimeTimeout) clearTimeout(oneTimeTimeout);
    timerInterval = null;
    oneTimeTimeout = null;

    set({ status: 'completed', countdownSeconds: 0 });
    if (reason) {
      toast.info(reason);
    }
  },
}));
