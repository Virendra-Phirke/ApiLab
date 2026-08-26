import { NextRequest, NextResponse } from 'next/server';
import { proxyRequestSchema } from '@/lib/validation';
import {
  validateUrl,
  resolveAndValidate,
  validateRedirect,
  FORBIDDEN_FORWARD_HEADERS,
  redactHeaders,
  sanitizeError,
} from '@/lib/security';
import { LIMITS } from '@/config/limits';

// Simple in-memory rate limiter per IP (V1)
interface RateLimitEntry {
  count: number;
  resetAt: number;
}
const rateLimitMap = new Map<string, RateLimitEntry>();

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, {
      count: 1,
      resetAt: now + LIMITS.RATE_LIMIT_WINDOW,
    });
    return { allowed: true, remaining: LIMITS.RATE_LIMIT_MAX - 1 };
  }

  if (entry.count >= LIMITS.RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0 };
  }

  entry.count += 1;
  return { allowed: true, remaining: LIMITS.RATE_LIMIT_MAX - entry.count };
}

// Cleanup rate limit map every 5 minutes to prevent memory leak
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitMap.entries()) {
      if (now > entry.resetAt) {
        rateLimitMap.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

export async function POST(req: NextRequest) {
  const clientIP =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1';

  // 1. Rate Limiting Check
  const rateLimit = checkRateLimit(clientIP);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please wait a minute before making more requests.' },
      {
        status: 429,
        headers: {
          'Retry-After': '60',
          'X-RateLimit-Limit': String(LIMITS.RATE_LIMIT_MAX),
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  // 2. Validate Request Body Structure
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const parseResult = proxyRequestSchema.safeParse(rawBody);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: 'Validation error', details: parseResult.error.flatten() },
      { status: 400 }
    );
  }

  const { method, url: targetUrl, headers: incomingHeaders, body: requestBody, timeout } =
    parseResult.data;

  // 3. Check Request Body Size limit (2 MB)
  if (requestBody && Buffer.byteLength(requestBody, 'utf-8') > LIMITS.MAX_REQUEST_BODY) {
    return NextResponse.json(
      { error: `Request body exceeds maximum allowed size of ${LIMITS.MAX_REQUEST_BODY / (1024 * 1024)} MB` },
      { status: 413 }
    );
  }

  // 4. SSRF Validation: URL check
  const urlValidation = validateUrl(targetUrl);
  if (!urlValidation.valid || !urlValidation.url) {
    return NextResponse.json(
      { error: urlValidation.error || 'Invalid destination URL' },
      { status: 400 }
    );
  }

  const parsedUrl = urlValidation.url;

  // 5. SSRF Validation: DNS resolution & IP check (Anti-DNS-rebinding)
  const dnsValidation = await resolveAndValidate(parsedUrl.hostname);
  if (!dnsValidation.valid) {
    return NextResponse.json(
      { error: dnsValidation.error || 'Security check failed: host is not accessible' },
      { status: 403 }
    );
  }

  // 6. Build Outbound Headers (never forward cookies, internal headers, etc.)
  const outboundHeaders = new Headers();
  let totalHeaderSize = 0;
  let headerCount = 0;

  for (const [key, value] of Object.entries(incomingHeaders)) {
    const lowerKey = key.toLowerCase();
    if (FORBIDDEN_FORWARD_HEADERS.has(lowerKey)) {
      continue;
    }
    headerCount++;
    if (headerCount > LIMITS.MAX_HEADERS) {
      return NextResponse.json({ error: `Maximum header count (${LIMITS.MAX_HEADERS}) exceeded` }, { status: 400 });
    }
    totalHeaderSize += key.length + value.length;
    if (totalHeaderSize > LIMITS.MAX_HEADER_SIZE) {
      return NextResponse.json({ error: `Total header size exceeds limit of ${LIMITS.MAX_HEADER_SIZE} bytes` }, { status: 400 });
    }
    outboundHeaders.set(key, value);
  }

  // Ensure a User-Agent is present
  if (!outboundHeaders.has('user-agent')) {
    outboundHeaders.set('user-agent', 'ApiLab/1.0 (Developer Tool)');
  }

  // 7. Request Execution with Timeout & Redirect Handling
  const requestTimeout = Math.min(timeout || LIMITS.DEFAULT_TIMEOUT, LIMITS.MAX_TIMEOUT);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), requestTimeout);

  const startTime = performance.now();
  let currentUrl = targetUrl;
  let redirectCount = 0;

  try {
    let response: Response;

    while (true) {
      const fetchOptions: RequestInit = {
        method,
        headers: outboundHeaders,
        signal: controller.signal,
        redirect: 'manual', // We manually handle and validate redirects
      };

      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && requestBody !== undefined) {
        fetchOptions.body = requestBody;
      }

      response = await fetch(currentUrl, fetchOptions);

      // Handle Redirects (301, 302, 303, 307, 308)
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get('location');
        if (!location) {
          break;
        }

        redirectCount++;
        if (redirectCount > LIMITS.MAX_REDIRECTS) {
          clearTimeout(timer);
          return NextResponse.json(
            { error: `Maximum redirect limit (${LIMITS.MAX_REDIRECTS}) exceeded` },
            { status: 508 }
          );
        }

        // Resolve relative redirects
        const nextUrl = new URL(location, currentUrl).toString();

        // SSRF validate next redirect hop
        const redirectCheck = await validateRedirect(nextUrl);
        if (!redirectCheck.valid) {
          clearTimeout(timer);
          return NextResponse.json(
            { error: redirectCheck.error || 'Redirect destination failed security validation' },
            { status: 403 }
          );
        }

        currentUrl = nextUrl;
        continue;
      }

      break;
    }

    clearTimeout(timer);
    const duration = performance.now() - startTime;

    // 8. Inspect Response Headers & Content-Length
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((val, key) => {
      responseHeaders[key] = val;
    });

    const contentType = response.headers.get('content-type') || '';
    const contentLength = response.headers.get('content-length');

    if (contentLength && parseInt(contentLength, 10) > LIMITS.MAX_RESPONSE_BODY) {
      return NextResponse.json(
        {
          error: `Response body exceeds ApiLab limit of ${LIMITS.MAX_RESPONSE_BODY / (1024 * 1024)} MB`,
        },
        { status: 502 }
      );
    }

    // 9. Read Body with Stream Size Limiter
    const reader = response.body?.getReader();
    let bodyText = '';
    let totalBytes = 0;

    if (reader) {
      const chunks: Uint8Array[] = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          totalBytes += value.byteLength;
          if (totalBytes > LIMITS.MAX_RESPONSE_BODY) {
            reader.cancel();
            return NextResponse.json(
              {
                error: `Response stream exceeded ApiLab limit of ${LIMITS.MAX_RESPONSE_BODY / (1024 * 1024)} MB`,
              },
              { status: 502 }
            );
          }
          chunks.push(value);
        }
      }

      // Combine chunks
      const combined = new Uint8Array(totalBytes);
      let offset = 0;
      for (const chunk of chunks) {
        combined.set(chunk, offset);
        offset += chunk.byteLength;
      }
      const decoder = new TextDecoder('utf-8');
      bodyText = decoder.decode(combined);
    }

    // 10. Structured Server Logging (with secrets redacted)
    console.log(
      JSON.stringify({
        tag: 'ApiLabProxy',
        timestamp: new Date().toISOString(),
        method,
        targetHost: parsedUrl.hostname,
        status: response.status,
        durationMs: Math.round(duration),
        sizeBytes: totalBytes,
        headers: redactHeaders(incomingHeaders),
      })
    );

    return NextResponse.json({
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      body: bodyText,
      contentType,
      size: totalBytes,
      timing: {
        total: duration,
        startedAt: startTime,
        completedAt: performance.now(),
      },
    });
  } catch (error: unknown) {
    clearTimeout(timer);
    const duration = performance.now() - startTime;

    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        {
          error: `Request timed out after ${requestTimeout / 1000}s`,
          status: 0,
          statusText: 'Timeout',
          timing: { total: duration, startedAt: startTime, completedAt: performance.now() },
        },
        { status: 504 }
      );
    }

    const safeMessage = sanitizeError(error);
    return NextResponse.json(
      {
        error: safeMessage,
        status: 0,
        statusText: 'Error',
        timing: { total: duration, startedAt: startTime, completedAt: performance.now() },
      },
      { status: 502 }
    );
  }
}
