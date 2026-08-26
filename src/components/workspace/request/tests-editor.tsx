'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Trash2, CheckSquare, Square, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TestAssertion, AssertionType, createDefaultAssertion, ApiTest, createDefaultTest } from '@/types/test';
import { db } from '@/lib/db';
import { useWorkspaceStore } from '@/store/workspace-store';
import { runTests } from '@/lib/test-runner';
import { toast } from 'sonner';

const ASSERTION_TYPES: { type: AssertionType; label: string; hasTarget: boolean; targetPlaceholder?: string; expectedPlaceholder: string }[] = [
  { type: 'status-equals', label: 'Status Code Equals', hasTarget: false, expectedPlaceholder: '200' },
  { type: 'status-not-equals', label: 'Status Code Does Not Equal', hasTarget: false, expectedPlaceholder: '500' },
  { type: 'body-contains', label: 'Body Contains Text', hasTarget: false, expectedPlaceholder: 'token or user' },
  { type: 'body-not-contains', label: 'Body Does Not Contain', hasTarget: false, expectedPlaceholder: 'error or null' },
  { type: 'body-json-path-equals', label: 'JSON Path Equals', hasTarget: true, targetPlaceholder: 'user.id or data[0].name', expectedPlaceholder: '"123" or 456' },
  { type: 'header-exists', label: 'Header Exists', hasTarget: false, expectedPlaceholder: 'Content-Type' },
  { type: 'header-equals', label: 'Header Equals', hasTarget: true, targetPlaceholder: 'Content-Type', expectedPlaceholder: 'application/json' },
  { type: 'response-time-less-than', label: 'Response Time Less Than (ms)', hasTarget: false, expectedPlaceholder: '500' },
];

export function TestsEditor() {
  const { activeRequest, response, setTestResults } = useWorkspaceStore();
  const [test, setTest] = useState<ApiTest | null>(null);

  // Load tests for active request from IndexedDB
  useEffect(() => {
    async function loadTest() {
      const existing = await db.tests.where('requestId').equals(activeRequest.id).first();
      if (existing) {
        setTest(existing);
      } else {
        const newTest = createDefaultTest(activeRequest.id);
        newTest.assertions = [createDefaultAssertion()];
        setTest(newTest);
      }
    }
    loadTest();
  }, [activeRequest.id]);

  const saveTest = async (updated: ApiTest) => {
    setTest(updated);
    await db.tests.put(updated);
  };

  const addAssertion = (type: AssertionType = 'status-equals') => {
    if (!test) return;
    const newAssertion: TestAssertion = {
      id: crypto.randomUUID(),
      type,
      target: type === 'body-json-path-equals' ? 'data.id' : type === 'header-equals' ? 'Content-Type' : undefined,
      expected: type.includes('status') ? '200' : type === 'response-time-less-than' ? '500' : '',
      enabled: true,
    };
    saveTest({ ...test, assertions: [...test.assertions, newAssertion] });
  };

  const updateAssertion = (id: string, updates: Partial<TestAssertion>) => {
    if (!test) return;
    saveTest({
      ...test,
      assertions: test.assertions.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    });
  };

  const deleteAssertion = (id: string) => {
    if (!test) return;
    saveTest({
      ...test,
      assertions: test.assertions.filter((a) => a.id !== id),
    });
  };

  const handleRunTests = () => {
    if (!response) {
      toast.error('Send a request first to run assertions against the response');
      return;
    }
    if (!test || test.assertions.length === 0) {
      toast.error('No test assertions defined');
      return;
    }

    const results = runTests(activeRequest.id, test.id, test.assertions, response);
    setTestResults(results);
    if (results.failCount === 0) {
      toast.success(`All ${results.totalCount} assertions passed!`);
    } else {
      toast.warning(`${results.passCount}/${results.totalCount} assertions passed`);
    }
  };

  const assertions = test?.assertions || [];

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Declarative API Assertions ({assertions.filter((a) => a.enabled).length} active)
          </span>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Safely executed in client sandbox — zero arbitrary server eval()
          </p>
        </div>

        <div className="flex items-center gap-2">
          {response && (
            <Button
              variant="default"
              size="sm"
              onClick={handleRunTests}
              className="h-7 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-xs"
            >
              <Play className="h-3 w-3 fill-white" /> Run Tests
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => addAssertion()}
            className="h-7 text-xs gap-1 bg-surface-card hover:bg-surface-card-hover border-transparent"
          >
            <Plus className="h-3.5 w-3.5" /> Add Assertion
          </Button>
        </div>
      </div>

      {assertions.length === 0 ? (
        <div className="text-center py-10 rounded-xl text-xs text-muted-foreground bg-surface-card/40">
          No assertions defined yet. Click &quot;Add Assertion&quot; to test status codes, response bodies, headers, or execution times.
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden bg-surface-card card-shadow divide-y divide-border/20">
          <div className="grid grid-cols-[36px_220px_1fr_1fr_40px] px-3 py-2 bg-surface-panel font-mono text-xs font-semibold text-muted-foreground">
            <div></div>
            <div>Assertion Type</div>
            <div>Target / Key</div>
            <div>Expected Value</div>
            <div></div>
          </div>

          {assertions.map((assertion) => {
            const typeConfig = ASSERTION_TYPES.find((t) => t.type === assertion.type) || ASSERTION_TYPES[0];

            return (
              <div
                key={assertion.id}
                className={`grid grid-cols-[36px_220px_1fr_1fr_40px] items-center px-2 py-1.5 gap-2 transition-colors ${
                  !assertion.enabled ? 'opacity-50' : ''
                }`}
              >
                <button
                  type="button"
                  onClick={() => updateAssertion(assertion.id, { enabled: !assertion.enabled })}
                  className="flex items-center justify-center text-muted-foreground hover:text-foreground h-7 w-7"
                >
                  {assertion.enabled ? (
                    <CheckSquare className="h-4 w-4 text-primary" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                </button>

                <Select
                  value={assertion.type}
                  onValueChange={(val) => {
                    if (val) {
                      updateAssertion(assertion.id, { type: val as AssertionType });
                    }
                  }}
                >
                  <SelectTrigger className="h-8 font-mono text-xs bg-surface-input border-transparent">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSERTION_TYPES.map((t) => (
                      <SelectItem key={t.type} value={t.type} className="text-xs font-mono">
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {typeConfig.hasTarget ? (
                  <Input
                    value={assertion.target || ''}
                    onChange={(e) => updateAssertion(assertion.id, { target: e.target.value })}
                    placeholder={typeConfig.targetPlaceholder}
                    className="h-8 font-mono text-xs bg-surface-input border-transparent focus-visible:ring-1"
                  />
                ) : (
                  <div className="text-xs font-mono text-muted-foreground/60 px-3 italic select-none">
                    (not required)
                  </div>
                )}

                <Input
                  value={assertion.expected}
                  onChange={(e) => updateAssertion(assertion.id, { expected: e.target.value })}
                  placeholder={typeConfig.expectedPlaceholder}
                  className="h-8 font-mono text-xs bg-surface-input border-transparent focus-visible:ring-1"
                />

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteAssertion(assertion.id)}
                  className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-surface-panel"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
