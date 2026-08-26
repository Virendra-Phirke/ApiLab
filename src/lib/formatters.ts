// Formatters for display across the application

// Format bytes into human-readable string
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);
  return `${value.toFixed(value < 10 ? 1 : 0)} ${units[i]}`;
}

// Format milliseconds into human-readable duration
export function formatDuration(ms: number): string {
  if (ms < 1) return '<1 ms';
  if (ms < 1000) return `${Math.round(ms)} ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)} s`;
  return `${(ms / 60000).toFixed(1)} min`;
}

// Format timestamp to local date/time string
export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

// Format relative time (e.g., "2 minutes ago")
export function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatTimestamp(timestamp);
}

// Pretty-print JSON with indentation
export function formatJson(json: string): string {
  try {
    return JSON.stringify(JSON.parse(json), null, 2);
  } catch {
    return json;
  }
}

// Validate JSON string
export function isValidJson(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

// Format XML with basic indentation
export function formatXml(xml: string): string {
  let formatted = '';
  let indent = '';
  const tab = '  ';

  xml.split(/>\s*</).forEach((node) => {
    if (node.match(/^\/\w/)) {
      indent = indent.substring(tab.length);
    }
    formatted += indent + '<' + node + '>\n';
    if (node.match(/^<?\w[^>]*[^/]$/) && !node.startsWith('?')) {
      indent += tab;
    }
  });

  return formatted.substring(1, formatted.length - 2);
}

// Truncate string with ellipsis
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}

// Get content type display name
export function getContentTypeLabel(contentType: string): string {
  if (!contentType) return 'Unknown';
  if (contentType.includes('json')) return 'JSON';
  if (contentType.includes('xml')) return 'XML';
  if (contentType.includes('html')) return 'HTML';
  if (contentType.includes('text')) return 'Text';
  if (contentType.includes('form')) return 'Form';
  if (contentType.includes('image')) return 'Image';
  if (contentType.includes('pdf')) return 'PDF';
  return contentType.split(';')[0].trim();
}
