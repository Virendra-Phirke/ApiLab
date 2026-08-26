import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import {
  ScheduleJob,
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
  jobs: ScheduleJob[];
  selectedJobId: string | null;
  editingJobId: string | null;

  // Form State for modal
  formName: string;
  formConfig: ScheduleJobConfig;
  targetRequest: ApiRequest | null;
  targetEnvVariables: EnvironmentVariable[];

  // Actions
  setIsOpen: (isOpen: boolean) => void;
  setActiveTab: (tab: 'config' | 'runner') => void;
  selectJob: (id: string) => void;
  setFormName: (name: string) => void;
  updateFormConfig: (partial: Partial<ScheduleJobConfig>) => void;
  prepareNewJob: (request: ApiRequest, envVars: EnvironmentVariable[]) => void;
  prepareEditJob: (id: string) => void;
  saveJob: () => string;
  deleteJob: (id: string) => void;
  duplicateJob: (id: string) => void;

  startJob: (id: string) => void;
  pauseJob: (id: string) => void;
  resumeJob: (id: string) => void;
  stopJob: (id: string, reason?: string) => void;
  clearJobLogs: (id: string) => void;
  executeJobRun: (id: string, retryAttempt?: number) => Promise<boolean>;
  retryJobFailedRun: (id: string) => Promise<void>;
}

// Timer maps keyed by Job ID
const jobIntervals: Map<string, ReturnType<typeof setInterval>> = new Map();
const jobTimeouts: Map<string, ReturnType<typeof setTimeout>> = new Map();
const jobRetryTimeouts: Map<string, ReturnType<typeof setTimeout>> = new Map();
const jobNextTriggers: Map<string, number> = new Map();

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
    target.setDate(target.getDate() + 1);
  }

  return target.getTime() - now.getTime();
}

const defaultInitialConfig: ScheduleJobConfig = {
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

const createEmptyStats = (): ScheduleStats => ({
  totalRuns: 0,
  successCount: 0,
  errorCount: 0,
  retryCount: 0,
  totalDurationMs: 0,
  avgDurationMs: 0,
  minDurationMs: Infinity,
  maxDurationMs: 0,
});

// Seed an initial demo job if needed
const initialJobs: ScheduleJob[] = [
  {
    id: 'demo-job-1',
    name: 'Weather API Ingestion',
    request: {
      id: 'req-weather',
      name: 'OpenMeteo Weather Forecast',
      method: 'GET',
      url: 'https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&current_weather=true',
      headers: [],
      queryParams: [
        { id: '1', key: 'latitude', value: '52.52', enabled: true },
        { id: '2', key: 'longitude', value: '13.41', enabled: true },
        { id: '3', key: 'current_weather', value: 'true', enabled: true },
      ],
      body: { type: 'none', content: '' },
      auth: { type: 'none' },
      tests: [],
      createdAt: Date.now() - 3600000,
      updatedAt: Date.now(),
    },
    environmentVariables: [],
    config: {
      type: 'interval',
      intervalValue: 5,
      intervalUnit: 'minutes',
      intervalSeconds: 300,
      maxRuns: 50,
      stopOnError: false,
      autoRetry: true,
      maxRetries: 3,
      retryDelaySeconds: 5,
    },
    status: 'idle',
    countdownSeconds: 300,
    currentRunIndex: 0,
    stats: createEmptyStats(),
    logs: [],
    createdAt: Date.now() - 3600000,
    updatedAt: Date.now(),
  },
];

export const useSchedulerStore = create<SchedulerStore>((set, get) => ({
  isOpen: false,
  activeTab: 'config',
  jobs: initialJobs,
  selectedJobId: 'demo-job-1',
  editingJobId: null,

  formName: 'My Scheduled Request',
  formConfig: defaultInitialConfig,
  targetRequest: null,
  targetEnvVariables: [],

  setIsOpen: (isOpen) => set({ isOpen }),
  setActiveTab: (activeTab) => set({ activeTab }),

  selectJob: (id) => set({ selectedJobId: id }),

  setFormName: (name) => set({ formName: name }),

  updateFormConfig: (partial) =>
    set((state) => {
      const merged = { ...state.formConfig, ...partial };
      if (partial.intervalValue !== undefined || partial.intervalUnit !== undefined) {
        merged.intervalSeconds = convertToSeconds(merged.intervalValue, merged.intervalUnit);
      }
      return { formConfig: merged };
    }),

  prepareNewJob: (request, envVars) => {
    const generatedName = request.name || `${request.method} ${request.url ? new URL(request.url).pathname : 'Request'}`;
    set({
      editingJobId: null,
      formName: generatedName,
      formConfig: defaultInitialConfig,
      targetRequest: request,
      targetEnvVariables: envVars,
      activeTab: 'config',
      isOpen: true,
    });
  },

  prepareEditJob: (id) => {
    const job = get().jobs.find((j) => j.id === id);
    if (!job) return;

    set({
      editingJobId: id,
      formName: job.name,
      formConfig: job.config,
      targetRequest: job.request,
      targetEnvVariables: job.environmentVariables,
      activeTab: 'config',
      isOpen: true,
    });
  },

  saveJob: () => {
    const { editingJobId, formName, formConfig, targetRequest, targetEnvVariables, jobs } = get();
    if (!targetRequest) {
      toast.error('No request specified.');
      return '';
    }

    if (editingJobId) {
      // Update existing job
      const updatedJobs = jobs.map((j) => {
        if (j.id === editingJobId) {
          return {
            ...j,
            name: formName.trim() || j.name,
            config: formConfig,
            request: targetRequest,
            environmentVariables: targetEnvVariables,
            updatedAt: Date.now(),
          };
        }
        return j;
      });

      set({ jobs: updatedJobs, isOpen: false });
      toast.success(`Schedule "${formName}" updated`);
      return editingJobId;
    } else {
      // Create new job
      const newId = uuidv4();
      const newJob: ScheduleJob = {
        id: newId,
        name: formName.trim() || `${targetRequest.method} ${targetRequest.url}`,
        request: targetRequest,
        environmentVariables: targetEnvVariables,
        config: formConfig,
        status: 'idle',
        countdownSeconds: formConfig.intervalSeconds,
        currentRunIndex: 0,
        stats: createEmptyStats(),
        logs: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      set({
        jobs: [newJob, ...jobs],
        selectedJobId: newId,
        isOpen: false,
      });

      toast.success(`Schedule "${newJob.name}" created!`);
      return newId;
    }
  },

  deleteJob: (id) => {
    get().stopJob(id);
    const updated = get().jobs.filter((j) => j.id !== id);
    set({
      jobs: updated,
      selectedJobId: updated.length > 0 ? updated[0].id : null,
    });
    toast.info('Schedule removed');
  },

  duplicateJob: (id) => {
    const job = get().jobs.find((j) => j.id === id);
    if (!job) return;

    const newJob: ScheduleJob = {
      ...job,
      id: uuidv4(),
      name: `${job.name} (Copy)`,
      status: 'idle',
      countdownSeconds: job.config.intervalSeconds,
      currentRunIndex: 0,
      stats: createEmptyStats(),
      logs: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    set({
      jobs: [newJob, ...get().jobs],
      selectedJobId: newJob.id,
    });
    toast.success(`Duplicated schedule as "${newJob.name}"`);
  },

  clearJobLogs: (id) => {
    const updated = get().jobs.map((j) => {
      if (j.id === id) {
        return {
          ...j,
          logs: [],
          stats: createEmptyStats(),
          currentRunIndex: 0,
        };
      }
      return j;
    });
    set({ jobs: updated });
    toast.info('Execution logs cleared');
  },

  executeJobRun: async (id: string, retryAttempt: number = 0): Promise<boolean> => {
    const job = get().jobs.find((j) => j.id === id);
    if (!job || !job.request) return false;

    const nextIndex = retryAttempt > 0 ? job.currentRunIndex : job.currentRunIndex + 1;
    const startTime = Date.now();

    try {
      const response = await sendRequest({
        request: job.request,
        environmentVariables: job.environmentVariables,
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
        method: job.request.method,
        url: job.request.url,
        status: response.status,
        statusText: response.statusText || (isError ? 'Error' : 'OK'),
        duration,
        responseSize,
        responseBody,
        isError,
        retryAttempt,
      };

      const newTotal = job.stats.totalRuns + 1;
      const newSuccess = job.stats.successCount + (isError ? 0 : 1);
      const newError = job.stats.errorCount + (isError ? 1 : 0);
      const newRetry = job.stats.retryCount + (retryAttempt > 0 ? 1 : 0);
      const newTotalDuration = job.stats.totalDurationMs + duration;

      const updatedJobs = get().jobs.map((j) => {
        if (j.id === id) {
          return {
            ...j,
            currentRunIndex: nextIndex,
            logs: [logEntry, ...j.logs],
            stats: {
              totalRuns: newTotal,
              successCount: newSuccess,
              errorCount: newError,
              retryCount: newRetry,
              totalDurationMs: newTotalDuration,
              avgDurationMs: Math.round(newTotalDuration / newTotal),
              minDurationMs: Math.min(j.stats.minDurationMs, duration),
              maxDurationMs: Math.max(j.stats.maxDurationMs, duration),
            },
          };
        }
        return j;
      });

      set({ jobs: updatedJobs });

      if (isError) {
        if (job.config.autoRetry && retryAttempt < job.config.maxRetries) {
          const nextAttempt = retryAttempt + 1;
          toast.warning(
            `"${job.name}" failed (${response.status}). Retrying attempt ${nextAttempt}/${job.config.maxRetries} in ${job.config.retryDelaySeconds}s...`,
            {
              action: {
                label: 'Retry Now',
                onClick: () => get().executeJobRun(id, nextAttempt),
              },
            }
          );

          if (jobRetryTimeouts.has(id)) clearTimeout(jobRetryTimeouts.get(id));
          const t = setTimeout(async () => {
            await get().executeJobRun(id, nextAttempt);
          }, job.config.retryDelaySeconds * 1000);
          jobRetryTimeouts.set(id, t);
          return false;
        } else {
          toast.error(`"${job.name}" returned HTTP ${response.status}.`, {
            action: {
              label: 'Try Again',
              onClick: () => get().retryJobFailedRun(id),
            },
          });

          if (job.config.stopOnError) {
            get().stopJob(id, `Stopped due to error (${response.status})`);
            return false;
          }
        }
      }

      if (job.config.type === 'interval' && job.config.maxRuns > 0 && nextIndex >= job.config.maxRuns) {
        get().stopJob(id, `Completed all ${job.config.maxRuns} scheduled runs`);
        toast.success(`"${job.name}" finished ${job.config.maxRuns} runs!`);
      }

      return !isError;
    } catch (err: any) {
      const logEntry: ScheduleRunLog = {
        id: uuidv4(),
        runIndex: nextIndex,
        timestamp: Date.now(),
        method: job.request.method,
        url: job.request.url,
        status: 500,
        statusText: 'Network Failure',
        duration: Date.now() - startTime,
        responseSize: 0,
        responseBody: err?.message || 'Connection failure',
        isError: true,
        retryAttempt,
      };

      const updatedJobs = get().jobs.map((j) => {
        if (j.id === id) {
          return {
            ...j,
            currentRunIndex: nextIndex,
            logs: [logEntry, ...j.logs],
            stats: {
              ...j.stats,
              totalRuns: j.stats.totalRuns + 1,
              errorCount: j.stats.errorCount + 1,
              retryCount: j.stats.retryCount + (retryAttempt > 0 ? 1 : 0),
            },
          };
        }
        return j;
      });

      set({ jobs: updatedJobs });

      if (job.config.autoRetry && retryAttempt < job.config.maxRetries) {
        const nextAttempt = retryAttempt + 1;
        toast.warning(
          `Connection failure on "${job.name}". Retrying in ${job.config.retryDelaySeconds}s...`,
          {
            action: {
              label: 'Retry Now',
              onClick: () => get().executeJobRun(id, nextAttempt),
            },
          }
        );

        if (jobRetryTimeouts.has(id)) clearTimeout(jobRetryTimeouts.get(id));
        const t = setTimeout(async () => {
          await get().executeJobRun(id, nextAttempt);
        }, job.config.retryDelaySeconds * 1000);
        jobRetryTimeouts.set(id, t);
      } else {
        toast.error(`"${job.name}" connection failed.`, {
          action: {
            label: 'Try Again',
            onClick: () => get().retryJobFailedRun(id),
          },
        });

        if (job.config.stopOnError) {
          get().stopJob(id, 'Stopped due to network failure');
        }
      }
      return false;
    }
  },

  retryJobFailedRun: async (id: string) => {
    toast.info('Retrying request now...');
    await get().executeJobRun(id, 1);
  },

  startJob: (id: string) => {
    const job = get().jobs.find((j) => j.id === id);
    if (!job || !job.request || !job.request.url) {
      toast.error('Cannot start schedule: invalid target URL.');
      return;
    }

    if (jobIntervals.has(id)) clearInterval(jobIntervals.get(id));
    if (jobTimeouts.has(id)) clearTimeout(jobTimeouts.get(id));
    if (jobRetryTimeouts.has(id)) clearTimeout(jobRetryTimeouts.get(id));

    // Update job status
    set((state) => ({
      jobs: state.jobs.map((j) => (j.id === id ? { ...j, status: 'running' } : j)),
    }));

    if (job.config.type === 'once') {
      const delayMs = job.config.targetTimestamp
        ? Math.max(0, job.config.targetTimestamp - Date.now())
        : (job.config.delaySeconds || 10) * 1000;

      const targetTime = Date.now() + delayMs;
      jobNextTriggers.set(id, targetTime);

      const updateCountdown = () => {
        const remaining = Math.max(0, Math.ceil((targetTime - Date.now()) / 1000));
        set((state) => ({
          jobs: state.jobs.map((j) => (j.id === id ? { ...j, countdownSeconds: remaining } : j)),
        }));
      };

      const interval = setInterval(updateCountdown, 500);
      jobIntervals.set(id, interval);

      const timeout = setTimeout(async () => {
        await get().executeJobRun(id, 0);
        get().stopJob(id, 'One-time execution completed');
      }, delayMs);
      jobTimeouts.set(id, timeout);

      toast.info(`"${job.name}" scheduled to run in ${Math.ceil(delayMs / 1000)}s`);
    } else if (job.config.type === 'daily') {
      const timeStr = job.config.dailyTime || '09:00';
      const delayMs = getMsUntilDailyTime(timeStr);
      const targetTime = Date.now() + delayMs;
      jobNextTriggers.set(id, targetTime);

      const interval = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((targetTime - Date.now()) / 1000));
        set((state) => ({
          jobs: state.jobs.map((j) => (j.id === id ? { ...j, countdownSeconds: remaining } : j)),
        }));
      }, 1000);
      jobIntervals.set(id, interval);

      const scheduleDaily = () => {
        const nextDelay = getMsUntilDailyTime(timeStr);
        jobNextTriggers.set(id, Date.now() + nextDelay);
        const timeout = setTimeout(async () => {
          await get().executeJobRun(id, 0);
          scheduleDaily();
        }, nextDelay);
        jobTimeouts.set(id, timeout);
      };

      const timeout = setTimeout(async () => {
        await get().executeJobRun(id, 0);
        scheduleDaily();
      }, delayMs);
      jobTimeouts.set(id, timeout);

      toast.info(`"${job.name}" daily schedule active (@ ${timeStr})`);
    } else {
      // Interval Runner (1 min to 15 hours)
      const intervalSec = convertToSeconds(job.config.intervalValue, job.config.intervalUnit);
      const intervalMs = intervalSec * 1000;
      let nextTrigger = Date.now() + intervalMs;
      jobNextTriggers.set(id, nextTrigger);

      set((state) => ({
        jobs: state.jobs.map((j) => (j.id === id ? { ...j, countdownSeconds: intervalSec } : j)),
      }));

      // Immediate first execution
      get().executeJobRun(id, 0);

      const interval = setInterval(() => {
        const currentJob = get().jobs.find((j) => j.id === id);
        if (!currentJob || currentJob.status !== 'running') return;

        const remainingMs = nextTrigger - Date.now();
        const remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000));

        set((state) => ({
          jobs: state.jobs.map((j) => (j.id === id ? { ...j, countdownSeconds: remainingSeconds } : j)),
        }));

        if (remainingMs <= 0) {
          nextTrigger = Date.now() + intervalMs;
          jobNextTriggers.set(id, nextTrigger);
          get().executeJobRun(id, 0);
        }
      }, 500);

      jobIntervals.set(id, interval);
      toast.info(`"${job.name}" started (Every ${job.config.intervalValue} ${job.config.intervalUnit})`);
    }
  },

  pauseJob: (id: string) => {
    set((state) => ({
      jobs: state.jobs.map((j) => (j.id === id ? { ...j, status: 'paused' } : j)),
    }));
    toast.info('Schedule paused');
  },

  resumeJob: (id: string) => {
    const job = get().jobs.find((j) => j.id === id);
    if (!job) return;

    const intervalSec = convertToSeconds(job.config.intervalValue, job.config.intervalUnit);
    const intervalMs = intervalSec * 1000;
    jobNextTriggers.set(id, Date.now() + intervalMs);

    set((state) => ({
      jobs: state.jobs.map((j) =>
        j.id === id ? { ...j, status: 'running', countdownSeconds: intervalSec } : j
      ),
    }));
    toast.info('Schedule resumed');
  },

  stopJob: (id: string, reason?: string) => {
    if (jobIntervals.has(id)) {
      clearInterval(jobIntervals.get(id));
      jobIntervals.delete(id);
    }
    if (jobTimeouts.has(id)) {
      clearTimeout(jobTimeouts.get(id));
      jobTimeouts.delete(id);
    }
    if (jobRetryTimeouts.has(id)) {
      clearTimeout(jobRetryTimeouts.get(id));
      jobRetryTimeouts.delete(id);
    }

    set((state) => ({
      jobs: state.jobs.map((j) =>
        j.id === id ? { ...j, status: 'completed', countdownSeconds: 0 } : j
      ),
    }));

    if (reason) {
      toast.info(reason);
    }
  },
}));
