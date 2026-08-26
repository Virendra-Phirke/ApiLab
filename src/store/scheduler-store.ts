import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import {
  ScheduleJobConfig,
  ScheduleRunLog,
  ScheduleStats,
  ScheduleStatus,
  TimeUnit,
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
  isRetrying: boolean;
  lastFailedLog: ScheduleRunLog | null;

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
  executeSingleRun: (retryAttempt?: number) => Promise<boolean>;
  retryLastFailedRun: () => Promise<void>;
}

// Timer references outside React component lifecycle
let timerInterval: ReturnType<typeof setInterval> | null = null;
let oneTimeTimeout: ReturnType<typeof setTimeout> | null = null;
let retryTimeout: ReturnType<typeof setTimeout> | null = null;
let nextTriggerTime: number = 0;

export function convertToSeconds(value: number, unit: TimeUnit): number {
  const v = Math.max(1, value);
  switch (unit) {
    case 'minutes':
      return v * 60;
    case 'hours':
      return v * 3600;
    case 'seconds':
    default:
      return v;
  }
}

export function getMsUntilDailyTime(timeStr: string = '09:00'): number {
  const [hours, minutes] = timeStr.split(':').map((num) => parseInt(num, 10) || 0);
  const now = new Date();
  const target = new Date();
  target.setHours(hours, minutes, 0, 0);

  if (target.getTime() <= now.getTime()) {
    // Already passed today, schedule for tomorrow
    target.setDate(target.getDate() + 1);
  }

  return target.getTime() - now.getTime();
}

const initialConfig: ScheduleJobConfig = {
  type: 'interval',
  delaySeconds: 10,
  intervalValue: 5,
  intervalUnit: 'minutes',
  intervalSeconds: 300,
  dailyTime: '09:00',
  maxRuns: 10,
  stopOnError: false,
  autoRetry: true,
  maxRetries: 3,
  retryDelaySeconds: 5,
};

const initialStats: ScheduleStats = {
  totalRuns: 0,
  successCount: 0,
  errorCount: 0,
  retryCount: 0,
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
  isRetrying: false,
  lastFailedLog: null,

  setIsOpen: (isOpen) => set({ isOpen }),
  setActiveTab: (activeTab) => set({ activeTab }),
  updateConfig: (partial) =>
    set((state) => {
      const merged = { ...state.config, ...partial };
      if (partial.intervalValue !== undefined || partial.intervalUnit !== undefined) {
        merged.intervalSeconds = convertToSeconds(merged.intervalValue, merged.intervalUnit);
      }
      return { config: merged };
    }),
  setTargetRequest: (request, envVars) =>
    set({ targetRequest: request, targetEnvVariables: envVars }),

  clearLogs: () =>
    set({
      logs: [],
      stats: initialStats,
      currentRunIndex: 0,
      lastFailedLog: null,
    }),

  executeSingleRun: async (retryAttempt: number = 0): Promise<boolean> => {
    const { targetRequest, targetEnvVariables, config, logs, stats, currentRunIndex } = get();
    if (!targetRequest) return false;

    const nextIndex = retryAttempt > 0 ? currentRunIndex : currentRunIndex + 1;
    if (retryAttempt === 0) {
      set({ currentRunIndex: nextIndex });
    }

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
        retryAttempt,
      };

      const newTotal = stats.totalRuns + 1;
      const newSuccess = stats.successCount + (isError ? 0 : 1);
      const newError = stats.errorCount + (isError ? 1 : 0);
      const newRetry = stats.retryCount + (retryAttempt > 0 ? 1 : 0);
      const newTotalDuration = stats.totalDurationMs + duration;

      set({
        logs: [logEntry, ...logs],
        lastFailedLog: isError ? logEntry : null,
        stats: {
          totalRuns: newTotal,
          successCount: newSuccess,
          errorCount: newError,
          retryCount: newRetry,
          totalDurationMs: newTotalDuration,
          avgDurationMs: Math.round(newTotalDuration / newTotal),
          minDurationMs: Math.min(stats.minDurationMs, duration),
          maxDurationMs: Math.max(stats.maxDurationMs, duration),
        },
      });

      if (isError) {
        // Auto-retry logic
        if (config.autoRetry && retryAttempt < config.maxRetries) {
          const nextAttempt = retryAttempt + 1;
          set({ isRetrying: true });
          toast.warning(
            `Request failed (${response.status}). Retrying attempt ${nextAttempt}/${config.maxRetries} in ${config.retryDelaySeconds}s...`,
            {
              action: {
                label: 'Retry Now',
                onClick: () => get().executeSingleRun(nextAttempt),
              },
            }
          );

          if (retryTimeout) clearTimeout(retryTimeout);
          retryTimeout = setTimeout(async () => {
            set({ isRetrying: false });
            await get().executeSingleRun(nextAttempt);
          }, config.retryDelaySeconds * 1000);
          return false;
        } else {
          // Exhausted or no auto-retry: prompt user
          toast.error(
            `Request failed with HTTP ${response.status}.`,
            {
              action: {
                label: 'Try Again',
                onClick: () => get().retryLastFailedRun(),
              },
            }
          );

          if (config.stopOnError) {
            get().stopJob(`Stopped automatically due to HTTP error (${response.status})`);
            return false;
          }
        }
      }

      // Check max iterations reached for interval runs
      if (config.type === 'interval' && config.maxRuns > 0 && nextIndex >= config.maxRuns) {
        get().stopJob(`Completed all ${config.maxRuns} scheduled runs`);
        toast.success(`Completed all ${config.maxRuns} runs!`);
      }

      return !isError;
    } catch (err: any) {
      const logEntry: ScheduleRunLog = {
        id: uuidv4(),
        runIndex: nextIndex,
        timestamp: Date.now(),
        method: targetRequest.method,
        url: targetRequest.url,
        status: 500,
        statusText: 'Network Error',
        duration: Date.now() - startTime,
        responseSize: 0,
        responseBody: err?.message || 'Connection failure',
        isError: true,
        retryAttempt,
      };

      set({
        logs: [logEntry, ...logs],
        lastFailedLog: logEntry,
        stats: {
          ...stats,
          totalRuns: stats.totalRuns + 1,
          errorCount: stats.errorCount + 1,
          retryCount: stats.retryCount + (retryAttempt > 0 ? 1 : 0),
        },
      });

      if (config.autoRetry && retryAttempt < config.maxRetries) {
        const nextAttempt = retryAttempt + 1;
        set({ isRetrying: true });
        toast.warning(
          `Connection error. Retrying attempt ${nextAttempt}/${config.maxRetries} in ${config.retryDelaySeconds}s...`,
          {
            action: {
              label: 'Retry Now',
              onClick: () => get().executeSingleRun(nextAttempt),
            },
          }
        );

        if (retryTimeout) clearTimeout(retryTimeout);
        retryTimeout = setTimeout(async () => {
          set({ isRetrying: false });
          await get().executeSingleRun(nextAttempt);
        }, config.retryDelaySeconds * 1000);
      } else {
        toast.error('Request failed due to network error.', {
          action: {
            label: 'Try Again',
            onClick: () => get().retryLastFailedRun(),
          },
        });

        if (config.stopOnError) {
          get().stopJob('Stopped due to connection failure');
        }
      }
      return false;
    }
  },

  retryLastFailedRun: async () => {
    toast.info('Retrying request now...');
    await get().executeSingleRun(1);
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
    if (retryTimeout) clearTimeout(retryTimeout);

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

      timerInterval = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((nextTriggerTime - Date.now()) / 1000));
        set({ countdownSeconds: remaining });
        if (remaining <= 0) {
          if (timerInterval) clearInterval(timerInterval);
        }
      }, 500);

      oneTimeTimeout = setTimeout(async () => {
        await get().executeSingleRun(0);
        get().stopJob('One-time schedule completed');
        toast.success('Scheduled API request executed!');
      }, delayMs);

      toast.info(`Request scheduled to run in ${Math.ceil(delayMs / 1000)}s`);
    } else if (config.type === 'daily') {
      // Daily Schedule
      const timeStr = config.dailyTime || '09:00';
      const delayMs = getMsUntilDailyTime(timeStr);
      nextTriggerTime = Date.now() + delayMs;
      set({ countdownSeconds: Math.ceil(delayMs / 1000) });

      timerInterval = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((nextTriggerTime - Date.now()) / 1000));
        set({ countdownSeconds: remaining });
      }, 1000);

      const scheduleNextDay = () => {
        const nextDelay = getMsUntilDailyTime(timeStr);
        nextTriggerTime = Date.now() + nextDelay;
        set({ countdownSeconds: Math.ceil(nextDelay / 1000) });
        oneTimeTimeout = setTimeout(async () => {
          await get().executeSingleRun(0);
          scheduleNextDay();
        }, nextDelay);
      };

      oneTimeTimeout = setTimeout(async () => {
        await get().executeSingleRun(0);
        scheduleNextDay();
      }, delayMs);

      toast.info(`Daily schedule active. Next trigger at ${timeStr} (in ${Math.round(delayMs / 60000)} min)`);
    } else {
      // Interval Runner Mode (supports 1 min up to 15+ hours)
      const intervalSec = convertToSeconds(config.intervalValue, config.intervalUnit);
      const intervalMs = intervalSec * 1000;
      nextTriggerTime = Date.now() + intervalMs;
      set({ countdownSeconds: intervalSec });

      // Run initial execution immediately
      get().executeSingleRun(0);

      timerInterval = setInterval(() => {
        const current = get();
        if (current.status !== 'running') return;

        const remainingMs = nextTriggerTime - Date.now();
        const remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
        set({ countdownSeconds: remainingSeconds });

        if (remainingMs <= 0) {
          nextTriggerTime = Date.now() + intervalMs;
          set({ countdownSeconds: intervalSec });
          current.executeSingleRun(0);
        }
      }, 500);

      toast.info(`Interval runner started (Every ${config.intervalValue} ${config.intervalUnit})`);
    }
  },

  pauseJob: () => {
    set({ status: 'paused' });
    toast.info('Runner paused');
  },

  resumeJob: () => {
    const { config } = get();
    const intervalSec = convertToSeconds(config.intervalValue, config.intervalUnit);
    const intervalMs = intervalSec * 1000;
    nextTriggerTime = Date.now() + intervalMs;
    set({ status: 'running', countdownSeconds: intervalSec });
    toast.info('Runner resumed');
  },

  stopJob: (reason) => {
    if (timerInterval) clearInterval(timerInterval);
    if (oneTimeTimeout) clearTimeout(oneTimeTimeout);
    if (retryTimeout) clearTimeout(retryTimeout);
    timerInterval = null;
    oneTimeTimeout = null;
    retryTimeout = null;

    set({ status: 'completed', countdownSeconds: 0, isRetrying: false });
    if (reason) {
      toast.info(reason);
    }
  },
}));
