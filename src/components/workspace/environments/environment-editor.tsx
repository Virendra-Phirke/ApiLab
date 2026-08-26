'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, CheckSquare, Square, Eye, EyeOff, ShieldAlert, Layers } from 'lucide-react';
import { useEnvironment } from '@/hooks/use-environment';
import { Environment, EnvironmentVariable } from '@/types/environment';

interface EnvironmentEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EnvironmentEditor({ open, onOpenChange }: EnvironmentEditorProps) {
  const {
    environments,
    activeEnvironmentId,
    setActiveEnvironmentId,
    createEnvironment,
    updateEnvironment,
    deleteEnvironment,
    addVariable,
    updateVariable,
    removeVariable,
  } = useEnvironment();

  const [selectedEnvId, setSelectedEnvId] = useState<string | null>(
    activeEnvironmentId || environments[0]?.id || null
  );
  const [newEnvName, setNewEnvName] = useState('');
  const [showSecrets, setShowSecrets] = useState(false);

  React.useEffect(() => {
    if (!selectedEnvId && environments.length > 0) {
      setSelectedEnvId(environments[0].id);
    }
  }, [environments, selectedEnvId]);

  const currentEnv = environments.find((e) => e.id === selectedEnvId);

  const handleCreateEnv = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEnvName.trim()) return;
    const created = await createEnvironment(newEnvName.trim());
    setSelectedEnvId(created.id);
    setNewEnvName('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-popover/95 backdrop-blur-xl border-border max-h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-4 border-b border-border/60">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Layers className="h-4 w-4 text-primary" />
            <span>Manage Environments & Variables</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 grid grid-cols-[200px_1fr] divide-x divide-border/60 overflow-hidden min-h-[360px]">
          {/* Left: Environment List */}
          <div className="p-3 bg-muted/20 flex flex-col justify-between overflow-y-auto space-y-3">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase px-2">
                Environments
              </span>
              {environments.map((env) => (
                <div
                  key={env.id}
                  onClick={() => setSelectedEnvId(env.id)}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs cursor-pointer transition-colors ${
                    selectedEnvId === env.id
                      ? 'bg-primary text-primary-foreground font-semibold'
                      : 'hover:bg-muted/40 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span className="truncate">{env.name}</span>
                  {selectedEnvId === env.id && environments.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteEnvironment(env.id);
                        setSelectedEnvId(environments.find((x) => x.id !== env.id)?.id || null);
                      }}
                      className="text-primary-foreground/80 hover:text-white"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Create New Env Form */}
            <form onSubmit={handleCreateEnv} className="space-y-2 pt-2 border-t border-border/40">
              <Input
                value={newEnvName}
                onChange={(e) => setNewEnvName(e.target.value)}
                placeholder="New env (e.g. Staging)"
                className="h-7 text-xs bg-background"
              />
              <Button
                type="submit"
                variant="outline"
                size="sm"
                disabled={!newEnvName.trim()}
                className="w-full h-7 text-xs gap-1"
              >
                <Plus className="h-3 w-3" /> Add Env
              </Button>
            </form>
          </div>

          {/* Right: Variables Table */}
          <div className="p-4 flex flex-col overflow-hidden">
            {currentEnv ? (
              <div className="flex-1 flex flex-col space-y-3 overflow-hidden">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-sm">{currentEnv.name}</h4>
                    <p className="text-[11px] text-muted-foreground">
                      Use <code className="text-primary font-mono font-bold">{'{{VARIABLE_NAME}}'}</code> in URLs, headers, and request bodies.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSecrets(!showSecrets)}
                      className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
                    >
                      {showSecrets ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      {showSecrets ? 'Mask' : 'Reveal'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addVariable(currentEnv.id)}
                      className="h-7 text-xs gap-1 border-dashed"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Variable
                    </Button>
                  </div>
                </div>

                {/* Variable rows */}
                <div className="flex-1 overflow-y-auto border rounded-lg divide-y divide-border/60 bg-card/40">
                  <div className="grid grid-cols-[32px_1fr_1fr_90px_36px] px-3 py-2 bg-muted/40 font-mono text-xs font-semibold text-muted-foreground">
                    <div></div>
                    <div>Key</div>
                    <div>Value</div>
                    <div>Type</div>
                    <div></div>
                  </div>

                  {currentEnv.variables.length === 0 ? (
                    <div className="text-center py-10 text-xs text-muted-foreground italic">
                      No variables defined for {currentEnv.name}. Click &quot;Add Variable&quot; to create one.
                    </div>
                  ) : (
                    currentEnv.variables.map((v) => (
                      <div
                        key={v.id}
                        className={`grid grid-cols-[32px_1fr_1fr_90px_36px] items-center px-2 py-1.5 gap-2 text-xs font-mono transition-colors ${
                          !v.enabled ? 'opacity-50' : ''
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            updateVariable(currentEnv.id, v.id, { enabled: !v.enabled })
                          }
                          className="flex items-center justify-center text-muted-foreground hover:text-foreground h-6 w-6"
                        >
                          {v.enabled ? (
                            <CheckSquare className="h-3.5 w-3.5 text-primary" />
                          ) : (
                            <Square className="h-3.5 w-3.5" />
                          )}
                        </button>

                        <Input
                          value={v.key}
                          onChange={(e) =>
                            updateVariable(currentEnv.id, v.id, { key: e.target.value })
                          }
                          placeholder="BASE_URL"
                          className="h-7 font-mono text-xs bg-transparent border-0 focus-visible:ring-1"
                        />

                        <Input
                          type={v.type === 'secret' && !showSecrets ? 'password' : 'text'}
                          value={v.value}
                          onChange={(e) =>
                            updateVariable(currentEnv.id, v.id, { value: e.target.value })
                          }
                          placeholder={v.type === 'secret' ? '••••••••' : 'https://api.example.com'}
                          className="h-7 font-mono text-xs bg-transparent border-0 focus-visible:ring-1"
                        />

                        <Select
                          value={v.type}
                          onValueChange={(val) => {
                            if (val) {
                              updateVariable(currentEnv.id, v.id, { type: val as 'public' | 'secret' });
                            }
                          }}
                        >
                          <SelectTrigger className="h-7 font-mono text-[10px] bg-background">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="public" className="text-xs font-mono">
                              Public
                            </SelectItem>
                            <SelectItem value="secret" className="text-xs font-mono">
                              Secret
                            </SelectItem>
                          </SelectContent>
                        </Select>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeVariable(currentEnv.id, v.id)}
                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground">
                Select or create an environment to manage variables.
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
