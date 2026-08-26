'use client';

import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { HttpMethod, HTTP_METHOD_COLORS } from '@/types/request';
import { ChevronDown } from 'lucide-react';

interface MethodSelectorProps {
  value: HttpMethod;
  onChange: (method: HttpMethod) => void;
}

const METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

export function MethodSelector({ value, onChange }: MethodSelectorProps) {
  const currentColor = HTTP_METHOD_COLORS[value] || HTTP_METHOD_COLORS.GET;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="h-9 px-3 rounded-lg bg-surface-card hover:bg-surface-card-hover flex items-center gap-1.5 font-mono text-xs font-bold transition-all card-shadow shrink-0 select-none cursor-pointer">
        <span style={{ color: currentColor }}>{value}</span>
        <ChevronDown className="h-3 w-3 text-muted-foreground" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-32 bg-surface-card border-0 card-shadow p-1">
        {METHODS.map((method) => {
          const color = HTTP_METHOD_COLORS[method];
          return (
            <DropdownMenuItem
              key={method}
              onClick={() => onChange(method)}
              className="flex items-center justify-between font-mono text-xs font-bold py-1.5 px-2 rounded-md hover:bg-surface-card-hover cursor-pointer"
            >
              <span style={{ color }}>{method}</span>
              {value === method && (
                <span
                  style={{ backgroundColor: color }}
                  className="h-1.5 w-1.5 rounded-full"
                />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
