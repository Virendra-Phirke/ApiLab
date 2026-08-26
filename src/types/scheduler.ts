import { HttpMethod, ApiRequest } from './request';

export type ScheduleType = 'once' | 'interval' | 'daily';
export type ScheduleStatus = 'idle' | 'running' | 'paused' | 'completed' | 'cancelled';
export type TimeUnit = 'seconds' | 'minutes' | 'hours';

export interface ScheduleJobConfig {
  type: ScheduleType;
  // For 'once': specific target timestamp (ms)
  targetTimestamp?: number;
  // For 'once': delay in seconds from trigger time
  delaySeconds?: number;
  // For 'interval': value and unit
  intervalValue: number;
  intervalUnit: TimeUnit;
  // Total interval converted to seconds
  intervalSeconds: number;
  // For 'daily': 24h format time string e.g. "09:30", "18:00"
  dailyTime?: string;
  // Max number of iterations (0 = unlimited until stopped)
  maxRuns: number;
  // Stop running if status code >= 400
  stopOnError: boolean;
  // Automatic Retry Strategy
  autoRetry: boolean;
  maxRetries: number; // e.g. 1, 2, 3, 5
  retryDelaySeconds: number; // e.g. 2, 5, 10
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
  retryAttempt?: number; // 0 for initial, 1, 2, 3 for retries
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
