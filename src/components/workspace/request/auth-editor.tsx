'use client';

import React, { useState } from 'react';
import { AuthConfig, AuthType } from '@/types/request';
import { Eye, EyeOff, ShieldCheck, KeyRound, Lock } from 'lucide-react';

interface AuthEditorProps {
  auth: AuthConfig;
  onChange: (auth: AuthConfig) => void;
}

const AUTH_TYPES: { type: AuthType; label: string }[] = [
  { type: 'none', label: 'No Auth' },
  { type: 'bearer', label: 'Bearer Token' },
  { type: 'basic', label: 'Basic Auth' },
  { type: 'api-key', label: 'API Key' },
];

export function AuthEditor({ auth, onChange }: AuthEditorProps) {
  const [showSecrets, setShowSecrets] = useState(false);

  const handleTypeChange = (type: AuthType) => {
    switch (type) {
      case 'none':
        onChange({ type: 'none' });
        break;
      case 'bearer':
        onChange({
          type: 'bearer',
          bearer: { token: auth.bearer?.token || '' },
        });
        break;
      case 'basic':
        onChange({
          type: 'basic',
          basic: {
            username: auth.basic?.username || '',
            password: auth.basic?.password || '',
          },
        });
        break;
      case 'api-key':
        onChange({
          type: 'api-key',
          apiKey: {
            key: auth.apiKey?.key || 'X-API-Key',
            value: auth.apiKey?.value || '',
            addTo: auth.apiKey?.addTo || 'header',
          },
        });
        break;
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Top Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1 bg-surface-card p-0.5 rounded-lg">
          {AUTH_TYPES.map((t) => (
            <button
              key={t.type}
              type="button"
              onClick={() => handleTypeChange(t.type)}
              className={`text-xs px-2.5 py-1 rounded-md transition-all font-medium ${
                auth.type === t.type
                  ? 'bg-surface-panel text-foreground font-semibold card-shadow'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {auth.type !== 'none' && (
          <button
            type="button"
            onClick={() => setShowSecrets(!showSecrets)}
            className="h-6 px-2 rounded-md bg-surface-card hover:bg-surface-card-hover text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            {showSecrets ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            <span>{showSecrets ? 'Mask' : 'Reveal'}</span>
          </button>
        )}
      </div>

      {/* No Auth */}
      {auth.type === 'none' && (
        <div className="text-center py-12 rounded-xl text-xs text-muted-foreground bg-surface-card/40">
          This request does not use authentication. Select a method above to configure credentials.
        </div>
      )}

      {/* Bearer Token */}
      {auth.type === 'bearer' && (
        <div className="space-y-3 max-w-lg bg-surface-card p-4 rounded-xl card-shadow">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>Bearer Token</span>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-muted-foreground">
              Token Value or {'{{TOKEN}}'}
            </label>
            <input
              type={showSecrets ? 'text' : 'password'}
              value={auth.bearer?.token || ''}
              onChange={(e) =>
                onChange({
                  ...auth,
                  bearer: { token: e.target.value },
                })
              }
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full h-8 px-2.5 rounded-lg bg-surface-input font-mono text-xs text-foreground outline-none focus:bg-surface-editor card-shadow"
            />
            <p className="text-[11px] text-muted-foreground">
              Sent automatically as <code className="text-primary font-mono">Authorization: Bearer &lt;token&gt;</code>
            </p>
          </div>
        </div>
      )}

      {/* Basic Auth */}
      {auth.type === 'basic' && (
        <div className="space-y-3 max-w-lg bg-surface-card p-4 rounded-xl card-shadow">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <Lock className="h-4 w-4 text-primary" />
            <span>Basic Authentication</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground">Username</label>
              <input
                value={auth.basic?.username || ''}
                onChange={(e) =>
                  onChange({
                    ...auth,
                    basic: {
                      username: e.target.value,
                      password: auth.basic?.password || '',
                    },
                  })
                }
                placeholder="admin or {{USER}}"
                className="w-full h-8 px-2.5 rounded-lg bg-surface-input font-mono text-xs text-foreground outline-none focus:bg-surface-editor card-shadow"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground">Password</label>
              <input
                type={showSecrets ? 'text' : 'password'}
                value={auth.basic?.password || ''}
                onChange={(e) =>
                  onChange({
                    ...auth,
                    basic: {
                      username: auth.basic?.username || '',
                      password: e.target.value,
                    },
                  })
                }
                placeholder="••••••••"
                className="w-full h-8 px-2.5 rounded-lg bg-surface-input font-mono text-xs text-foreground outline-none focus:bg-surface-editor card-shadow"
              />
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Base64 encoded and added as <code className="text-primary font-mono">Authorization: Basic &lt;base64&gt;</code>
          </p>
        </div>
      )}

      {/* API Key */}
      {auth.type === 'api-key' && (
        <div className="space-y-3 max-w-lg bg-surface-card p-4 rounded-xl card-shadow">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <KeyRound className="h-4 w-4 text-amber-500" />
            <span>API Key Header / Param</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground">Key Name</label>
              <input
                value={auth.apiKey?.key || ''}
                onChange={(e) =>
                  onChange({
                    ...auth,
                    apiKey: {
                      key: e.target.value,
                      value: auth.apiKey?.value || '',
                      addTo: auth.apiKey?.addTo || 'header',
                    },
                  })
                }
                placeholder="X-API-Key"
                className="w-full h-8 px-2.5 rounded-lg bg-surface-input font-mono text-xs text-foreground outline-none focus:bg-surface-editor card-shadow"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground">Key Value</label>
              <input
                type={showSecrets ? 'text' : 'password'}
                value={auth.apiKey?.value || ''}
                onChange={(e) =>
                  onChange({
                    ...auth,
                    apiKey: {
                      key: auth.apiKey?.key || '',
                      value: e.target.value,
                      addTo: auth.apiKey?.addTo || 'header',
                    },
                  })
                }
                placeholder="key_secret_123"
                className="w-full h-8 px-2.5 rounded-lg bg-surface-input font-mono text-xs text-foreground outline-none focus:bg-surface-editor card-shadow"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
