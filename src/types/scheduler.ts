import { HttpMethod, ApiRequest } from './request';
import { EnvironmentVariable } from './environment';

export type ScheduleType = 'once' | 'interval' | 'daily';
export type ScheduleStatus = 'idle' | 'running' | 'paused' | 'completed' | 'cancelled';
export type TimeUnit = 'seconds' | 'minutes' | 'hours';

export interface ScheduleJobConfig {
  type: ScheduleType;
  // For 'once': specific target timestamp (ms)
  targetTimestamp?: number;
  // For 'once': delay in seconds from trigger time
  delaySeconds?: number;
  // For 'interval': value and unit (e.g. 5 minutes, 2 hours)
  intervalValue: number;
  intervalUnit: TimeUnit;
  intervalSeconds: number;
  // For 'daily': 24h format time string e.g. "09:30", "18:00"
  dailyTime?: string;
  // Max number of iterations (0 = unlimited until stopped)
  maxRuns: number;
  // Stop running if status code >= 400
  stopOnError: boolean;
  // Automatic Retry Strategy
  autoRetry: boolean;
  maxRetries: number;
  retryDelaySeconds: number;
}

export interface ScheduleRunLog {
  id: string;
  runIndex: number;
  timestamp: number;
  method: HttpMethod;
  url: string;
  status: number;
  statusText: string;
  duration: number;
  responseSize: number;
  responseBody: string;
  isError: boolean;
  retryAttempt?: number;
}

export interface ScheduleStats {
  totalRuns: number;
  successCount: number;
  errorCount: number;
  retryCount: number;
  totalDurationMs: number;
  avgDurationMs: number;
  minDurationMs: number;
  maxDurationMs: number;
}

export interface ScheduleJob {
  id: string;
  name: string;
  request: ApiRequest;
  environmentVariables: EnvironmentVariable[];
  config: ScheduleJobConfig;
  status: ScheduleStatus;
  countdownSeconds: number;
  currentRunIndex: number;
  stats: ScheduleStats;
  logs: ScheduleRunLog[];
  createdAt: number;
  updatedAt: number;
}
