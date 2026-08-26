'use client';

import React from 'react';
import { TestRunResult } from '@/types/test';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import { formatDuration } from '@/lib/formatters';

interface TestResultsProps {
  results: TestRunResult | null;
}

export function TestResults({ results }: TestResultsProps) {
  if (!results) {
    return (
      <div className="text-center py-12 rounded-xl text-xs text-muted-foreground bg-surface-card/40 m-4">
        No test results yet. Define assertions in the &quot;Tests&quot; tab and send a request.
      </div>
    );
  }

  const allPassed = results.failCount === 0;

  return (
    <div className="p-3 space-y-3">
      {/* Summary Banner */}
      <div
        className={`p-3 rounded-xl flex flex-wrap items-center justify-between gap-3 card-shadow ${
          allPassed
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
        }`}
      >
        <div className="flex items-center gap-2 font-semibold text-sm">
          {allPassed ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          ) : (
            <XCircle className="h-5 w-5 text-rose-500" />
          )}
          <span>
            {allPassed
              ? `All ${results.totalCount} assertions passed!`
              : `${results.failCount} of ${results.totalCount} assertions failed`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant={allPassed ? 'default' : 'destructive'}
            className={`font-mono text-xs ${allPassed ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}
          >
            {results.passCount} / {results.totalCount} Passed
          </Badge>
          <div className="flex items-center gap-1 text-xs font-mono text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>{formatDuration(results.duration)}</span>
          </div>
        </div>
      </div>

      {/* Individual Assertion List */}
      <div className="rounded-xl overflow-hidden bg-surface-card card-shadow divide-y divide-border/20">
        {results.results.map((result, idx) => (
          <div
            key={result.assertion.id || idx}
            className={`p-3 flex items-start gap-3 text-xs font-mono transition-colors ${
              result.passed ? 'hover:bg-emerald-500/5' : 'bg-rose-500/5 hover:bg-rose-500/10'
            }`}
          >
            <div className="mt-0.5">
              {result.passed ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 text-rose-500 shrink-0" />
              )}
            </div>

            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground/90">{result.message}</span>
                <span
                  className={`text-[10px] uppercase font-mono px-1.5 py-0.5 rounded ${
                    result.passed
                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                      : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {result.passed ? 'Pass' : 'Fail'}
                </span>
              </div>

              {result.actual && (
                <div className="text-muted-foreground text-[11px]">
                  Actual received: <span className="text-foreground font-semibold">{result.actual}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
