'use client';

import React, { useState, useRef, useCallback } from 'react';
import { WorkspaceSidebar } from '@/components/workspace/sidebar';
import { RequestBuilder } from '@/components/workspace/request/request-builder';
import { ResponseViewer } from '@/components/workspace/response/response-viewer';
import { EnvironmentSelector } from '@/components/workspace/environments/environment-selector';
import { EnvironmentEditor } from '@/components/workspace/environments/environment-editor';
import { ImportDialog } from '@/components/workspace/import-export/import-dialog';
import { ExportDialog } from '@/components/workspace/import-export/export-dialog';
import { SettingsDialog } from '@/components/workspace/settings/settings-dialog';
import { CommandPalette } from '@/components/workspace/command-palette/command-palette';
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler';
import { UserMenu } from '@/components/auth/user-menu';
import { ScheduleDashboard } from '@/components/workspace/scheduler/schedule-dashboard';
import {
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Zap,
  Settings,
} from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspace-store';
import { useWorkspace } from '@/hooks/use-workspace';
import { useRequest } from '@/hooks/use-request';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';

export default function WorkspacePage() {
  const { isInitializing } = useWorkspace();
  const { sidebarOpen, setSidebarOpen, mainView } = useWorkspaceStore();
  const { send, save, duplicate, createNew } = useRequest();

  // Sizing states
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [requestSplitRatio, setRequestSplitRatio] = useState(46); // percentage

  // Dialog States
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [environmentsOpen, setEnvironmentsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Global Keyboard Shortcuts (including Ctrl+Shift+P)
  useKeyboardShortcuts({
    onSend: send,
    onSave: save,
    onNewRequest: createNew,
    onDuplicate: duplicate,
    onCommandPalette: () => setCommandPaletteOpen(true),
  });

  // Sidebar drag resize
  const handleSidebarResizeStart = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = sidebarWidth;

    const onPointerMove = (moveEvent: PointerEvent) => {
      const newWidth = Math.max(200, Math.min(480, startWidth + (moveEvent.clientX - startX)));
      setSidebarWidth(newWidth);
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  }, [sidebarWidth]);

  // Vertical split drag resize
  const containerRef = useRef<HTMLDivElement>(null);
  const handleVerticalResizeStart = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();

    const onPointerMove = (moveEvent: PointerEvent) => {
      const relativeY = moveEvent.clientY - containerRect.top;
      const percentage = (relativeY / containerRect.height) * 100;
      const clamped = Math.max(22, Math.min(78, percentage));
      setRequestSplitRatio(clamped);
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  }, []);

  if (isInitializing) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-app space-y-4">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center animate-pulse glow-primary">
          <Zap className="h-5 w-5 text-white fill-white" />
        </div>
        <div className="text-xs font-mono text-muted-foreground animate-pulse">
          Loading ApiLab Workspace...
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-app text-foreground overflow-hidden select-none">
      {/* Top Workspace Navigation Bar (Borderless Surface Hierarchy) */}
      <header className="h-11 px-3 bg-app flex items-center justify-between gap-3 shrink-0 z-30">
        {/* Left: Sidebar Toggle & Quick Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="h-7 w-7 rounded-md bg-surface-card/60 hover:bg-surface-card text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
            title={sidebarOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
          >
            {sidebarOpen ? (
              <PanelLeftClose className="h-3.5 w-3.5" />
            ) : (
              <PanelLeftOpen className="h-3.5 w-3.5" />
            )}
          </button>

          <span className="text-xs font-semibold text-muted-foreground">Workspace</span>
        </div>

        {/* Center: Command Palette Trigger (Raycast style) */}
        <button
          type="button"
          onClick={() => setCommandPaletteOpen(true)}
          className="flex items-center justify-between gap-4 px-3 py-1 rounded-md bg-surface-card hover:bg-surface-card-hover text-xs text-muted-foreground transition-all w-full max-w-sm card-shadow cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-muted-foreground/70" />
            <span className="text-xs">Search or type a command...</span>
          </div>
          <div className="hidden sm:flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-surface-input text-[10px] font-mono text-muted-foreground font-semibold">
              Ctrl+K
            </kbd>
          </div>
        </button>

        {/* Right: Environment Selector, Theme, Settings & Auth UserMenu */}
        <div className="flex items-center gap-2">
          <EnvironmentSelector />
          <AnimatedThemeToggler />
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="h-7 w-7 rounded-md bg-surface-card/60 hover:bg-surface-card text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
            title="Settings"
          >
            <Settings className="h-3.5 w-3.5" />
          </button>
          <UserMenu />
        </div>
      </header>

      {/* Main Workspace 3-Panel Split Layout (Borderless Surface Hierarchy) */}
      <main className="flex-1 w-full h-[calc(100vh-2.75rem)] min-h-0 min-w-0 overflow-hidden flex flex-row relative p-1.5 gap-1.5 bg-app">
        {/* 1. Left Sidebar Panel */}
        {sidebarOpen && (
          <>
            <aside
              style={{ width: `${sidebarWidth}px` }}
              className="h-full min-h-0 shrink-0 overflow-hidden bg-surface-sidebar rounded-xl flex flex-col z-10 card-shadow"
            >
              <WorkspaceSidebar
                onOpenImport={() => setImportOpen(true)}
                onOpenExport={() => setExportOpen(true)}
                onOpenSettings={() => setSettingsOpen(true)}
                onOpenEnvironments={() => setEnvironmentsOpen(true)}
              />
            </aside>

            {/* Horizontal Resize Drag Handle */}
            <div
              onPointerDown={handleSidebarResizeStart}
              className="w-[3px] h-full cursor-col-resize hover:bg-primary/50 transition-colors shrink-0 z-20"
              title="Drag to resize sidebar"
            />
          </>
        )}

        {/* 2. Right Workspace Area (Schedule Dashboard or Vertical Split Request & Response) */}
        {mainView === 'schedules' ? (
          <ScheduleDashboard />
        ) : (
          <div
            ref={containerRef}
            className="flex-1 h-full min-h-0 min-w-0 flex flex-col overflow-hidden relative gap-1.5"
          >
            {/* Top: Request Builder */}
            <section
              style={{ height: `${requestSplitRatio}%` }}
              className="w-full min-h-[140px] overflow-hidden flex flex-col bg-surface-panel rounded-xl card-shadow"
            >
              <RequestBuilder />
            </section>

            {/* Vertical Resize Drag Handle */}
            <div
              onPointerDown={handleVerticalResizeStart}
              className="h-[3px] w-full cursor-row-resize hover:bg-primary/50 transition-colors shrink-0 z-20 flex items-center justify-center group"
              title="Drag to resize panels"
            >
              <div className="w-8 h-[2px] rounded-full bg-transparent group-hover:bg-primary" />
            </div>

            {/* Bottom: Response Viewer */}
            <section
              style={{ height: `${100 - requestSplitRatio}%` }}
              className="w-full min-h-[140px] overflow-hidden flex flex-col bg-surface-panel rounded-xl card-shadow"
            >
              <ResponseViewer />
            </section>
          </div>
        )}
      </main>

      {/* Global Modals */}
      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        onOpenImport={() => setImportOpen(true)}
        onOpenExport={() => setExportOpen(true)}
        onOpenEnvironments={() => setEnvironmentsOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <ImportDialog open={importOpen} onOpenChange={setImportOpen} />
      <ExportDialog open={exportOpen} onOpenChange={setExportOpen} />
      <EnvironmentEditor open={environmentsOpen} onOpenChange={setEnvironmentsOpen} />
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}
