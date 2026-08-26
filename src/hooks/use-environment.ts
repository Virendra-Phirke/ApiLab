import { useCallback } from 'react';
import { useWorkspaceStore } from '@/store/workspace-store';
import { db } from '@/lib/db';
import { Environment, EnvironmentVariable, createDefaultEnvironment, createDefaultVariable } from '@/types/environment';
import { toast } from 'sonner';

export function useEnvironment() {
  const {
    environments,
    activeEnvironmentId,
    setEnvironments,
    setActiveEnvironmentId,
  } = useWorkspaceStore();

  const activeEnvironment = environments.find((e) => e.id === activeEnvironmentId) || null;

  // Create a new environment
  const createEnvironment = useCallback(
    async (name: string) => {
      const newEnv = createDefaultEnvironment(name);
      await db.environments.add(newEnv);
      setEnvironments([...environments, newEnv]);
      setActiveEnvironmentId(newEnv.id);
      toast.success(`Environment "${name}" created`);
      return newEnv;
    },
    [environments, setEnvironments, setActiveEnvironmentId]
  );

  // Update existing environment
  const updateEnvironment = useCallback(
    async (env: Environment) => {
      const updated: Environment = { ...env, updatedAt: Date.now() };
      await db.environments.put(updated);
      setEnvironments(environments.map((e) => (e.id === updated.id ? updated : e)));
    },
    [environments, setEnvironments]
  );

  // Delete an environment
  const deleteEnvironment = useCallback(
    async (id: string) => {
      await db.environments.delete(id);
      const remaining = environments.filter((e) => e.id !== id);
      setEnvironments(remaining);
      if (activeEnvironmentId === id) {
        setActiveEnvironmentId(remaining[0]?.id || null);
      }
      toast.success('Environment deleted');
    },
    [environments, activeEnvironmentId, setEnvironments, setActiveEnvironmentId]
  );

  // Add variable to environment
  const addVariable = useCallback(
    async (envId: string) => {
      const env = environments.find((e) => e.id === envId);
      if (!env) return;

      const newVar = createDefaultVariable();
      const updated: Environment = {
        ...env,
        variables: [...env.variables, newVar],
        updatedAt: Date.now(),
      };
      await updateEnvironment(updated);
    },
    [environments, updateEnvironment]
  );

  // Update variable in environment
  const updateVariable = useCallback(
    async (envId: string, varId: string, updates: Partial<EnvironmentVariable>) => {
      const env = environments.find((e) => e.id === envId);
      if (!env) return;

      const updated: Environment = {
        ...env,
        variables: env.variables.map((v) => (v.id === varId ? { ...v, ...updates } : v)),
        updatedAt: Date.now(),
      };
      await updateEnvironment(updated);
    },
    [environments, updateEnvironment]
  );

  // Remove variable from environment
  const removeVariable = useCallback(
    async (envId: string, varId: string) => {
      const env = environments.find((e) => e.id === envId);
      if (!env) return;

      const updated: Environment = {
        ...env,
        variables: env.variables.filter((v) => v.id !== varId),
        updatedAt: Date.now(),
      };
      await updateEnvironment(updated);
    },
    [environments, updateEnvironment]
  );

  return {
    environments,
    activeEnvironmentId,
    activeEnvironment,
    setActiveEnvironmentId,
    createEnvironment,
    updateEnvironment,
    deleteEnvironment,
    addVariable,
    updateVariable,
    removeVariable,
  };
}
