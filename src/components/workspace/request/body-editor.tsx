'use client';

import React, { useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { BodyType, RequestBody } from '@/types/request';
import { formatJson, isValidJson } from '@/lib/formatters';
import { Wand2, Plus, Trash2, Copy, Check, Upload, FileCode } from 'lucide-react';
import { useEditorTheme } from '@/hooks/use-editor-theme';
import { toast } from 'sonner';

// Dynamically import Monaco Editor
const Editor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="h-64 flex items-center justify-center bg-surface-editor font-mono text-xs text-muted-foreground rounded-xl">
      Loading Code Editor...
    </div>
  ),
});

interface BodyEditorProps {
  body: RequestBody;
  onChange: (body: RequestBody) => void;
}

const BODY_TYPES: { type: BodyType; label: string }[] = [
  { type: 'none', label: 'None' },
  { type: 'json', label: 'JSON' },
  { type: 'form-data', label: 'Form Data' },
  { type: 'form-urlencoded', label: 'x-www-form-urlencoded' },
  { type: 'text', label: 'Raw' },
  { type: 'xml', label: 'XML' },
  { type: 'binary', label: 'Binary' },
];

const JSON_TEMPLATES = [
  {
    name: 'User Object',
    content: '{\n  "name": "Vishal",\n  "email": "vishal@example.com"\n}',
  },
  {
    name: 'Auth Payload',
    content: '{\n  "username": "{{USER}}",\n  "password": "{{PASSWORD}}"\n}',
  },
  {
    name: 'Pagination',
    content: '{\n  "page": 1,\n  "limit": 20,\n  "filter": "active"\n}',
  },
];

export function BodyEditor({ body, onChange }: BodyEditorProps) {
  const { editorTheme } = useEditorTheme();
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse Form-Urlencoded & Form-Data fields
  const [formFields, setFormFields] = useState<Array<{ id: string; key: string; value: string; type?: 'text' | 'file' }>>(() => {
    if ((body.type === 'form-urlencoded' || body.type === 'form-data') && body.content) {
      try {
        const params = new URLSearchParams(body.content);
        const entries = Array.from(params.entries()).map(([key, value]) => ({
          id: crypto.randomUUID(),
          key,
          value,
          type: 'text' as const,
        }));
        if (entries.length > 0) return entries;
      } catch {
        // fallback
      }
    }
    return [{ id: crypto.randomUUID(), key: '', value: '', type: 'text' }];
  });

  const handleTypeChange = (newType: BodyType) => {
    let initialContent = body.content;
    if (newType === 'none') {
      initialContent = '';
    } else if (newType === 'json' && (!body.content || body.content.trim() === '')) {
      initialContent = '{\n  "name": "Vishal",\n  "email": "vishal@example.com"\n}';
    } else if (newType === 'xml' && (!body.content || body.content.trim() === '')) {
      initialContent = '<request>\n  <name>Vishal</name>\n</request>';
    }
    onChange({ type: newType, content: initialContent });
  };

  const handleContentChange = (value: string | undefined) => {
    onChange({ ...body, content: value || '' });
  };

  const handleFormatJson = () => {
    if (body.type === 'json' && body.content) {
      const formatted = formatJson(body.content);
      onChange({ ...body, content: formatted });
      toast.success('JSON formatted');
    }
  };

  const handleCopyBody = () => {
    if (!body.content) return;
    navigator.clipboard.writeText(body.content);
    setCopied(true);
    toast.success('Body copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  // Form Fields management
  const updateFormField = (id: string, updates: Partial<{ key: string; value: string; type?: 'text' | 'file' }>) => {
    const updated = formFields.map((f) => (f.id === id ? { ...f, ...updates } : f));
    
    // Auto-append next empty row
    const last = updated[updated.length - 1];
    if (last && (last.key || last.value)) {
      updated.push({ id: crypto.randomUUID(), key: '', value: '', type: 'text' });
    }
    
    setFormFields(updated);

    // Serialize to URLSearchParams or JSON representation
    const params = new URLSearchParams();
    updated.forEach((f) => {
      if (f.key) params.append(f.key, f.value);
    });
    onChange({ ...body, content: params.toString() });
  };

  const deleteFormField = (id: string) => {
    const filtered = formFields.filter((f) => f.id !== id);
    const finalFields = filtered.length === 0 ? [{ id: crypto.randomUUID(), key: '', value: '', type: 'text' as const }] : filtered;
    setFormFields(finalFields);

    const params = new URLSearchParams();
    finalFields.forEach((f) => {
      if (f.key) params.append(f.key, f.value);
    });
    onChange({ ...body, content: params.toString() });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      onChange({
        type: 'binary',
        content: `[File: ${file.name} (${Math.round(file.size / 1024)} KB)]`,
      });
      toast.success(`Attached ${file.name}`);
    };
    reader.readAsArrayBuffer(file);
  };

  const isJsonInvalid = body.type === 'json' && body.content.trim().length > 0 && !isValidJson(body.content);

  return (
    <div className="p-3 space-y-2.5">
      {/* 1. Body Type Segmented Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-0.5 bg-surface-card p-0.5 rounded-lg overflow-x-auto">
          {BODY_TYPES.map((t) => (
            <button
              key={t.type}
              type="button"
              onClick={() => handleTypeChange(t.type)}
              className={`text-xs px-2.5 py-1 rounded-md transition-all font-medium whitespace-nowrap cursor-pointer ${
                body.type === t.type
                  ? 'bg-surface-panel text-foreground font-semibold card-shadow'
                  : 'text-muted-foreground hover:text-foreground hover:bg-surface-panel/40'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Action Controls for JSON */}
        {body.type === 'json' && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleFormatJson}
              className="h-6 px-2 rounded-md bg-surface-card hover:bg-surface-card-hover text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Wand2 className="h-3 w-3" />
              <span>Beautify</span>
            </button>

            <button
              type="button"
              onClick={handleCopyBody}
              className="h-6 px-2 rounded-md bg-surface-card hover:bg-surface-card-hover text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors cursor-pointer"
            >
              {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        )}
      </div>

      {/* JSON Quick Template Presets */}
      {body.type === 'json' && (
        <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] text-muted-foreground">
          <span className="text-[10px] text-muted-foreground/60 mr-1">Templates:</span>
          {JSON_TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.name}
              type="button"
              onClick={() => onChange({ type: 'json', content: tmpl.content })}
              className="px-2 py-0.5 rounded bg-surface-card hover:bg-surface-card-hover text-foreground/90 transition-colors font-mono text-[10px] cursor-pointer"
            >
              + {tmpl.name}
            </button>
          ))}
        </div>
      )}

      {/* 2. Content Editors */}
      {body.type === 'none' ? (
        <div className="text-center py-8 rounded-xl text-xs text-muted-foreground bg-surface-card/40 flex flex-col items-center justify-center gap-2">
          <span>This request has no body payload.</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleTypeChange('json')}
              className="px-2.5 py-1 rounded-md bg-primary/15 text-primary hover:bg-primary/25 font-semibold transition-colors cursor-pointer"
            >
              + Add JSON Body
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('form-urlencoded')}
              className="px-2.5 py-1 rounded-md bg-surface-card hover:bg-surface-card-hover text-foreground transition-colors cursor-pointer"
            >
              + Add Form Data
            </button>
          </div>
        </div>
      ) : body.type === 'form-urlencoded' || body.type === 'form-data' ? (
        <div className="space-y-1.5">
          {formFields.map((field, idx) => (
            <div
              key={field.id || idx}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-card hover:bg-surface-card-hover card-shadow transition-all"
            >
              <input
                value={field.key}
                onChange={(e) => updateFormField(field.id, { key: e.target.value })}
                placeholder="Key (e.g. email)"
                className="h-7 font-mono text-xs bg-transparent text-foreground placeholder:text-muted-foreground/40 outline-none flex-1 px-1"
              />
              <input
                value={field.value}
                onChange={(e) => updateFormField(field.id, { value: e.target.value })}
                placeholder="Value (e.g. user@example.com)"
                className="h-7 font-mono text-xs bg-transparent text-foreground placeholder:text-muted-foreground/40 outline-none flex-1 px-1"
              />
              {formFields.length > 1 && (
                <button
                  type="button"
                  onClick={() => deleteFormField(field.id)}
                  className="text-muted-foreground hover:text-rose-500 h-6 w-6 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : body.type === 'binary' ? (
        <div className="p-6 rounded-xl bg-surface-card text-center space-y-3 card-shadow">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileUpload}
            className="hidden"
          />
          <div className="h-10 w-10 mx-auto rounded-xl bg-primary/20 flex items-center justify-center text-primary">
            <Upload className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-foreground">Select File for Binary Payload</h4>
            <p className="text-[11px] font-mono text-muted-foreground mt-1">
              {body.content ? body.content : 'No file selected'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:brightness-105 transition-all cursor-pointer"
          >
            Browse File...
          </button>
        </div>
      ) : (
        /* Monaco Editor for JSON, XML, Text */
        <div className="rounded-xl overflow-hidden bg-surface-editor p-2 card-shadow relative">
          <div className="h-52 w-full">
            <Editor
              key={editorTheme}
              height="100%"
              language={body.type === 'json' ? 'json' : body.type === 'xml' ? 'xml' : 'plaintext'}
              theme={editorTheme}
              onMount={(_editor, monaco) => {
                monaco.editor.setTheme(editorTheme);
              }}
              value={body.content}
              onChange={handleContentChange}
              options={{
                minimap: { enabled: false },
                fontSize: 12.5,
                fontFamily: 'var(--font-mono), monospace',
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                automaticLayout: true,
                tabSize: 2,
                lineNumbers: 'on',
                renderLineHighlight: 'line',
                padding: { top: 6, bottom: 6 },
              }}
            />
          </div>

          {isJsonInvalid && (
            <div className="mt-2 p-2 rounded-md bg-rose-500/10 text-rose-400 text-xs font-mono">
              ⚠ Invalid JSON syntax. Check brackets, quotes, and commas.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
