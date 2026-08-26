import { z } from 'zod';

// Proxy request validation schema (server-side)
export const proxyRequestSchema = z.object({
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']),
  url: z.string().min(1).max(8192),
  headers: z.record(z.string(), z.string()).optional().default({}),
  body: z.string().optional(),
  timeout: z.number().min(1000).max(30000).optional().default(10000),
});

export type ProxyRequest = z.infer<typeof proxyRequestSchema>;

// Import schema validation
export const importSchema = z.object({
  version: z.number(),
  exportedAt: z.number().optional(),
  collections: z.array(z.object({
    id: z.string(),
    name: z.string(),
    parentId: z.string().optional(),
    createdAt: z.number(),
    updatedAt: z.number(),
  })).optional().default([]),
  requests: z.array(z.object({
    id: z.string(),
    name: z.string(),
    collectionId: z.string().optional(),
    method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']),
    url: z.string(),
    queryParams: z.array(z.object({
      id: z.string(),
      key: z.string(),
      value: z.string(),
      enabled: z.boolean(),
    })).default([]),
    headers: z.array(z.object({
      id: z.string(),
      key: z.string(),
      value: z.string(),
      enabled: z.boolean(),
    })).default([]),
    body: z.object({
      type: z.enum(['none', 'json', 'text', 'xml', 'html', 'form-urlencoded', 'form-data']),
      content: z.string(),
    }).default({ type: 'none', content: '' }),
    auth: z.object({
      type: z.enum(['none', 'bearer', 'basic', 'api-key']),
      bearer: z.object({ token: z.string() }).optional(),
      basic: z.object({ username: z.string(), password: z.string() }).optional(),
      apiKey: z.object({
        key: z.string(),
        value: z.string(),
        addTo: z.enum(['header', 'query']),
      }).optional(),
    }).default({ type: 'none' }),
    tests: z.array(z.string()).default([]),
    createdAt: z.number(),
    updatedAt: z.number(),
  })).optional().default([]),
  environments: z.array(z.object({
    id: z.string(),
    name: z.string(),
    variables: z.array(z.object({
      id: z.string(),
      key: z.string(),
      value: z.string(),
      type: z.enum(['public', 'secret']),
      enabled: z.boolean(),
    })).default([]),
    createdAt: z.number(),
    updatedAt: z.number(),
  })).optional().default([]),
  history: z.array(z.object({
    id: z.string(),
    requestId: z.string().optional(),
    method: z.string(),
    url: z.string(),
    status: z.number(),
    statusText: z.string(),
    duration: z.number(),
    size: z.number(),
    timestamp: z.number(),
  })).optional().default([]),
  tests: z.array(z.object({
    id: z.string(),
    requestId: z.string(),
    name: z.string(),
    assertions: z.array(z.object({
      id: z.string(),
      type: z.enum([
        'status-equals', 'status-not-equals',
        'body-contains', 'body-not-contains',
        'body-json-path-equals',
        'header-exists', 'header-equals',
        'response-time-less-than',
      ]),
      target: z.string().optional(),
      expected: z.string(),
      enabled: z.boolean(),
    })).default([]),
    createdAt: z.number(),
    updatedAt: z.number(),
  })).optional().default([]),
});

export type ImportData = z.infer<typeof importSchema>;
