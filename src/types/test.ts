// Assertion types for declarative testing
export type AssertionType =
  | 'status-equals'
  | 'status-not-equals'
  | 'body-contains'
  | 'body-not-contains'
  | 'body-json-path-equals'
  | 'header-exists'
  | 'header-equals'
  | 'response-time-less-than';

// Single test assertion
export interface TestAssertion {
  id: string;
  type: AssertionType;
  target?: string;  // e.g., header name, JSON path
  expected: string; // Expected value
  enabled: boolean;
}

// Full test configuration attached to a request
export interface ApiTest {
  id: string;
  requestId: string;
  name: string;
  assertions: TestAssertion[];
  createdAt: number;
  updatedAt: number;
}

// Result of running a single assertion
export interface AssertionResult {
  assertion: TestAssertion;
  passed: boolean;
  actual?: string;
  message: string;
}

// Result of running all tests for a request
export interface TestRunResult {
  testId: string;
  requestId: string;
  results: AssertionResult[];
  passCount: number;
  failCount: number;
  totalCount: number;
  duration: number;
  executedAt: number;
}

// History entry stored in IndexedDB
export interface HistoryEntry {
  id: string;
  requestId?: string;
  method: string;
  url: string;
  status: number;
  statusText: string;
  duration: number;
  size: number;
  timestamp: number;
}

// Default assertion constructor
export const createDefaultAssertion = (): TestAssertion => ({
  id: crypto.randomUUID(),
  type: 'status-equals',
  expected: '200',
  enabled: true,
});

// Default test constructor
export const createDefaultTest = (requestId: string): ApiTest => ({
  id: crypto.randomUUID(),
  requestId,
  name: 'Test Suite',
  assertions: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
});
