import { LIMITS } from '@/config/limits';
import dns from 'node:dns';
import { promisify } from 'node:util';

const dnsLookup = promisify(dns.lookup);

// Protocols allowed for outbound requests
const ALLOWED_PROTOCOLS = ['http:', 'https:'];

// Blocked protocols
const BLOCKED_PROTOCOLS = ['file:', 'ftp:', 'gopher:', 'data:', 'javascript:', 'ws:', 'wss:'];

// Private/reserved IP ranges (RFC 1918, RFC 5737, link-local, loopback, etc.)
const PRIVATE_IP_RANGES = [
  // IPv4
  { start: '10.0.0.0', end: '10.255.255.255' },       // RFC 1918
  { start: '172.16.0.0', end: '172.31.255.255' },      // RFC 1918
  { start: '192.168.0.0', end: '192.168.255.255' },    // RFC 1918
  { start: '127.0.0.0', end: '127.255.255.255' },      // Loopback
  { start: '169.254.0.0', end: '169.254.255.255' },    // Link-local
  { start: '0.0.0.0', end: '0.255.255.255' },          // Current network
  { start: '100.64.0.0', end: '100.127.255.255' },     // Shared address space
  { start: '192.0.0.0', end: '192.0.0.255' },          // IETF Protocol
  { start: '192.0.2.0', end: '192.0.2.255' },          // Documentation (TEST-NET-1)
  { start: '198.51.100.0', end: '198.51.100.255' },    // Documentation (TEST-NET-2)
  { start: '203.0.113.0', end: '203.0.113.255' },      // Documentation (TEST-NET-3)
  { start: '224.0.0.0', end: '239.255.255.255' },      // Multicast
  { start: '240.0.0.0', end: '255.255.255.255' },      // Reserved
];

// Blocked hostnames
const BLOCKED_HOSTNAMES = [
  'localhost',
  'localhost.localdomain',
  'ip6-localhost',
  'ip6-loopback',
  '0.0.0.0',
  '[::]',
  '[::1]',
  'metadata.google.internal',         // GCP metadata
  'metadata.google.com',
];

// Convert IPv4 string to numeric for range comparison
function ipv4ToNumber(ip: string): number {
  const parts = ip.split('.').map(Number);
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

// Check if an IPv4 address is private/reserved
function isPrivateIPv4(ip: string): boolean {
  const ipNum = ipv4ToNumber(ip);
  return PRIVATE_IP_RANGES.some(range => {
    const startNum = ipv4ToNumber(range.start);
    const endNum = ipv4ToNumber(range.end);
    return ipNum >= startNum && ipNum <= endNum;
  });
}

// Check if an IPv6 address is private/reserved
function isPrivateIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase();
  // Loopback
  if (normalized === '::1' || normalized === '0000:0000:0000:0000:0000:0000:0000:0001') return true;
  // Unspecified
  if (normalized === '::' || normalized === '0000:0000:0000:0000:0000:0000:0000:0000') return true;
  // Link-local
  if (normalized.startsWith('fe80:')) return true;
  // Unique local address (ULA)
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true;
  // IPv4-mapped IPv6 (::ffff:x.x.x.x)
  if (normalized.startsWith('::ffff:')) {
    const ipv4Part = normalized.slice(7);
    if (/^\d+\.\d+\.\d+\.\d+$/.test(ipv4Part)) {
      return isPrivateIPv4(ipv4Part);
    }
  }
  return false;
}

// Check if an IP address is private (IPv4 or IPv6)
export function isPrivateIP(ip: string): boolean {
  // Clean brackets from IPv6
  const cleanIP = ip.replace(/^\[|\]$/g, '');

  if (cleanIP.includes(':')) {
    return isPrivateIPv6(cleanIP);
  }
  return isPrivateIPv4(cleanIP);
}

// Validate URL protocol and structure
export function validateUrl(urlString: string): { valid: boolean; error?: string; url?: URL } {
  if (!urlString || typeof urlString !== 'string') {
    return { valid: false, error: 'URL is required' };
  }

  if (urlString.length > LIMITS.MAX_URL_LENGTH) {
    return { valid: false, error: `URL exceeds maximum length of ${LIMITS.MAX_URL_LENGTH} characters` };
  }

  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }

  // Check protocol
  if (BLOCKED_PROTOCOLS.includes(url.protocol)) {
    return { valid: false, error: `Protocol ${url.protocol} is not allowed` };
  }

  if (!ALLOWED_PROTOCOLS.includes(url.protocol)) {
    return { valid: false, error: `Only HTTP and HTTPS protocols are supported` };
  }

  // Check for blocked hostnames
  const hostname = url.hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.includes(hostname)) {
    return { valid: false, error: 'Requests to this host are not allowed' };
  }

  // Check if hostname is an IP and if it's private
  if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    if (isPrivateIPv4(hostname)) {
      return { valid: false, error: 'Requests to private IP addresses are not allowed' };
    }
  }

  // IPv6 literal in URL
  if (hostname.startsWith('[') && hostname.endsWith(']')) {
    const ipv6 = hostname.slice(1, -1);
    if (isPrivateIPv6(ipv6)) {
      return { valid: false, error: 'Requests to private IP addresses are not allowed' };
    }
  }

  return { valid: true, url };
}

// DNS resolution with private IP validation (anti-DNS-rebinding)
export async function resolveAndValidate(hostname: string): Promise<{ valid: boolean; error?: string; ip?: string }> {
  try {
    // Skip resolution for IP addresses
    if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname) || hostname.includes(':')) {
      const isPrivate = isPrivateIP(hostname);
      return isPrivate
        ? { valid: false, error: 'Requests to private IP addresses are not allowed' }
        : { valid: true, ip: hostname };
    }

    const result = await dnsLookup(hostname, { all: false });
    const resolvedIP = result.address;

    if (isPrivateIP(resolvedIP)) {
      return { valid: false, error: 'DNS resolves to a private IP address. Request blocked for security.' };
    }

    return { valid: true, ip: resolvedIP };
  } catch {
    return { valid: false, error: 'Unable to resolve hostname' };
  }
}

// Validate a redirect URL (re-check SSRF protections)
export async function validateRedirect(redirectUrl: string): Promise<{ valid: boolean; error?: string }> {
  const urlValidation = validateUrl(redirectUrl);
  if (!urlValidation.valid) {
    return { valid: false, error: `Redirect blocked: ${urlValidation.error}` };
  }

  const dnsValidation = await resolveAndValidate(urlValidation.url!.hostname);
  if (!dnsValidation.valid) {
    return { valid: false, error: `Redirect blocked: ${dnsValidation.error}` };
  }

  return { valid: true };
}

// Headers that must NEVER be forwarded from the browser to the target API
export const FORBIDDEN_FORWARD_HEADERS = new Set([
  'cookie',
  'host',
  'connection',
  'content-length',
  'transfer-encoding',
  'x-forwarded-for',
  'x-forwarded-host',
  'x-forwarded-proto',
  'x-real-ip',
  'cf-connecting-ip',
  'true-client-ip',
]);

// Sensitive headers/values that must be redacted in logs
export const SENSITIVE_HEADER_PATTERNS = [
  'authorization',
  'cookie',
  'set-cookie',
  'x-api-key',
  'api-key',
  'x-auth-token',
  'proxy-authorization',
];

// Redact sensitive values for logging
export function redactHeaders(headers: Record<string, string>): Record<string, string> {
  const redacted: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (SENSITIVE_HEADER_PATTERNS.some(pattern => key.toLowerCase().includes(pattern))) {
      redacted[key] = '[REDACTED]';
    } else {
      redacted[key] = value;
    }
  }
  return redacted;
}

// Sanitize error messages for client responses (never leak internals)
export function sanitizeError(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (message.includes('econnrefused')) return 'Unable to connect to the requested API.';
    if (message.includes('enotfound')) return 'The requested host could not be found.';
    if (message.includes('etimedout') || message.includes('timeout')) return 'The request timed out.';
    if (message.includes('econnreset')) return 'The connection was reset by the target server.';
    if (message.includes('cert') || message.includes('ssl') || message.includes('tls')) {
      return 'SSL/TLS certificate error with the target server.';
    }
    if (message.includes('socket hang up')) return 'The connection was unexpectedly closed.';
  }
  return 'An error occurred while processing the request.';
}
