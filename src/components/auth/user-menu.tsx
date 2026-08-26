'use client';

import React, { useState } from 'react';
import { useSession, signOut } from '@/lib/auth-client';
import { AuthModal } from './auth-modal';
import { LogIn, LogOut, User, ShieldCheck } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

export function UserMenu() {
  const { data: session, isPending } = useSession();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
    } catch {
      toast.error('Failed to sign out');
    }
  };

  if (isPending) {
    return (
      <div className="h-7 w-16 rounded-md bg-surface-card animate-pulse shrink-0" />
    );
  }

  if (!session?.user) {
    return (
      <>
        <button
          type="button"
          onClick={() => setAuthModalOpen(true)}
          className="h-7 px-2.5 rounded-md bg-primary hover:bg-primary/90 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shrink-0"
        >
          <LogIn className="h-3 w-3" />
          <span>Sign In</span>
        </button>

        <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
      </>
    );
  }

  const user = session.user;
  const displayName = user.name || (user as any).username || user.email?.split('@')[0] || 'User';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="h-7 px-2 rounded-md bg-surface-card hover:bg-surface-card-hover text-foreground flex items-center gap-2 transition-colors card-shadow cursor-pointer shrink-0"
        >
          <div className="h-5 w-5 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-[10px] font-bold text-white shadow-xs">
            {initial}
          </div>
          <span className="text-xs font-medium max-w-[90px] truncate hidden sm:inline">
            {displayName}
          </span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56 bg-surface-panel text-foreground border-border/40 card-shadow">
        <DropdownMenuLabel className="font-normal p-3 pb-2">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-xs text-foreground">
              <span>{displayName}</span>
              <ShieldCheck className="h-3 w-3 text-primary" />
            </div>
            {user.email && (
              <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
            )}
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator className="bg-border/30" />

        <DropdownMenuItem
          onClick={handleSignOut}
          className="text-xs text-rose-400 focus:bg-rose-500/10 focus:text-rose-400 cursor-pointer flex items-center gap-2 py-2"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
