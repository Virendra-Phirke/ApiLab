'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Zap,
  ShieldCheck,
  Database,
  Code2,
  Terminal,
  Layers,
  Sparkles,
  ArrowRight,
  Lock,
  Globe,
  KeyRound,
  CheckCircle2,
  Play,
  Copy,
  Check,
  Clock,
  HardDrive,
  Cpu,
} from 'lucide-react';
import { buttonVariants, Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler';

// Interactive demo presets
const DEMO_PRESETS = [
  {
    name: 'Get User List',
    method: 'GET',
    url: 'https://jsonplaceholder.typicode.com/users/1',
    status: 200,
    statusText: 'OK',
    time: '86 ms',
    size: '1.2 KB',
    response: `{
  "id": 1,
  "name": "Leanne Graham",
  "username": "Bret",
  "email": "Sincere@april.biz",
  "address": {
    "street": "Kulas Light",
    "suite": "Apt. 556",
    "city": "Gwenborough",
    "zipcode": "92998-3874"
  },
  "phone": "1-770-736-8031 x56442",
  "website": "hildegard.org"
}`,
  },
  {
    name: 'Create Post',
    method: 'POST',
    url: 'https://jsonplaceholder.typicode.com/posts',
    status: 201,
    statusText: 'Created',
    time: '124 ms',
    size: '412 B',
    response: `{
  "id": 101,
  "title": "ApiLab Testing Engine",
  "body": "Local-first, SSRF-safe request execution",
  "userId": 1
}`,
  },
  {
    name: 'Auth Token',
    method: 'POST',
    url: 'https://api.example.com/oauth/token',
    status: 200,
    statusText: 'OK',
    time: '64 ms',
    size: '320 B',
    response: `{
  "token_type": "Bearer",
  "access_token": "apilab_sec_9948271a...",
  "expires_in": 3600,
  "scope": "read:all write:all"
}`,
  },
];

export default function LandingPage() {
  const [activeDemo, setActiveDemo] = useState(0);
  const [copied, setCopied] = useState(false);

  const current = DEMO_PRESETS[activeDemo];

  const handleCopy = () => {
    navigator.clipboard.writeText(current.response);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative min-h-screen bg-background flex flex-col overflow-hidden">
      {/* Background Decorative Tech Grid & Glow Orbs */}
      <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />
      <div className="absolute top-[-10%] left-[10%] w-[600px] h-[600px] rounded-full bg-blue-600/15 blur-[140px] pointer-events-none" />
      <div className="absolute top-[20%] right-[-5%] w-[700px] h-[700px] rounded-full bg-cyan-500/12 blur-[160px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[25%] w-[600px] h-[600px] rounded-full bg-indigo-600/15 blur-[150px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 via-cyan-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Zap className="h-5 w-5 text-white fill-white" />
            </div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-foreground/60 bg-clip-text text-transparent">
              ApiLab
            </span>
            <Badge variant="outline" className="hidden sm:inline-flex text-[11px] font-mono border-primary/30 text-primary bg-primary/5">
              v1.0 Local-First
            </Badge>
          </div>

          <div className="flex items-center gap-4">
            <AnimatedThemeToggler />
            <Link
              href="/workspace"
              className={buttonVariants({
                className:
                  'rounded-full shadow-lg shadow-primary/25 gap-2 group bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white border-0 font-medium px-5',
              })}
            >
              <span>Launch Workspace</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-6 pt-16 pb-24 flex flex-col items-center text-center">
        {/* Pill Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-xs font-semibold text-primary mb-8 backdrop-blur-md shadow-sm">
          <Sparkles className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
          <span>Zero Authentication • Zero Telemetry • 100% Offline Storage</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight max-w-4xl text-balance leading-[1.1]">
          The Ultimate{' '}
          <span className="bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">
            Local-First API Client
          </span>{' '}
          for Developers
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl text-balance leading-relaxed">
          Craft, execute, inspect, and automate HTTP API requests with zero registration. Built with IndexedDB workspace persistence, Monaco Editor, and SSRF-hardened request execution.
        </p>

        {/* Hero CTA Action Buttons */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/workspace"
            className={buttonVariants({
              size: 'lg',
              className:
                'h-13 px-8 text-base font-semibold rounded-xl shadow-xl shadow-primary/25 gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white border-0 transition-all hover:scale-[1.02]',
            })}
          >
            <Zap className="h-5 w-5 fill-white" />
            Open Workspace
          </Link>

          <a
            href="#live-demo"
            className={buttonVariants({
              size: 'lg',
              variant: 'outline',
              className: 'h-13 px-7 text-base font-medium rounded-xl border-border/80 hover:bg-muted/40 gap-2',
            })}
          >
            <Play className="h-4 w-4 text-cyan-400" />
            Try Live Demo Below
          </a>
        </div>

        {/* Live Interactive Sandbox Preview */}
        <section id="live-demo" className="mt-16 w-full max-w-5xl text-left">
          <div className="rounded-2xl border border-border/70 bg-card/70 backdrop-blur-2xl p-2 shadow-2xl shadow-blue-500/5 relative group">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-blue-500/20 via-cyan-400/20 to-indigo-500/20 blur-xl opacity-60 group-hover:opacity-100 transition duration-1000 -z-10" />

            <div className="rounded-xl bg-card border border-border/50 overflow-hidden">
              {/* Presets Switcher Bar */}
              <div className="p-3 bg-muted/40 border-b border-border/50 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground mr-1">Presets:</span>
                  {DEMO_PRESETS.map((preset, idx) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => setActiveDemo(idx)}
                      className={`text-xs px-3 py-1 rounded-md font-medium transition-all ${
                        activeDemo === idx
                          ? 'bg-primary text-primary-foreground shadow-sm font-semibold'
                          : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <Badge
                    variant="outline"
                    className="font-mono text-xs font-bold border-emerald-500/30 text-emerald-500 bg-emerald-500/10"
                  >
                    ✓ {current.status} {current.statusText}
                  </Badge>
                  <span className="text-xs font-mono text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {current.time}
                  </span>
                  <span className="text-xs font-mono text-muted-foreground flex items-center gap-1">
                    <HardDrive className="h-3 w-3" /> {current.size}
                  </span>
                </div>
              </div>

              {/* URL Bar */}
              <div className="p-3 border-b border-border/50 flex items-center gap-3 bg-muted/10 font-mono text-xs">
                <span
                  className={`px-2.5 py-1 rounded font-bold ${
                    current.method === 'GET'
                      ? 'bg-emerald-500/15 text-emerald-500'
                      : 'bg-blue-500/15 text-blue-500'
                  }`}
                >
                  {current.method}
                </span>
                <span className="flex-1 text-foreground/90 truncate bg-background px-3 py-1.5 rounded border border-border/60">
                  {current.url}
                </span>
                <Link
                  href="/workspace"
                  className={buttonVariants({
                    size: 'sm',
                    className: 'bg-primary text-primary-foreground font-semibold px-4',
                  })}
                >
                  SEND
                </Link>
              </div>

              {/* Response Code Box */}
              <div className="p-4 bg-background/90 relative group/code font-mono text-xs overflow-x-auto min-h-[220px]">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="absolute right-4 top-4 p-1.5 rounded bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
                <pre className="text-foreground/90 leading-relaxed">{current.response}</pre>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Bento Grid */}
        <section id="features" className="mt-32 w-full text-left">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">
              Crafted for Speed, Privacy & Security
            </h2>
            <p className="mt-4 text-muted-foreground text-balance text-base">
              Everything stays in your local browser IndexedDB. Zero cloud telemetry, zero subscription fees.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="rounded-2xl border border-border/60 bg-card/40 p-6 backdrop-blur-md hover:border-primary/40 transition-all hover:translate-y-[-2px] shadow-sm">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 mb-4 shadow-sm">
                <Database className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-lg">IndexedDB Local Persistence</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Your workspace collections, saved requests, environments, and history are stored locally in IndexedDB via Dexie. No remote database, no tracking.
              </p>
            </div>

            {/* Card 2 */}
            <div className="rounded-2xl border border-border/60 bg-card/40 p-6 backdrop-blur-md hover:border-primary/40 transition-all hover:translate-y-[-2px] shadow-sm">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 mb-4 shadow-sm">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-lg">SSRF-Hardened Proxy</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Outbound proxy blocks loopbacks, private RFC 1918 subnets, and cloud metadata with DNS rebinding protection and multi-hop redirect verification.
              </p>
            </div>

            {/* Card 3 */}
            <div className="rounded-2xl border border-border/60 bg-card/40 p-6 backdrop-blur-md hover:border-primary/40 transition-all hover:translate-y-[-2px] shadow-sm">
              <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-500 mb-4 shadow-sm">
                <Code2 className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-lg">Monaco Code Editor</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Full-featured Monaco Editor for JSON, XML, HTML, and raw payloads with syntax highlighting, search, auto-formatting, and folding.
              </p>
            </div>

            {/* Card 4 */}
            <div className="rounded-2xl border border-border/60 bg-card/40 p-6 backdrop-blur-md hover:border-primary/40 transition-all hover:translate-y-[-2px] shadow-sm">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mb-4 shadow-sm">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-lg">Declarative API Testing</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Define status, body JSON path, header, and latency assertions. Safely executed in a declarative sandbox without dangerous server-side eval().
              </p>
            </div>

            {/* Card 5 */}
            <div className="rounded-2xl border border-border/60 bg-card/40 p-6 backdrop-blur-md hover:border-primary/40 transition-all hover:translate-y-[-2px] shadow-sm">
              <div className="h-10 w-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-500 mb-4 shadow-sm">
                <KeyRound className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-lg">Environments & Secret Masking</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Use <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono text-primary">{'{{VAR}}'}</code> in URLs, headers, and request bodies. Secret variables are masked in UI and redacted in server logs.
              </p>
            </div>

            {/* Card 6 */}
            <div className="rounded-2xl border border-border/60 bg-card/40 p-6 backdrop-blur-md hover:border-primary/40 transition-all hover:translate-y-[-2px] shadow-sm">
              <div className="h-10 w-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 mb-4 shadow-sm">
                <Terminal className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-lg">cURL & Workspace JSON Backup</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                Generate production-ready cURL commands with one click. Seamlessly export and restore your entire workspace via standardized JSON.
              </p>
            </div>
          </div>
        </section>

        {/* Speed Keyboard Shortcuts */}
        <section className="mt-24 w-full max-w-4xl border border-border/60 rounded-2xl bg-card/40 p-8 backdrop-blur-md text-left shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Terminal className="h-6 w-6 text-primary" />
            <h3 className="text-xl font-bold">Speed-First Keyboard Shortcuts</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 font-mono text-sm">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/40">
              <span className="text-muted-foreground text-xs">Send Request</span>
              <kbd className="px-2 py-1 rounded bg-muted border border-border text-xs font-semibold">Ctrl + Enter</kbd>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/40">
              <span className="text-muted-foreground text-xs">Save Request</span>
              <kbd className="px-2 py-1 rounded bg-muted border border-border text-xs font-semibold">Ctrl + S</kbd>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/40">
              <span className="text-muted-foreground text-xs">Command Palette</span>
              <kbd className="px-2 py-1 rounded bg-muted border border-border text-xs font-semibold">Ctrl + K</kbd>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/40">
              <span className="text-muted-foreground text-xs">Duplicate Request</span>
              <kbd className="px-2 py-1 rounded bg-muted border border-border text-xs font-semibold">Ctrl + D</kbd>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/40">
              <span className="text-muted-foreground text-xs">Focus URL Bar</span>
              <kbd className="px-2 py-1 rounded bg-muted border border-border text-xs font-semibold">Ctrl + /</kbd>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/40">
              <span className="text-muted-foreground text-xs">Close Modals</span>
              <kbd className="px-2 py-1 rounded bg-muted border border-border text-xs font-semibold">Esc</kbd>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 px-6 text-center text-sm text-muted-foreground bg-background/50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <span className="font-semibold text-foreground">ApiLab</span>
            <span>— Local-First API Testing Platform</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/workspace" className="hover:text-foreground transition-colors">
              Workspace
            </Link>
            <a href="#features" className="hover:text-foreground transition-colors">
              Security
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
