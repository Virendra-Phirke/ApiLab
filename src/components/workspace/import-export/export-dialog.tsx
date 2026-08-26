'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Database, Layers, History, CheckCircle2 } from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspace-store';
import { useWorkspace } from '@/hooks/use-workspace';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExportDialog({ open, onOpenChange }: ExportDialogProps) {
  const { collections, requests, environments, history } = useWorkspaceStore();
  const { handleExport } = useWorkspace();

  const onConfirm = () => {
    handleExport();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-popover/95 backdrop-blur-xl border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Download className="h-4 w-4 text-primary" />
            <span>Export Workspace Backup</span>
          </DialogTitle>
        </DialogHeader>

        <div className="py-3 space-y-4">
          <p className="text-xs text-muted-foreground">
            Download your full workspace state as an offline JSON snapshot.
          </p>

          <div className="border rounded-xl p-4 bg-muted/20 space-y-2.5 text-xs font-mono">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Database className="h-3.5 w-3.5 text-blue-400" /> Collections
              </span>
              <span className="font-semibold text-foreground">{collections.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Saved Requests
              </span>
              <span className="font-semibold text-foreground">{requests.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Layers className="h-3.5 w-3.5 text-amber-400" /> Environments
              </span>
              <span className="font-semibold text-foreground">{environments.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-muted-foreground">
                <History className="h-3.5 w-3.5 text-purple-400" /> Request History
              </span>
              <span className="font-semibold text-foreground">{history.length}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onConfirm} className="gap-2">
            <Download className="h-4 w-4" /> Download .json
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
