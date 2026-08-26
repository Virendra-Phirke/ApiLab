'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { ResponseMeta } from './response-meta';
import { JsonViewer } from './json-viewer';
import { ResponseHeaders } from './response-headers';
import { TestResults } from './test-results';
import { HtmlPreview } from './html-preview';
import { Copy, Download, Check, Trash2, Send, Loader2 } from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspace-store';
import { formatJson, formatXml } from '@/lib/formatters';
import { toast } from 'sonner';

export function ResponseViewer() {
  const [activeTab, setActiveTab] = useState<'pretty' | 'raw' | 'headers' | 'preview' | 'tests'>('pretty');
  const [copied, setCopied] = useState(false);
  const { response, isLoading, testResults, activeRequest, setResponse, setTestResults } = useWorkspaceStore();

  // Smart Tab Switching based on Method and Content
  useEffect(() => {
    if (response) {
      if (
        activeRequest.method === 'HEAD' ||
        activeRequest.method === 'OPTIONS' ||
        !response.body ||
        response.body.trim() === ''
      ) {
        setActiveTab('headers');
      } else {
        setActiveTab('pretty');
      }
    }
  }, [response, activeRequest.method]);

  const formattedContent = useMemo(() => {
    if (!response?.body) return '';
    const ct = response.contentType.toLowerCase();
    if (ct.includes('json') || response.body.trim().startsWith('{') || response.body.trim().startsWith('[')) {
      return formatJson(response.body);
    }
    if (ct.includes('xml')) {
      return formatXml(response.body);
    }
    return response.body;
  }, [response]);

  const copyBody = () => {
    if (!response?.body) return;
    navigator.clipboard.writeText(response.body);
    setCopied(true);
    toast.success('Response body copied');
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadResponse = () => {
    if (!response?.body) return;
    const blob = new Blob([response.body], {
      type: response.contentType || 'text/plain',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `response-${Date.now()}.${response.contentType.includes('json') ? 'json' : 'txt'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Response downloaded');
  };

  const clearResponse = () => {
    setResponse(null);
    setTestResults(null);
  };

  // 1. Loading State (Skeleton / Shimmer)
  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-surface-panel p-8 space-y-4">
        <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary glow-primary animate-pulse">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
        <div className="text-center space-y-1">
          <h4 className="font-semibold text-xs text-foreground">Executing Request...</h4>
          <p className="text-[11px] text-muted-foreground">
            Awaiting response from destination server
          </p>
        </div>
      </div>
    );
  }

  // 2. Empty State (Raycast / Linear minimal)
  if (!response) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-surface-panel p-8 text-center space-y-3 select-none">
        <div className="h-10 w-10 rounded-xl bg-surface-card flex items-center justify-center text-muted-foreground/50 card-shadow">
          <Send className="h-4 w-4" />
        </div>
        <div className="space-y-1">
          <h4 className="font-semibold text-xs text-foreground/90">No Response</h4>
          <p className="text-[11px] text-muted-foreground max-w-xs leading-relaxed">
            Enter a destination URL and click <strong className="text-primary font-semibold">SEND</strong> or press <kbd className="px-1.5 py-0.5 rounded bg-surface-input font-mono text-[10px] text-muted-foreground">Ctrl+Enter</kbd>.
          </p>
        </div>
      </div>
    );
  }

  const headerCount = Object.keys(response.headers).length;
  const isHtml = response.contentType.toLowerCase().includes('html');

  return (
    <div className="flex flex-col h-full w-full bg-surface-panel text-foreground overflow-hidden">
      {/* 1. Response Header Status Bar (Borderless Surface) */}
      <div className="h-10 px-4 flex items-center justify-between gap-4 bg-surface-panel shrink-0 border-b border-border/20">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Response
          </span>
          <ResponseMeta response={response} />
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1">
          {response.body && (
            <button
              type="button"
              onClick={copyBody}
              className="h-7 w-7 rounded-md hover:bg-surface-card text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
              title="Copy Response Body"
            >
              {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
            </button>
          )}

          {response.body && (
            <button
              type="button"
              onClick={downloadResponse}
              className="h-7 w-7 rounded-md hover:bg-surface-card text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
              title="Download Response File"
            >
              <Download className="h-3 w-3" />
            </button>
          )}

          <button
            type="button"
            onClick={clearResponse}
            className="h-7 w-7 rounded-md hover:bg-surface-card text-muted-foreground hover:text-rose-400 flex items-center justify-center transition-colors cursor-pointer"
            title="Clear Response"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* 2. Response Tabs (Minimal pills without boxed lines) */}
      <div className="px-4 py-1 flex items-center gap-1 bg-surface-panel shrink-0 border-b border-border/20">
        {response.body ? (
          <>
            <button
              type="button"
              onClick={() => setActiveTab('pretty')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'pretty'
                  ? 'bg-surface-card text-foreground font-semibold card-shadow'
                  : 'text-muted-foreground hover:text-foreground hover:bg-surface-card/50'
              }`}
            >
              Pretty
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('raw')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                activeTab === 'raw'
                  ? 'bg-surface-card text-foreground font-semibold card-shadow'
                  : 'text-muted-foreground hover:text-foreground hover:bg-surface-card/50'
              }`}
            >
              Raw
            </button>
          </>
        ) : null}

        <button
          type="button"
          onClick={() => setActiveTab('headers')}
          className={`px-3 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'headers'
              ? 'bg-surface-card text-foreground font-semibold card-shadow'
              : 'text-muted-foreground hover:text-foreground hover:bg-surface-card/50'
          }`}
        >
          <span>Headers</span>
          {headerCount > 0 && (
            <span className="text-[10px] font-mono px-1 py-0 rounded-full bg-surface-input text-muted-foreground">
              {headerCount}
            </span>
          )}
        </button>

        {isHtml && (
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'preview'
                ? 'bg-surface-card text-foreground font-semibold card-shadow'
                : 'text-muted-foreground hover:text-foreground hover:bg-surface-card/50'
            }`}
          >
            Preview
          </button>
        )}

        {testResults && (
          <button
            type="button"
            onClick={() => setActiveTab('tests')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'tests'
                ? 'bg-surface-card text-foreground font-semibold card-shadow'
                : 'text-muted-foreground hover:text-foreground hover:bg-surface-card/50'
            }`}
          >
            <span>Test Results</span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0 rounded-full font-bold ${
                testResults.failCount === 0
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-rose-500/20 text-rose-400'
              }`}
            >
              {testResults.passCount}/{testResults.totalCount}
            </span>
          </button>
        )}
      </div>

      {/* 3. Tab Content Area */}
      <div className="flex-1 overflow-hidden relative p-2 bg-surface-panel">
        <div className="h-full w-full rounded-xl overflow-hidden bg-surface-editor card-shadow">
          {activeTab === 'pretty' && (
            <JsonViewer
              content={formattedContent}
              language={
                response.contentType.toLowerCase().includes('json')
                  ? 'json'
                  : response.contentType.toLowerCase().includes('xml')
                  ? 'xml'
                  : response.contentType.toLowerCase().includes('html')
                  ? 'html'
                  : 'plaintext'
              }
            />
          )}

          {activeTab === 'raw' && <JsonViewer content={response.body} language="plaintext" />}

          {activeTab === 'headers' && (
            <div className="h-full overflow-y-auto p-3">
              <ResponseHeaders headers={response.headers} />
            </div>
          )}

          {isHtml && activeTab === 'preview' && (
            <HtmlPreview htmlContent={response.body} />
          )}

          {activeTab === 'tests' && (
            <div className="h-full overflow-y-auto p-3">
              <TestResults results={testResults} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
