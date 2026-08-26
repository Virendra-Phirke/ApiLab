'use client';

import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Upload, FileJson, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useWorkspace } from '@/hooks/use-workspace';
import { toast } from 'sonner';

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportDialog({ open, onOpenChange }: ImportDialogProps) {
  const [jsonInput, setJsonInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { handleImport } = useWorkspace();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('File exceeds maximum size of 10 MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setJsonInput(content);
      setError(null);
    };
    reader.readAsText(file);
  };

  const handleProcessImport = async () => {
    if (!jsonInput.trim()) {
      setError('Please paste JSON or upload a workspace file');
      return;
    }

    const success = await handleImport(jsonInput);
    if (success) {
      onOpenChange(false);
      setJsonInput('');
      setError(null);
    } else {
      setError('Validation failed. Please verify the JSON structure.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-surface-panel border-border/40 card-shadow">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Upload className="h-4 w-4 text-primary" />
            <span>Import Workspace Data</span>
          </DialogTitle>
        </DialogHeader>

        <div className="py-3 space-y-4">
          <p className="text-xs text-muted-foreground">
            Import collections, saved requests, environments, and tests from an ApiLab JSON export.
          </p>

          {/* File Upload Trigger */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border/80 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-muted/20 transition-colors"
          >
            <FileJson className="h-8 w-8 text-primary/70 mb-2" />
            <span className="text-xs font-semibold">Click to select .json file</span>
            <span className="text-[11px] text-muted-foreground mt-0.5">Maximum size: 10 MB</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>

          {/* Or Paste Raw JSON */}
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">Or paste workspace JSON:</span>
            <Textarea
              value={jsonInput}
              onChange={(e) => {
                setJsonInput(e.target.value);
                setError(null);
              }}
              placeholder='{ "version": 1, "collections": [ ... ], "requests": [ ... ] }'
              className="font-mono text-xs h-32 bg-card/60 resize-none"
            />
          </div>

          {error && (
            <Alert variant="destructive" className="py-2 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleProcessImport} disabled={!jsonInput.trim()}>
            Import into Workspace
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
