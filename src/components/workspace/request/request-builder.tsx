'use client';

import React, { useState } from 'react';
import { UrlBar } from './url-bar';
import { ParamsEditor } from './params-editor';
import { HeadersEditor } from './headers-editor';
import { BodyEditor } from './body-editor';
import { AuthEditor } from './auth-editor';
import { Save, Plus, Copy, RotateCcw } from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspace-store';
import { useRequest } from '@/hooks/use-request';
import { HttpMethod } from '@/types/request';

export function RequestBuilder() {
  const [activeTab, setActiveTab] = useState<'params' | 'headers' | 'body' | 'auth'>('params');
  const { activeRequest, isLoading } = useWorkspaceStore();
  const { updateActiveRequest, send, save, duplicate, createNew, resetActiveRequest } =
    useRequest();

  const handleMethodChange = (method: HttpMethod) => {
    // Intelligent method response: automatically enable JSON body for POST/PUT/PATCH
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      if (activeRequest.body.type === 'none' || !activeRequest.body.content) {
        updateActiveRequest({
          method,
          body: {
            type: 'json',
            content: '{\n  "name": "Vishal",\n  "email": "vishal@example.com"\n}',
          },
        });
      } else {
        updateActiveRequest({ method });
      }
      setActiveTab('body');
    } else {
      updateActiveRequest({ method });
      if (activeTab === 'body' && activeRequest.body.type === 'none') {
        setActiveTab('params');
      }
    }
  };

  const handleUrlChange = (url: string) => {
    updateActiveRequest({ url });
  };

  const handleNameChange = (name: string) => {
    updateActiveRequest({ name });
  };

  // Count active items
  const activeParamsCount = activeRequest.queryParams.filter((p) => p.enabled && p.key).length;
  const activeHeadersCount = activeRequest.headers.filter((h) => h.enabled && h.key).length;
  const hasBody = activeRequest.body.type !== 'none' && Boolean(activeRequest.body.content);
  const hasAuth = activeRequest.auth.type !== 'none';

  return (
    <div className="flex flex-col h-full w-full bg-surface-panel text-foreground overflow-hidden">
      {/* 1. Request Header Bar (Borderless Surface) */}
      <div className="h-10 px-4 flex items-center justify-between gap-4 bg-surface-panel shrink-0 border-b border-border/20">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Request
          </span>
          <input
            value={activeRequest.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Request Name"
            className="h-7 text-xs font-semibold bg-transparent hover:bg-surface-card focus:bg-surface-input px-2 rounded-md transition-colors outline-none text-foreground flex-1"
          />
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={save}
            className="h-7 px-2.5 rounded-md bg-surface-card hover:bg-surface-card-hover text-xs font-medium text-foreground/90 flex items-center gap-1.5 transition-colors card-shadow cursor-pointer"
            title="Save Request (Ctrl+S)"
          >
            <Save className="h-3 w-3" />
            <span className="hidden sm:inline">Save</span>
          </button>

          <button
            type="button"
            onClick={duplicate}
            className="h-7 w-7 rounded-md hover:bg-surface-card text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
            title="Duplicate (Ctrl+D)"
          >
            <Copy className="h-3 w-3" />
          </button>

          <button
            type="button"
            onClick={createNew}
            className="h-7 w-7 rounded-md hover:bg-surface-card text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
            title="New Request (Ctrl+N)"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={resetActiveRequest}
            className="h-7 w-7 rounded-md hover:bg-surface-card text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
            title="Reset Request"
          >
            <RotateCcw className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* 2. URL Bar */}
      <UrlBar
        method={activeRequest.method}
        url={activeRequest.url}
        isLoading={isLoading}
        onMethodChange={handleMethodChange}
        onUrlChange={handleUrlChange}
        onSend={send}
      />

      {/* 3. Universal Request Tabs (Params | Headers | Body | Auth) */}
      <div className="px-4 py-1 flex items-center gap-1 bg-surface-panel shrink-0 border-b border-border/20">
        <button
          type="button"
          onClick={() => setActiveTab('params')}
          className={`px-3 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'params'
              ? 'bg-surface-card text-foreground font-semibold card-shadow'
              : 'text-muted-foreground hover:text-foreground hover:bg-surface-card/50'
          }`}
        >
          <span>Params</span>
          {activeParamsCount > 0 && (
            <span className="text-[10px] font-mono px-1 py-0 rounded-full bg-primary/20 text-primary">
              {activeParamsCount}
            </span>
          )}
        </button>

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
          {activeHeadersCount > 0 && (
            <span className="text-[10px] font-mono px-1 py-0 rounded-full bg-primary/20 text-primary">
              {activeHeadersCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('body')}
          className={`px-3 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'body'
              ? 'bg-surface-card text-foreground font-semibold card-shadow'
              : 'text-muted-foreground hover:text-foreground hover:bg-surface-card/50'
          }`}
        >
          <span>Body</span>
          {hasBody && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('auth')}
          className={`px-3 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'auth'
              ? 'bg-surface-card text-foreground font-semibold card-shadow'
              : 'text-muted-foreground hover:text-foreground hover:bg-surface-card/50'
          }`}
        >
          <span>Auth</span>
          {hasAuth && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />}
        </button>
      </div>

      {/* 4. Tab Contents */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {activeTab === 'params' && (
          <ParamsEditor
            params={activeRequest.queryParams}
            onChange={(queryParams) => updateActiveRequest({ queryParams })}
          />
        )}

        {activeTab === 'headers' && (
          <HeadersEditor
            headers={activeRequest.headers}
            onChange={(headers) => updateActiveRequest({ headers })}
          />
        )}

        {activeTab === 'body' && (
          <BodyEditor
            body={activeRequest.body}
            onChange={(body) => updateActiveRequest({ body })}
          />
        )}

        {activeTab === 'auth' && (
          <AuthEditor
            auth={activeRequest.auth}
            onChange={(auth) => updateActiveRequest({ auth })}
          />
        )}
      </div>
    </div>
  );
}
