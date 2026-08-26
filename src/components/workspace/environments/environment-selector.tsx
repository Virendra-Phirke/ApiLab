'use client';

import React, { useState } from 'react';
import { Layers, Settings, ChevronDown, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EnvironmentEditor } from './environment-editor';
import { useEnvironment } from '@/hooks/use-environment';

export function EnvironmentSelector() {
  const [editorOpen, setEditorOpen] = useState(false);
  const { environments, activeEnvironmentId, setActiveEnvironmentId, activeEnvironment } =
    useEnvironment();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <div className="h-7 px-2.5 rounded-md bg-surface-card hover:bg-surface-card-hover flex items-center gap-2 text-xs font-medium cursor-pointer transition-colors card-shadow select-none">
            <Layers className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
            <span className="truncate max-w-[130px] text-foreground/90">
              {activeEnvironment ? activeEnvironment.name : 'No Environment'}
            </span>
            <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
          </div>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-48 bg-surface-card border-0 card-shadow p-1">
          <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Environments
          </div>

          <DropdownMenuItem
            onClick={() => setActiveEnvironmentId(null)}
            className="flex items-center justify-between text-xs cursor-pointer py-1.5 rounded-md hover:bg-surface-card-hover"
          >
            <span>No Environment</span>
            {!activeEnvironmentId && <Check className="h-3 w-3 text-primary" />}
          </DropdownMenuItem>

          {environments.map((env) => (
            <DropdownMenuItem
              key={env.id}
              onClick={() => setActiveEnvironmentId(env.id)}
              className="flex items-center justify-between text-xs cursor-pointer py-1.5 rounded-md hover:bg-surface-card-hover"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="truncate font-medium">{env.name}</span>
                <span className="text-[10px] font-mono text-muted-foreground/70">
                  ({env.variables.filter((v) => v.enabled).length})
                </span>
              </div>
              {activeEnvironmentId === env.id && <Check className="h-3 w-3 text-primary" />}
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator className="bg-white/5" />

          <DropdownMenuItem
            onClick={() => setEditorOpen(true)}
            className="text-xs text-primary font-semibold cursor-pointer gap-2 py-1.5 rounded-md hover:bg-primary/10"
          >
            <Settings className="h-3 w-3" />
            <span>Manage Environments...</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EnvironmentEditor open={editorOpen} onOpenChange={setEditorOpen} />
    </>
  );
}
