import { HttpMethod, ApiRequest } from './request';

export type ScheduleType = 'once' | 'interval';
export type ScheduleStatus = 'idle' | 'running' | 'paused' | 'completed' | 'cancelled';

export interface ScheduleJobConfig {
  type: ScheduleType;
  // For 'once': specific target timestamp (ms)
  targetTimestamp?: number;
  // For 'once': delay in seconds from trigger time
  delaySeconds?: number;
  // For 'interval': time gap between runs in seconds (e.g. 5 = every 5s)
  intervalSeconds: number;
  // Max number of iterations (0 = unlimited until stopped)
  maxRuns: number;
  // Stop running if status code >= 400
  stopOnError: boolean;
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
}

export interface ScheduleStats {
  totalRuns: number;
  successCount: number;
  errorCount: number;
  totalDurationMs: number;
  avgDurationMs: number;
  minDurationMs: number;
  maxDurationMs: number;
}
