// HTTP Methods supported by ApiLab
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

// Query parameter entry
export interface QueryParam {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

// Header entry
export interface Header {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

// Body content types
export type BodyType = 'none' | 'json' | 'text' | 'xml' | 'html' | 'form-urlencoded' | 'form-data' | 'binary';

// Request body
export interface RequestBody {
  type: BodyType;
  content: string;
}

// Authentication types
export type AuthType = 'none' | 'bearer' | 'basic' | 'api-key';

// Auth configuration per type
export interface AuthConfig {
  type: AuthType;
  bearer?: {
    token: string;
  };
  basic?: {
    username: string;
    password: string;
  };
  apiKey?: {
    key: string;
    value: string;
    addTo: 'header' | 'query';
  };
}

// Full API request definition
export interface ApiRequest {
  id: string;
  name: string;
  collectionId?: string;
  method: HttpMethod;
  url: string;
  queryParams: QueryParam[];
  headers: Header[];
  body: RequestBody;
  auth: AuthConfig;
  tests: string[]; // Test assertion IDs
  createdAt: number;
  updatedAt: number;
}

// Form data entry (for multipart/form-urlencoded)
export interface FormDataEntry {
  id: string;
  key: string;
  value: string;
  type: 'text' | 'file';
  enabled: boolean;
}

// Default empty request
export const createDefaultRequest = (): ApiRequest => ({
  id: crypto.randomUUID(),
  name: 'New Request',
  method: 'GET',
  url: '',
  queryParams: [],
  headers: [],
  body: { type: 'none', content: '' },
  auth: { type: 'none' },
  tests: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

// HTTP method metadata for UI
export const HTTP_METHOD_COLORS: Record<HttpMethod, string> = {
  GET: 'hsl(142, 71%, 45%)',
  POST: 'hsl(217, 91%, 60%)',
  PUT: 'hsl(32, 95%, 50%)',
  PATCH: 'hsl(45, 93%, 47%)',
  DELETE: 'hsl(0, 84%, 60%)',
  HEAD: 'hsl(271, 91%, 65%)',
  OPTIONS: 'hsl(199, 89%, 48%)',
};
