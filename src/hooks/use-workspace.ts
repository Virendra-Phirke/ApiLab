import { useEffect, useCallback, useState } from 'react';
import { useWorkspaceStore } from '@/store/workspace-store';
import { useSchedulerStore } from '@/store/scheduler-store';
import { db, clearWorkspace, exportWorkspace, importWorkspace } from '@/lib/db';
import { importSchema } from '@/lib/validation';
import { toast } from 'sonner';

export function useWorkspace() {
  const [isInitializing, setIsInitializing] = useState(true);
  const {
    setCollections,
    setRequests,
    setEnvironments,
    setHistory,
    resetActiveRequest,
  } = useWorkspaceStore();

  // Load all initial workspace data from IndexedDB
  const reloadData = useCallback(async () => {
    try {
      const [colls, reqs, envs, hist] = await Promise.all([
        db.collections.toArray(),
        db.requests.toArray(),
        db.environments.toArray(),
        db.history.reverse().limit(100).toArray(),
      ]);

      setCollections(colls);
      setRequests(reqs);
      setEnvironments(envs);
      setHistory(hist);

      // Load DB schedules
      useSchedulerStore.getState().fetchSchedulesFromDb();
    } catch (err) {
      console.error('Failed to load workspace data from IndexedDB:', err);
    } finally {
      setIsInitializing(false);
    }
  }, [setCollections, setRequests, setEnvironments, setHistory]);

  useEffect(() => {
    reloadData();
  }, [reloadData]);

  // Export workspace to JSON file
  const handleExport = useCallback(async () => {
    try {
      const data = await exportWorkspace();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `apilab-workspace-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Workspace exported successfully');
    } catch (err) {
      toast.error('Failed to export workspace');
    }
  }, []);

  // Import workspace from JSON string or file content
  const handleImport = useCallback(
    async (jsonContent: string) => {
      try {
        const raw = JSON.parse(jsonContent);
        const parsed = importSchema.safeParse(raw);

        if (!parsed.success) {
          toast.error('Invalid workspace file format');
          return false;
        }

        await importWorkspace(parsed.data);
        await reloadData();
        toast.success('Workspace imported successfully');
        return true;
      } catch (err) {
        toast.error('Failed to parse import file');
        return false;
      }
    },
    [reloadData]
  );

  // Danger zone: Reset entire workspace
  const handleClear = useCallback(async () => {
    try {
      await clearWorkspace();
      resetActiveRequest();
      await reloadData();
      toast.success('Workspace cleared successfully');
    } catch (err) {
      toast.error('Failed to clear workspace');
    }
  }, [reloadData, resetActiveRequest]);

  return {
    isInitializing,
    reloadData,
    handleExport,
    handleImport,
    handleClear,
  };
}
