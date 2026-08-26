// API response from the proxy
export interface ApiResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  contentType: string;
  size: number;
  timing: ResponseTiming;
  error?: string;
}

// Detailed timing breakdown
export interface ResponseTiming {
  total: number;       // Total round-trip time in ms
  startedAt: number;   // Timestamp when request was sent
  completedAt: number; // Timestamp when response was received
}

// Status code categories for visual styling
export type StatusCategory = 'success' | 'redirect' | 'client-error' | 'server-error' | 'unknown';

export function getStatusCategory(status: number): StatusCategory {
  if (status >= 200 && status < 300) return 'success';
  if (status >= 300 && status < 400) return 'redirect';
  if (status >= 400 && status < 500) return 'client-error';
  if (status >= 500 && status < 600) return 'server-error';
  return 'unknown';
}

// Status display info
export interface StatusDisplay {
  category: StatusCategory;
  icon: string; // ✓, ⚠, ✕
  color: string;
}

export function getStatusDisplay(status: number): StatusDisplay {
  const category = getStatusCategory(status);
  switch (category) {
    case 'success':
      return { category, icon: '✓', color: 'hsl(142, 71%, 45%)' };
    case 'redirect':
      return { category, icon: '⚠', color: 'hsl(45, 93%, 47%)' };
    case 'client-error':
      return { category, icon: '✕', color: 'hsl(32, 95%, 50%)' };
    case 'server-error':
      return { category, icon: '✕', color: 'hsl(0, 84%, 60%)' };
    default:
      return { category, icon: '?', color: 'hsl(0, 0%, 50%)' };
  }
}

// Empty response placeholder
export const EMPTY_RESPONSE: ApiResponse = {
  status: 0,
  statusText: '',
  headers: {},
  body: '',
  contentType: '',
  size: 0,
  timing: { total: 0, startedAt: 0, completedAt: 0 },
};
