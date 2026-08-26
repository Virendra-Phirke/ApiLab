'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Settings, Trash2, AlertTriangle, ShieldCheck, HardDrive, CheckCircle2 } from 'lucide-react';
import { useWorkspace } from '@/hooks/use-workspace';
import { LIMITS } from '@/config/limits';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [confirmClear, setConfirmClear] = useState(false);
  const { handleClear } = useWorkspace();

  const onConfirmDeleteAll = async () => {
    await handleClear();
    setConfirmClear(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-surface-card border-0 card-shadow text-foreground p-6 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <Settings className="h-4 w-4 text-primary" />
            <span>Workspace Settings & Security</span>
          </DialogTitle>
        </DialogHeader>

        <div className="py-2 space-y-5">
          {/* Security Checklist Section */}
          <div className="space-y-2.5">
            <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Active Security Guardrails</span>
            </h4>

            <div className="p-3.5 rounded-xl bg-surface-input card-shadow space-y-2 text-xs font-mono">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>HTTPS outbound requests enabled</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>SSRF protection active (RFC 1918 & Loopback blocked)</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Request timeout: {LIMITS.DEFAULT_TIMEOUT / 1000}s</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Maximum response size: {LIMITS.MAX_RESPONSE_BODY / (1024 * 1024)} MB</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Rate limiting active (30 req/min sliding window)</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Sensitive tokens and headers redacted in server logs</span>
              </div>
            </div>
          </div>

          {/* Privacy & Storage */}
          <div className="p-3.5 rounded-xl bg-surface-input card-shadow space-y-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5 font-semibold text-foreground">
              <HardDrive className="h-3.5 w-3.5 text-primary" />
              <span>100% Local IndexedDB Architecture</span>
            </div>
            <p className="leading-relaxed">
              Your collections, environments, and history reside entirely in your browser. Zero tracking, zero cloud telemetry.
            </p>
          </div>

          {/* Danger Zone */}
          <div className="space-y-2.5 pt-2">
            <h4 className="text-[11px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Danger Zone</span>
            </h4>

            {confirmClear ? (
              <div className="p-3.5 rounded-xl bg-rose-500/10 space-y-2.5">
                <p className="text-xs font-semibold text-rose-300">
                  Are you sure? This will delete all local collections, environments, and history.
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={onConfirmDeleteAll}
                    className="h-7 text-xs font-semibold"
                  >
                    Delete Everything
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setConfirmClear(false)}
                    className="h-7 text-xs"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 rounded-xl bg-surface-input card-shadow">
                <div>
                  <div className="text-xs font-semibold text-foreground">Clear Local Workspace</div>
                  <div className="text-[11px] text-muted-foreground">
                    Reset IndexedDB database to fresh clean state.
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setConfirmClear(true)}
                  className="h-7 text-xs font-semibold"
                >
                  <Trash2 className="h-3 w-3 mr-1" /> Clear
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
