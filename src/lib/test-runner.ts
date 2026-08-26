import type { ApiResponse } from '@/types/response';
import type { TestAssertion, AssertionResult, TestRunResult } from '@/types/test';

// Run all assertions against a response — NO eval(), NO Function(), fully declarative
export function runTests(
  requestId: string,
  testId: string,
  assertions: TestAssertion[],
  response: ApiResponse
): TestRunResult {
  const startTime = performance.now();

  const results: AssertionResult[] = assertions
    .filter((a) => a.enabled)
    .map((assertion) => runSingleAssertion(assertion, response));

  const duration = performance.now() - startTime;
  const passCount = results.filter((r) => r.passed).length;

  return {
    testId,
    requestId,
    results,
    passCount,
    failCount: results.length - passCount,
    totalCount: results.length,
    duration,
    executedAt: Date.now(),
  };
}

function runSingleAssertion(assertion: TestAssertion, response: ApiResponse): AssertionResult {
  try {
    switch (assertion.type) {
      case 'status-equals':
        return assertStatusEquals(assertion, response);
      case 'status-not-equals':
        return assertStatusNotEquals(assertion, response);
      case 'body-contains':
        return assertBodyContains(assertion, response);
      case 'body-not-contains':
        return assertBodyNotContains(assertion, response);
      case 'body-json-path-equals':
        return assertJsonPathEquals(assertion, response);
      case 'header-exists':
        return assertHeaderExists(assertion, response);
      case 'header-equals':
        return assertHeaderEquals(assertion, response);
      case 'response-time-less-than':
        return assertResponseTimeLessThan(assertion, response);
      default:
        return {
          assertion,
          passed: false,
          message: `Unknown assertion type: ${assertion.type}`,
        };
    }
  } catch (error) {
    return {
      assertion,
      passed: false,
      message: `Assertion error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

function assertStatusEquals(assertion: TestAssertion, response: ApiResponse): AssertionResult {
  const expected = parseInt(assertion.expected, 10);
  return {
    assertion,
    passed: response.status === expected,
    actual: String(response.status),
    message: response.status === expected
      ? `Status is ${expected}`
      : `Expected status ${expected}, got ${response.status}`,
  };
}

function assertStatusNotEquals(assertion: TestAssertion, response: ApiResponse): AssertionResult {
  const expected = parseInt(assertion.expected, 10);
  return {
    assertion,
    passed: response.status !== expected,
    actual: String(response.status),
    message: response.status !== expected
      ? `Status is not ${expected}`
      : `Expected status not to be ${expected}`,
  };
}

function assertBodyContains(assertion: TestAssertion, response: ApiResponse): AssertionResult {
  const contains = response.body.includes(assertion.expected);
  return {
    assertion,
    passed: contains,
    message: contains
      ? `Body contains "${assertion.expected}"`
      : `Body does not contain "${assertion.expected}"`,
  };
}

function assertBodyNotContains(assertion: TestAssertion, response: ApiResponse): AssertionResult {
  const contains = response.body.includes(assertion.expected);
  return {
    assertion,
    passed: !contains,
    message: !contains
      ? `Body does not contain "${assertion.expected}"`
      : `Body contains "${assertion.expected}" (unexpected)`,
  };
}

function assertJsonPathEquals(assertion: TestAssertion, response: ApiResponse): AssertionResult {
  if (!assertion.target) {
    return { assertion, passed: false, message: 'JSON path is required' };
  }

  try {
    const parsed = JSON.parse(response.body);
    const value = getJsonPath(parsed, assertion.target);
    const actual = JSON.stringify(value);
    const passed = actual === assertion.expected || String(value) === assertion.expected;

    return {
      assertion,
      passed,
      actual,
      message: passed
        ? `${assertion.target} equals ${assertion.expected}`
        : `Expected ${assertion.target} to equal ${assertion.expected}, got ${actual}`,
    };
  } catch {
    return {
      assertion,
      passed: false,
      message: 'Failed to parse response body as JSON',
    };
  }
}

function assertHeaderExists(assertion: TestAssertion, response: ApiResponse): AssertionResult {
  const headerName = assertion.expected.toLowerCase();
  const exists = Object.keys(response.headers).some(
    (k) => k.toLowerCase() === headerName
  );

  return {
    assertion,
    passed: exists,
    message: exists
      ? `Header "${assertion.expected}" exists`
      : `Header "${assertion.expected}" not found`,
  };
}

function assertHeaderEquals(assertion: TestAssertion, response: ApiResponse): AssertionResult {
  if (!assertion.target) {
    return { assertion, passed: false, message: 'Header name is required' };
  }

  const headerName = assertion.target.toLowerCase();
  const headerValue = Object.entries(response.headers).find(
    ([k]) => k.toLowerCase() === headerName
  )?.[1];

  const passed = headerValue === assertion.expected;

  return {
    assertion,
    passed,
    actual: headerValue ?? '(not found)',
    message: passed
      ? `Header "${assertion.target}" equals "${assertion.expected}"`
      : `Expected header "${assertion.target}" to equal "${assertion.expected}", got "${headerValue ?? '(not found)'}"`,
  };
}

function assertResponseTimeLessThan(assertion: TestAssertion, response: ApiResponse): AssertionResult {
  const maxMs = parseInt(assertion.expected, 10);
  const actual = response.timing.total;
  const passed = actual < maxMs;

  return {
    assertion,
    passed,
    actual: `${Math.round(actual)}ms`,
    message: passed
      ? `Response time ${Math.round(actual)}ms < ${maxMs}ms`
      : `Response time ${Math.round(actual)}ms >= ${maxMs}ms`,
  };
}

// Simple JSON path resolver (supports dot notation: "user.name", "data[0].id")
function getJsonPath(obj: unknown, path: string): unknown {
  const parts = path.replace(/\[(\d+)\]/g, '.$1').split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}
