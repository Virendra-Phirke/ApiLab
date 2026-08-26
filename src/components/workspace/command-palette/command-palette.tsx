'use client';

import React from 'react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Send,
  Plus,
  FolderPlus,
  Layers,
  Upload,
  Download,
  Trash2,
  Sun,
  Moon,
  Folder,
  FileCode,
} from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspace-store';
import { useRequest } from '@/hooks/use-request';
import { useTheme } from 'next-themes';
import { HTTP_METHOD_COLORS } from '@/types/request';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenImport: () => void;
  onOpenExport: () => void;
  onOpenEnvironments: () => void;
  onOpenSettings: () => void;
}

export function CommandPalette({
  open,
  onOpenChange,
  onOpenImport,
  onOpenExport,
  onOpenEnvironments,
  onOpenSettings,
}: CommandPaletteProps) {
  const { requests, collections, setSidebarView } = useWorkspaceStore();
  const { send, createNew, load } = useRequest();
  const { setTheme, theme } = useTheme();

  const runAction = (action: () => void) => {
    onOpenChange(false);
    action();
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search commands, requests, collections... (Ctrl+K)" />
      <CommandList className="max-h-[360px]">
        <CommandEmpty>No matching results found.</CommandEmpty>

        {/* Core Actions */}
        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => runAction(send)} className="cursor-pointer gap-2">
            <Send className="h-4 w-4 text-primary" />
            <span>Send Active Request</span>
            <kbd className="ml-auto font-mono text-[10px] text-muted-foreground">Ctrl+Enter</kbd>
          </CommandItem>

          <CommandItem onSelect={() => runAction(createNew)} className="cursor-pointer gap-2">
            <Plus className="h-4 w-4 text-emerald-500" />
            <span>Create New Request</span>
          </CommandItem>

          <CommandItem
            onSelect={() => runAction(() => setSidebarView('collections'))}
            className="cursor-pointer gap-2"
          >
            <FolderPlus className="h-4 w-4 text-blue-500" />
            <span>View Collections</span>
          </CommandItem>

          <CommandItem onSelect={() => runAction(onOpenEnvironments)} className="cursor-pointer gap-2">
            <Layers className="h-4 w-4 text-amber-500" />
            <span>Manage Environments & Variables</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Saved Requests */}
        {requests.length > 0 && (
          <CommandGroup heading="Saved Requests">
            {requests.map((req) => {
              const methodColor = HTTP_METHOD_COLORS[req.method] || '#10b981';
              return (
                <CommandItem
                  key={req.id}
                  onSelect={() => runAction(() => load(req.id))}
                  className="cursor-pointer gap-2"
                >
                  <span
                    style={{ color: methodColor }}
                    className="font-mono text-[10px] font-extrabold w-8 shrink-0"
                  >
                    {req.method}
                  </span>
                  <span className="truncate">{req.name || 'Untitled Request'}</span>
                  <span className="ml-auto text-[10px] font-mono text-muted-foreground truncate max-w-[150px]">
                    {req.url}
                  </span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        <CommandSeparator />

        {/* Workspace Management */}
        <CommandGroup heading="Workspace & Tools">
          <CommandItem onSelect={() => runAction(onOpenImport)} className="cursor-pointer gap-2">
            <Upload className="h-4 w-4 text-cyan-500" />
            <span>Import Workspace (.json)</span>
          </CommandItem>

          <CommandItem onSelect={() => runAction(onOpenExport)} className="cursor-pointer gap-2">
            <Download className="h-4 w-4 text-violet-500" />
            <span>Export Workspace (.json)</span>
          </CommandItem>

          <CommandItem
            onSelect={() => runAction(() => setTheme(theme === 'dark' ? 'light' : 'dark'))}
            className="cursor-pointer gap-2"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-amber-500" />
            ) : (
              <Moon className="h-4 w-4 text-cyan-400" />
            )}
            <span>Toggle Dark / Light Theme</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
