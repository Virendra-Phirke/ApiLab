import { pgTable, text, timestamp, boolean, jsonb, integer } from 'drizzle-orm/pg-core';
import { ScheduleJobConfig, ScheduleStats } from '@/types/scheduler';

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
});

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
  scope: text('scope'),
  password: text('password'),
  issuer: text('issuer'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
});

export const schedules = pgTable('schedules', {
  id: text('id').primaryKey(),
  userId: text('userId').references(() => user.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  method: text('method').notNull().default('GET'),
  url: text('url').notNull(),
  headers: jsonb('headers').$type<any[]>().default([]),
  queryParams: jsonb('queryParams').$type<any[]>().default([]),
  body: jsonb('body').$type<any>(),
  auth: jsonb('auth').$type<any>(),
  config: jsonb('config').$type<ScheduleJobConfig>().notNull(),
  stats: jsonb('stats').$type<ScheduleStats>(),
  status: text('status').notNull().default('idle'), // 'idle' | 'running' | 'paused' | 'completed'
  currentRunIndex: integer('currentRunIndex').default(0),
  lastRunAt: timestamp('lastRunAt'),
  nextRunAt: timestamp('nextRunAt'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
});

export const scheduleLogs = pgTable('schedule_logs', {
  id: text('id').primaryKey(),
  scheduleId: text('scheduleId')
    .notNull()
    .references(() => schedules.id, { onDelete: 'cascade' }),
  userId: text('userId').references(() => user.id, { onDelete: 'cascade' }),
  runIndex: integer('runIndex').notNull().default(1),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  method: text('method').notNull().default('GET'),
  url: text('url').notNull(),
  status: integer('status').notNull(),
  statusText: text('statusText').notNull().default('OK'),
  duration: integer('duration').notNull().default(0),
  responseSize: integer('responseSize').notNull().default(0),
  responseBody: text('responseBody').default(''),
  isError: boolean('isError').notNull().default(false),
  retryAttempt: integer('retryAttempt').default(0),
  executedBy: text('executedBy').notNull().default('cloud-cron'), // 'cloud-cron' | 'client-browser'
  createdAt: timestamp('createdAt').notNull().defaultNow(),
});
