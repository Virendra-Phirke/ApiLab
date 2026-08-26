'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { signIn, signUp } from '@/lib/auth-client';
import { LogIn, UserPlus, Eye, EyeOff, Loader2, Zap, Lock, User } from 'lucide-react';
import { toast } from 'sonner';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultMode?: 'signin' | 'signup';
}

export function AuthModal({ open, onOpenChange, defaultMode = 'signin' }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>(defaultMode);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields (Username + Password only)
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setError(null);
    setLoading(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) resetForm();
    onOpenChange(newOpen);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = username.trim();
    if (!cleanUser || !password) {
      setError('Please enter your username and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // First attempt: username signin
      let res = await (signIn as any).username({
        username: cleanUser,
        password,
      });

      // Fallback: email signin with internal domain alias
      if (res?.error) {
        res = await signIn.email({
          email: `${cleanUser.toLowerCase()}@apilab.local`,
          password,
        });
      }

      if (res?.error) {
        setError(res.error.message || 'Invalid username or password.');
        toast.error(res.error.message || 'Sign in failed');
      } else {
        toast.success(`Welcome back, ${cleanUser}!`);
        handleOpenChange(false);
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication service error. Please try again.');
      toast.error('Sign in error');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = username.trim();
    if (!cleanUser || !password) {
      setError('Please enter a username and password.');
      return;
    }

    if (cleanUser.length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await signUp.email({
        email: `${cleanUser.toLowerCase()}@apilab.local`,
        password,
        name: cleanUser,
        username: cleanUser,
      } as any);

      if (res?.error) {
        setError(res.error.message || 'Sign up failed. Username may already be taken.');
        toast.error(res.error.message || 'Sign up failed');
      } else {
        toast.success(`Account created! Welcome to ApiLab, ${cleanUser}.`);
        handleOpenChange(false);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to create account.');
      toast.error('Sign up error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm bg-surface-panel text-foreground border-border/40 p-0 overflow-hidden card-shadow">
        {/* Header Branding Banner */}
        <div className="bg-surface-card p-5 pb-4 border-b border-border/20">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Zap className="h-4 w-4 fill-white" />
            </div>
            <div>
              <DialogTitle className="text-sm font-bold text-foreground">
                {mode === 'signin' ? 'Sign in to ApiLab' : 'Create ApiLab Account'}
              </DialogTitle>
              <DialogDescription className="text-[11px] text-muted-foreground mt-0.5">
                {mode === 'signin'
                  ? 'Access your cloud workspace and saved requests.'
                  : 'Sync your API environments and requests across devices.'}
              </DialogDescription>
            </div>
          </div>

          {/* Mode Switcher Pills */}
          <div className="flex items-center p-0.5 rounded-lg bg-surface-input gap-1 mt-3">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError(null);
              }}
              className={`flex-1 h-7 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                mode === 'signin'
                  ? 'bg-surface-panel text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Sign In</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError(null);
              }}
              className={`flex-1 h-7 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-surface-panel text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Sign Up</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-5 pt-4">
          {error && (
            <div className="mb-3.5 p-2.5 rounded-lg bg-rose-500/10 text-rose-400 text-xs font-medium border border-rose-500/20 flex items-center gap-2">
              <span>⚠</span>
              <span>{error}</span>
            </div>
          )}

          {mode === 'signin' ? (
            /* Sign In Form: Username + Password */
            <form onSubmit={handleSignIn} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Username</label>
                <div className="relative flex items-center">
                  <User className="absolute left-3 h-3.5 w-3.5 text-muted-foreground/60" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    autoFocus
                    required
                    className="w-full h-8.5 pl-9 pr-3 rounded-lg bg-surface-input text-foreground text-xs placeholder:text-muted-foreground/40 outline-none focus:bg-surface-editor card-shadow transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Password</label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3 h-3.5 w-3.5 text-muted-foreground/60" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full h-8.5 pl-9 pr-9 rounded-lg bg-surface-input text-foreground text-xs placeholder:text-muted-foreground/40 outline-none focus:bg-surface-editor card-shadow transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-8.5 mt-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogIn className="h-3.5 w-3.5" />}
                <span>{loading ? 'Signing in...' : 'Sign In'}</span>
              </button>

              <div className="pt-2 text-center text-[11px] text-muted-foreground">
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setError(null);
                  }}
                  className="text-primary font-semibold hover:underline cursor-pointer"
                >
                  Sign Up
                </button>
              </div>
            </form>
          ) : (
            /* Sign Up Form: Username + Password */
            <form onSubmit={handleSignUp} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Username</label>
                <div className="relative flex items-center">
                  <User className="absolute left-3 h-3.5 w-3.5 text-muted-foreground/60" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Choose a username"
                    autoFocus
                    required
                    className="w-full h-8.5 pl-9 pr-3 rounded-lg bg-surface-input text-foreground text-xs placeholder:text-muted-foreground/40 outline-none focus:bg-surface-editor card-shadow transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Password</label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3 h-3.5 w-3.5 text-muted-foreground/60" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    required
                    className="w-full h-8.5 pl-9 pr-9 rounded-lg bg-surface-input text-foreground text-xs placeholder:text-muted-foreground/40 outline-none focus:bg-surface-editor card-shadow transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-8.5 mt-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
                <span>{loading ? 'Creating account...' : 'Create Account'}</span>
              </button>

              <div className="pt-2 text-center text-[11px] text-muted-foreground">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setError(null);
                  }}
                  className="text-primary font-semibold hover:underline cursor-pointer"
                >
                  Sign In
                </button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
