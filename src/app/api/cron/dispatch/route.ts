import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { eq, and, lte, or, isNull } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { ScheduleJobConfig, ScheduleStats } from '@/types/scheduler';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow full 60s for serverless execution

export async function GET(request: NextRequest) {
  return handleDispatch(request);
}

export async function POST(request: NextRequest) {
  return handleDispatch(request);
}

async function handleDispatch(request: NextRequest) {
  const startTime = Date.now();
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // If CRON_SECRET is configured, enforce verification
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    // Also allow internal Vercel cron header
    const vercelCron = request.headers.get('x-vercel-cron');
    if (!vercelCron) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized cron dispatch' },
        { status: 401 }
      );
    }
  }

  try {
    const now = new Date();

    // 1. Find all active running schedules where nextRunAt <= NOW() or nextRunAt is NULL
    const dueSchedules = await db
      .select()
      .from(schema.schedules)
      .where(
        and(
          eq(schema.schedules.status, 'running'),
          or(
            lte(schema.schedules.nextRunAt, now),
            isNull(schema.schedules.nextRunAt)
          )
        )
      );

    if (dueSchedules.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active schedules due for execution at this time.',
        processedCount: 0,
        timestamp: now.toISOString(),
      });
    }

    const results = [];

    // 2. Execute each due schedule asynchronously
    for (const schedule of dueSchedules) {
      const jobResult = await executeCloudSchedule(schedule, now);
      results.push(jobResult);
    }

    return NextResponse.json({
      success: true,
      processedCount: results.length,
      durationMs: Date.now() - startTime,
      timestamp: now.toISOString(),
      results,
    });
  } catch (error: any) {
    console.error('Fatal error in cloud cron dispatcher:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Cloud cron dispatcher failed' },
      { status: 500 }
    );
  }
}

async function executeCloudSchedule(schedule: any, now: Date) {
  const config = (schedule.config || {}) as ScheduleJobConfig;
  const prevStats = (schedule.stats || {
    totalRuns: 0,
    successCount: 0,
    errorCount: 0,
    retryCount: 0,
    totalDurationMs: 0,
    avgDurationMs: 0,
    minDurationMs: Infinity,
    maxDurationMs: 0,
  }) as ScheduleStats;

  const runIndex = (schedule.currentRunIndex || 0) + 1;
  const startReqTime = Date.now();

  let status = 0;
  let statusText = 'Unknown';
  let responseSize = 0;
  let responseBody = '';
  let isError = true;
  let duration = 0;

  try {
    // Construct Target URL with Query Parameters
    const urlObj = new URL(schedule.url);
    if (Array.isArray(schedule.queryParams)) {
      schedule.queryParams.forEach((qp: any) => {
        if (qp.enabled && qp.key) {
          urlObj.searchParams.append(qp.key, qp.value || '');
        }
      });
    }

    // Construct Headers
    const headers: Record<string, string> = {
      'User-Agent': 'ApiLab-Cloud-Automation/2.0 (+https://github.com/Virendra-Phirke/ApiLab)',
    };

    if (Array.isArray(schedule.headers)) {
      schedule.headers.forEach((h: any) => {
        if (h.enabled && h.key) {
          headers[h.key] = h.value || '';
        }
      });
    }

    // Authentication Headers
    if (schedule.auth?.type === 'bearer' && schedule.auth.bearer?.token) {
      headers['Authorization'] = `Bearer ${schedule.auth.bearer.token}`;
    } else if (schedule.auth?.type === 'basic' && schedule.auth.basic) {
      const creds = Buffer.from(
        `${schedule.auth.basic.username || ''}:${schedule.auth.basic.password || ''}`
      ).toString('base64');
      headers['Authorization'] = `Basic ${creds}`;
    }

    // Body
    let bodyPayload: any = undefined;
    if (
      schedule.method !== 'GET' &&
      schedule.method !== 'HEAD' &&
      schedule.body?.content
    ) {
      bodyPayload = schedule.body.content;
      if (!headers['Content-Type']) {
        if (schedule.body.type === 'json') {
          headers['Content-Type'] = 'application/json';
        } else if (schedule.body.type === 'xml') {
          headers['Content-Type'] = 'application/xml';
        } else {
          headers['Content-Type'] = 'text/plain';
        }
      }
    }

    // Execute HTTP Request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout

    const res = await fetch(urlObj.toString(), {
      method: schedule.method,
      headers,
      body: bodyPayload,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    duration = Date.now() - startReqTime;
    status = res.status;
    statusText = res.statusText || (res.status >= 200 && res.status < 400 ? 'OK' : 'Error');
    isError = res.status >= 400 || res.status === 0;

    const rawText = await res.text();
    responseSize = Buffer.byteLength(rawText, 'utf8');
    responseBody = rawText.slice(0, 10000); // Store up to first 10KB
  } catch (err: any) {
    duration = Date.now() - startReqTime;
    status = 500;
    statusText = err?.name === 'AbortError' ? 'Timeout' : 'Network Error';
    isError = true;
    responseBody = err?.message || 'Connection failure on cloud runner';
  }

  // 3. Compute Updated Stats
  const newTotalRuns = (prevStats.totalRuns || 0) + 1;
  const newSuccessCount = (prevStats.successCount || 0) + (isError ? 0 : 1);
  const newErrorCount = (prevStats.errorCount || 0) + (isError ? 1 : 0);
  const newTotalDuration = (prevStats.totalDurationMs || 0) + duration;

  const updatedStats: ScheduleStats = {
    totalRuns: newTotalRuns,
    successCount: newSuccessCount,
    errorCount: newErrorCount,
    retryCount: prevStats.retryCount || 0,
    totalDurationMs: newTotalDuration,
    avgDurationMs: Math.round(newTotalDuration / newTotalRuns),
    minDurationMs: Math.min(prevStats.minDurationMs ?? Infinity, duration),
    maxDurationMs: Math.max(prevStats.maxDurationMs ?? 0, duration),
  };

  // 4. Save Execution Log to `schedule_logs` table
  const logId = uuidv4();
  await db.insert(schema.scheduleLogs).values({
    id: logId,
    scheduleId: schedule.id,
    userId: schedule.userId || null,
    runIndex,
    timestamp: now,
    method: schedule.method,
    url: schedule.url,
    status,
    statusText,
    duration,
    responseSize,
    responseBody,
    isError,
    retryAttempt: 0,
    executedBy: 'cloud-cron',
    createdAt: now,
  });

  // 5. Compute Next Execution Time
  let nextRunAt: Date | null = null;
  let newStatus = schedule.status;

  if (config.type === 'interval') {
    const intervalSec = Math.max(10, config.intervalSeconds || 300);
    nextRunAt = new Date(Date.now() + intervalSec * 1000);

    // Max runs guard
    if (config.maxRuns > 0 && runIndex >= config.maxRuns) {
      newStatus = 'completed';
      nextRunAt = null;
    }
  } else if (config.type === 'daily') {
    const [hours, minutes] = (config.dailyTime || '09:00')
      .split(':')
      .map((num) => parseInt(num, 10) || 0);

    const nextTarget = new Date();
    nextTarget.setHours(hours, minutes, 0, 0);
    if (nextTarget.getTime() <= Date.now()) {
      nextTarget.setDate(nextTarget.getDate() + 1);
    }
    nextRunAt = nextTarget;
  } else {
    // One-time execution
    newStatus = 'completed';
    nextRunAt = null;
  }

  // Stop on error guard
  if (isError && config.stopOnError) {
    newStatus = 'completed';
    nextRunAt = null;
  }

  // Auto-retry scheduling if failed
  if (isError && config.autoRetry && newStatus === 'running') {
    const retrySec = config.retryDelaySeconds || 10;
    nextRunAt = new Date(Date.now() + retrySec * 1000);
  }

  // 6. Update Schedule Record in DB
  await db
    .update(schema.schedules)
    .set({
      currentRunIndex: runIndex,
      lastRunAt: now,
      nextRunAt,
      status: newStatus,
      stats: updatedStats,
      updatedAt: now,
    })
    .where(eq(schema.schedules.id, schedule.id));

  return {
    id: schedule.id,
    name: schedule.name,
    status,
    duration,
    isError,
    nextRunAt: nextRunAt ? nextRunAt.toISOString() : null,
  };
}
