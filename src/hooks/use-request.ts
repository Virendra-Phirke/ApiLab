import { useCallback } from 'react';
import { useWorkspaceStore } from '@/store/workspace-store';
import { db } from '@/lib/db';
import { sendRequest as executeHttpRequest } from '@/lib/http-client';
import { runTests } from '@/lib/test-runner';
import { createDefaultRequest, ApiRequest } from '@/types/request';
import { HistoryEntry } from '@/types/test';
import { toast } from 'sonner';

export function useRequest() {
  const {
    activeRequest,
    activeRequestId,
    environments,
    activeEnvironmentId,
    setActiveRequest,
    updateActiveRequest,
    setActiveRequestId,
    resetActiveRequest,
    setResponse,
    setLoading,
    setTestResults,
    requests,
    setRequests,
    history,
    setHistory,
  } = useWorkspaceStore();

  const activeEnvironment = environments.find((e) => e.id === activeEnvironmentId);

  // Send the active request
  const send = useCallback(async () => {
    if (!activeRequest.url.trim()) {
      toast.error('Please enter a request URL');
      return;
    }

    setLoading(true);
    setResponse(null);
    setTestResults(null);

    try {
      const response = await executeHttpRequest({
        request: activeRequest,
        environmentVariables: activeEnvironment?.variables || [],
      });

      setResponse(response);

      // Record in history
      const historyEntry: HistoryEntry = {
        id: crypto.randomUUID(),
        requestId: activeRequest.id,
        method: activeRequest.method,
        url: activeRequest.url,
        status: response.status,
        statusText: response.statusText,
        duration: Math.round(response.timing.total),
        size: response.size,
        timestamp: Date.now(),
      };

      await db.history.add(historyEntry);
      setHistory([historyEntry, ...history]);

      // Run tests if any are attached
      const tests = await db.tests.where('requestId').equals(activeRequest.id).toArray();
      if (tests.length > 0) {
        const primaryTest = tests[0];
        if (primaryTest.assertions.length > 0) {
          const testResults = runTests(
            activeRequest.id,
            primaryTest.id,
            primaryTest.assertions,
            response
          );
          setTestResults(testResults);
          if (testResults.failCount === 0) {
            toast.success(`All ${testResults.totalCount} tests passed!`);
          } else {
            toast.warning(`${testResults.passCount}/${testResults.totalCount} tests passed`);
          }
        }
      }

      if (response.status >= 200 && response.status < 300) {
        toast.success(`${response.status} ${response.statusText} (${Math.round(response.timing.total)}ms)`);
      } else if (response.status >= 400) {
        toast.error(`${response.status} ${response.statusText || 'Error'}`);
      } else if (response.error) {
        toast.error(response.error);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send request';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [activeRequest, activeEnvironment, history, setHistory, setLoading, setResponse, setTestResults]);

  // Save current request to IndexedDB
  const save = useCallback(async () => {
    try {
      const reqToSave: ApiRequest = {
        ...activeRequest,
        updatedAt: Date.now(),
      };

      await db.requests.put(reqToSave);

      // Update state
      const existingIndex = requests.findIndex((r) => r.id === reqToSave.id);
      if (existingIndex >= 0) {
        const updated = [...requests];
        updated[existingIndex] = reqToSave;
        setRequests(updated);
      } else {
        setRequests([...requests, reqToSave]);
      }

      setActiveRequest(reqToSave);
      setActiveRequestId(reqToSave.id);
      toast.success('Request saved to workspace');
    } catch (err) {
      toast.error('Failed to save request');
    }
  }, [activeRequest, requests, setActiveRequest, setActiveRequestId, setRequests]);

  // Duplicate the active request
  const duplicate = useCallback(async () => {
    const duplicated: ApiRequest = {
      ...activeRequest,
      id: crypto.randomUUID(),
      name: `${activeRequest.name} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await db.requests.add(duplicated);
    setRequests([...requests, duplicated]);
    setActiveRequest(duplicated);
    setActiveRequestId(duplicated.id);
    toast.success('Request duplicated');
  }, [activeRequest, requests, setActiveRequest, setActiveRequestId, setRequests]);

  // Create a brand new request
  const createNew = useCallback(() => {
    const newReq = createDefaultRequest();
    setActiveRequest(newReq);
    setActiveRequestId(null);
    setResponse(null);
    setTestResults(null);
  }, [setActiveRequest, setActiveRequestId, setResponse, setTestResults]);

  // Load a request by ID
  const load = useCallback(
    async (id: string) => {
      const req = await db.requests.get(id);
      if (req) {
        setActiveRequest(req);
        setActiveRequestId(req.id);
        setResponse(null);
        setTestResults(null);
      }
    },
    [setActiveRequest, setActiveRequestId, setResponse, setTestResults]
  );

  return {
    activeRequest,
    activeRequestId,
    updateActiveRequest,
    send,
    save,
    duplicate,
    createNew,
    load,
    resetActiveRequest,
  };
}
