import type { HttpMethod, Header, AuthConfig, RequestBody } from '@/types/request';

interface CurlOptions {
  method: HttpMethod;
  url: string;
  headers: Header[];
  body: RequestBody;
  auth: AuthConfig;
  redactSecrets?: boolean;
}

// Generate a cURL command from a request configuration
export function generateCurl(options: CurlOptions): string {
  const { method, url, headers, body, auth, redactSecrets = false } = options;

  const parts: string[] = ['curl'];

  // Method (skip for GET as it's default)
  if (method !== 'GET') {
    parts.push(`-X ${method}`);
  }

  // URL
  parts.push(`"${escapeShell(url)}"`);

  // Auth headers
  if (auth.type === 'bearer' && auth.bearer?.token) {
    const token = redactSecrets ? '••••••••' : auth.bearer.token;
    parts.push(`-H "Authorization: Bearer ${escapeShell(token)}"`);
  } else if (auth.type === 'basic' && auth.basic) {
    const user = auth.basic.username;
    const pass = redactSecrets ? '••••••••' : auth.basic.password;
    parts.push(`-u "${escapeShell(user)}:${escapeShell(pass)}"`);
  } else if (auth.type === 'api-key' && auth.apiKey && auth.apiKey.addTo === 'header') {
    const val = redactSecrets ? '••••••••' : auth.apiKey.value;
    parts.push(`-H "${escapeShell(auth.apiKey.key)}: ${escapeShell(val)}"`);
  }

  // Custom headers
  for (const header of headers) {
    if (!header.enabled || !header.key) continue;
    const value = redactSecrets && isSensitiveHeader(header.key)
      ? '••••••••'
      : header.value;
    parts.push(`-H "${escapeShell(header.key)}: ${escapeShell(value)}"`);
  }

  // Body
  if (body.type !== 'none' && body.content) {
    if (body.type === 'json' || body.type === 'text' || body.type === 'xml' || body.type === 'html') {
      parts.push(`-d '${escapeShellSingleQuote(body.content)}'`);
    } else if (body.type === 'form-urlencoded') {
      parts.push(`--data-urlencode '${escapeShellSingleQuote(body.content)}'`);
    }
  }

  return parts.join(' \\\n  ');
}

// Escape double-quoted shell strings
function escapeShell(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\$/g, '\\$').replace(/`/g, '\\`');
}

// Escape single-quoted shell strings
function escapeShellSingleQuote(str: string): string {
  return str.replace(/'/g, "'\\''");
}

// Check if a header name is sensitive
function isSensitiveHeader(name: string): boolean {
  const lower = name.toLowerCase();
  return [
    'authorization',
    'cookie',
    'x-api-key',
    'api-key',
    'x-auth-token',
    'proxy-authorization',
  ].some(s => lower.includes(s));
}
