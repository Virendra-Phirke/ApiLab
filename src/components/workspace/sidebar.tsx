'use client';

import React from 'react';
import { CollectionTree } from './collections/collection-tree';
import { HistoryList } from './history/history-list';
import { ScheduledAnalytics } from './scheduler/scheduled-analytics';
import { useWorkspaceStore } from '@/store/workspace-store';
import { useSchedulerStore } from '@/store/scheduler-store';
import { useRequest } from '@/hooks/use-request';
import {
  Folder,
  History,
  Zap,
  Plus,
  Timer,
} from 'lucide-react';
import Link from 'next/link';

interface SidebarProps {
  onOpenImport: () => void;
  onOpenExport: () => void;
  onOpenSettings: () => void;
  onOpenEnvironments: () => void;
}

export function WorkspaceSidebar({
  onOpenImport,
  onOpenExport,
  onOpenSettings,
  onOpenEnvironments,
}: SidebarProps) {
  const { sidebarView, setSidebarView, collections, history } = useWorkspaceStore();
  const { status: schedulerStatus, logs } = useSchedulerStore();
  const { createNew } = useRequest();

  return (
    <aside className="flex flex-col h-full w-full bg-surface-sidebar text-foreground select-none overflow-hidden">
      {/* 1. Header: Logo Branding */}
      <div className="h-11 px-3.5 flex items-center justify-between shrink-0 border-b border-border/30">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="h-6 w-6 rounded-md bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <Zap className="h-3 w-3 fill-white" />
          </div>
          <span className="font-bold text-xs tracking-tight text-foreground">ApiLab</span>
        </Link>

        <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-surface-input text-muted-foreground">
          v1.0
        </span>
      </div>

      {/* 2. New Request Primary Action */}
      <div className="p-2.5 pb-1">
        <button
          type="button"
          onClick={createNew}
          className="w-full h-8 px-2.5 rounded-lg bg-primary text-white font-medium text-xs flex items-center justify-between shadow-sm hover:brightness-105 active:scale-[0.99] transition-all cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Plus className="h-3.5 w-3.5" />
            <span>New Request</span>
          </div>
          <kbd className="text-[10px] font-mono opacity-80">
            Ctrl+N
          </kbd>
        </button>
      </div>

      {/* 3. Segmented Navigation View Switcher (Collections / History / Schedules) */}
      <div className="px-2.5 py-1.5">
        <div className="flex items-center p-0.5 rounded-lg bg-surface-input gap-0.5">
          {/* Collections Tab */}
          <button
            type="button"
            onClick={() => setSidebarView('collections')}
            className={`flex-1 h-6.5 rounded-md text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
              sidebarView === 'collections'
                ? 'bg-surface-panel text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Collections"
          >
            <Folder className="h-3 w-3" />
            <span className="hidden sm:inline">Collections</span>
            {collections.length > 0 && (
              <span className="text-[10px] font-mono opacity-70">
                {collections.length}
              </span>
            )}
          </button>

          {/* History Tab */}
          <button
            type="button"
            onClick={() => setSidebarView('history')}
            className={`flex-1 h-6.5 rounded-md text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
              sidebarView === 'history'
                ? 'bg-surface-panel text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="History"
          >
            <History className="h-3 w-3" />
            <span className="hidden sm:inline">History</span>
            {history.length > 0 && (
              <span className="text-[10px] font-mono opacity-70">
                {history.length}
              </span>
            )}
          </button>

          {/* Schedules & Analytics Tab */}
          <button
            type="button"
            onClick={() => setSidebarView('schedules')}
            className={`flex-1 h-6.5 rounded-md text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer relative ${
              sidebarView === 'schedules'
                ? 'bg-surface-panel text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Schedules & Auto-Runner Telemetry"
          >
            <Timer className="h-3 w-3 text-primary" />
            <span className="hidden sm:inline">Schedules</span>
            {schedulerStatus === 'running' ? (
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
            ) : logs.length > 0 ? (
              <span className="text-[10px] font-mono opacity-70">
                {logs.length}
              </span>
            ) : null}
          </button>
        </div>
      </div>

      {/* 4. Scrollable List Area (Collections / History / Schedules) */}
      <div className="flex-1 overflow-y-auto min-h-0 px-2 py-1">
        {sidebarView === 'collections' ? (
          <CollectionTree />
        ) : sidebarView === 'history' ? (
          <HistoryList />
        ) : (
          <ScheduledAnalytics />
        )}
      </div>

      {/* 5. Bottom Status Footer */}
      <div className="h-9 px-3 flex items-center justify-between border-t border-border/30 shrink-0 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenEnvironments}
            className="hover:text-foreground transition-colors cursor-pointer"
          >
            Environments
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={onOpenSettings}
            className="hover:text-foreground transition-colors cursor-pointer"
          >
            Settings
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onOpenImport}
            className="hover:text-foreground transition-colors cursor-pointer"
            title="Import cURL, Postman, OpenAPI"
          >
            Import
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={onOpenExport}
            className="hover:text-foreground transition-colors cursor-pointer"
            title="Export Collection"
          >
            Export
          </button>
        </div>
      </div>
    </aside>
  );
}
