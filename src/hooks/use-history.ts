import { useCallback } from 'react';
import { useWorkspaceStore } from '@/store/workspace-store';
import { db } from '@/lib/db';
import { toast } from 'sonner';

export function useHistory() {
  const { history, setHistory } = useWorkspaceStore();

  const clearHistory = useCallback(async () => {
    try {
      await db.history.clear();
      setHistory([]);
      toast.success('History cleared');
    } catch {
      toast.error('Failed to clear history');
    }
  }, [setHistory]);

  const deleteEntry = useCallback(
    async (id: string) => {
      try {
        await db.history.delete(id);
        setHistory(history.filter((h) => h.id !== id));
        toast.success('History entry removed');
      } catch {
        toast.error('Failed to remove history entry');
      }
    },
    [history, setHistory]
  );

  return {
    history,
    clearHistory,
    deleteEntry,
  };
}
