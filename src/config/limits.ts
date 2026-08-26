// Configurable limits for ApiLab
// These protect both the server and the browser from resource exhaustion

export const LIMITS = {
  // Request body maximum size (bytes)
  MAX_REQUEST_BODY: 2 * 1024 * 1024, // 2 MB

  // Response body maximum size (bytes)
  MAX_RESPONSE_BODY: 5 * 1024 * 1024, // 5 MB

  // Default request timeout (milliseconds)
  DEFAULT_TIMEOUT: 10_000, // 10 seconds

  // Maximum allowed timeout (milliseconds)
  MAX_TIMEOUT: 30_000, // 30 seconds

  // Maximum number of headers per request
  MAX_HEADERS: 100,

  // Maximum total header size (bytes)
  MAX_HEADER_SIZE: 16 * 1024, // 16 KB

  // Rate limit: requests per window
  RATE_LIMIT_MAX: 30,

  // Rate limit window (milliseconds)
  RATE_LIMIT_WINDOW: 60_000, // 1 minute

  // Maximum redirect hops
  MAX_REDIRECTS: 5,

  // Maximum URL length
  MAX_URL_LENGTH: 8192, // 8 KB

  // Maximum history entries stored
  MAX_HISTORY_ENTRIES: 500,

  // Maximum collections
  MAX_COLLECTIONS: 100,

  // Maximum requests per collection
  MAX_REQUESTS_PER_COLLECTION: 200,

  // Maximum import file size (bytes)
  MAX_IMPORT_SIZE: 10 * 1024 * 1024, // 10 MB
} as const;

export type Limits = typeof LIMITS;
