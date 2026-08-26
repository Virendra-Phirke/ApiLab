import type { ApiRequest } from '@/types/request';
import type { ApiResponse } from '@/types/response';
import { resolveVariables, buildVariableMap } from '@/lib/variables';
import type { EnvironmentVariable } from '@/types/environment';

interface SendRequestOptions {
  request: ApiRequest;
  environmentVariables?: EnvironmentVariable[];
  timeout?: number;
}

// Client-side request orchestrator
// Validates, resolves variables, calls /api/request proxy, parses response
export async function sendRequest(options: SendRequestOptions): Promise<ApiResponse> {
  const { request, environmentVariables = [], timeout = 10000 } = options;
  const variableMap = buildVariableMap(environmentVariables);

  // Resolve variables in URL
  const { resolved: resolvedUrl } = resolveVariables(request.url, variableMap);

  // Build query string
  const enabledParams = request.queryParams.filter((p) => p.enabled && p.key);
  let finalUrl = resolvedUrl;

  if (enabledParams.length > 0) {
    try {
      const url = new URL(resolvedUrl);
      for (const param of enabledParams) {
        const { resolved: key } = resolveVariables(param.key, variableMap);
        const { resolved: value } = resolveVariables(param.value, variableMap);
        url.searchParams.set(key, value);
      }
      finalUrl = url.toString();
    } catch {
      // If URL is invalid, append params manually
      const params = enabledParams
        .map((p) => {
          const { resolved: key } = resolveVariables(p.key, variableMap);
          const { resolved: value } = resolveVariables(p.value, variableMap);
          return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
        })
        .join('&');
      finalUrl = `${resolvedUrl}${resolvedUrl.includes('?') ? '&' : '?'}${params}`;
    }
  }

  // Build headers
  const headers: Record<string, string> = {};
  for (const header of request.headers) {
    if (!header.enabled || !header.key) continue;
    const { resolved: key } = resolveVariables(header.key, variableMap);
    const { resolved: value } = resolveVariables(header.value, variableMap);
    headers[key] = value;
  }

  // Apply auth
  if (request.auth.type === 'bearer' && request.auth.bearer?.token) {
    const { resolved: token } = resolveVariables(request.auth.bearer.token, variableMap);
    headers['Authorization'] = `Bearer ${token}`;
  } else if (request.auth.type === 'basic' && request.auth.basic) {
    const { resolved: username } = resolveVariables(request.auth.basic.username, variableMap);
    const { resolved: password } = resolveVariables(request.auth.basic.password, variableMap);
    headers['Authorization'] = `Basic ${btoa(`${username}:${password}`)}`;
  } else if (request.auth.type === 'api-key' && request.auth.apiKey) {
    const { resolved: key } = resolveVariables(request.auth.apiKey.key, variableMap);
    const { resolved: value } = resolveVariables(request.auth.apiKey.value, variableMap);
    if (request.auth.apiKey.addTo === 'header') {
      headers[key] = value;
    } else {
      // Add to query
      finalUrl += `${finalUrl.includes('?') ? '&' : '?'}${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
    }
  }

  // Build body
  let body: string | undefined;
  if (request.body.type !== 'none' && request.body.content) {
    const { resolved: resolvedBody } = resolveVariables(request.body.content, variableMap);
    body = resolvedBody;

    // Auto-set Content-Type if not already set
    if (!Object.keys(headers).some((k) => k.toLowerCase() === 'content-type')) {
      switch (request.body.type) {
        case 'json':
          headers['Content-Type'] = 'application/json';
          break;
        case 'xml':
          headers['Content-Type'] = 'application/xml';
          break;
        case 'html':
          headers['Content-Type'] = 'text/html';
          break;
        case 'form-urlencoded':
          headers['Content-Type'] = 'application/x-www-form-urlencoded';
          break;
        case 'text':
          headers['Content-Type'] = 'text/plain';
          break;
      }
    }
  }

  // Send through proxy
  const startTime = performance.now();

  const proxyResponse = await fetch('/api/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      method: request.method,
      url: finalUrl,
      headers,
      body,
      timeout,
    }),
  });

  const endTime = performance.now();
  const responseData = await proxyResponse.json();

  if (!proxyResponse.ok) {
    return {
      status: 0,
      statusText: 'Error',
      headers: {},
      body: responseData.error || 'Request failed',
      contentType: 'text/plain',
      size: 0,
      timing: {
        total: endTime - startTime,
        startedAt: startTime,
        completedAt: endTime,
      },
      error: responseData.error,
    };
  }

  return {
    status: responseData.status,
    statusText: responseData.statusText,
    headers: responseData.headers || {},
    body: responseData.body || '',
    contentType: responseData.contentType || '',
    size: responseData.size || 0,
    timing: {
      total: responseData.timing?.total || (endTime - startTime),
      startedAt: startTime,
      completedAt: endTime,
    },
  };
}
