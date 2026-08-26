import { create } from 'zustand';
import type { ApiRequest } from '@/types/request';
import type { ApiResponse } from '@/types/response';
import type { Collection } from '@/types/collection';
import type { Environment } from '@/types/environment';
import type { HistoryEntry, TestRunResult } from '@/types/test';
import { createDefaultRequest } from '@/types/request';

export type SidebarView = 'collections' | 'history' | 'schedules';
export type SidebarTab = 'collections' | 'history' | 'schedules';
export type MainView = 'request' | 'schedules';

interface WorkspaceState {
  // Main view switcher ('request' builder vs full 'schedules' dashboard)
  mainView: MainView;
  setMainView: (view: MainView) => void;

  // Active request
  activeRequest: ApiRequest;
  activeRequestId: string | null;
  isDirty: boolean;

  // Response
  response: ApiResponse | null;
  isLoading: boolean;

  // Test results
  testResults: TestRunResult | null;

  // Collections & sidebar
  sidebarView: SidebarView;
  sidebarOpen: boolean;
  collections: Collection[];
  requests: ApiRequest[];

  // History
  history: HistoryEntry[];

  // Environments
  environments: Environment[];
  activeEnvironmentId: string | null;

  // Actions
  setActiveRequest: (request: ApiRequest) => void;
  updateActiveRequest: (updates: Partial<ApiRequest>) => void;
  setActiveRequestId: (id: string | null) => void;
  resetActiveRequest: () => void;
  setDirty: (dirty: boolean) => void;

  setResponse: (response: ApiResponse | null) => void;
  setLoading: (loading: boolean) => void;
  setTestResults: (results: TestRunResult | null) => void;

  setSidebarView: (view: SidebarView) => void;
  setSidebarOpen: (open: boolean) => void;

  setCollections: (collections: Collection[]) => void;
  setRequests: (requests: ApiRequest[]) => void;
  setHistory: (history: HistoryEntry[]) => void;

  setEnvironments: (environments: Environment[]) => void;
  setActiveEnvironmentId: (id: string | null) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  // Initial state
  mainView: 'request',
  setMainView: (mainView) => set({ mainView }),

  activeRequest: createDefaultRequest(),
  activeRequestId: null,
  isDirty: false,

  response: null,
  isLoading: false,

  testResults: null,

  sidebarView: 'collections',
  sidebarOpen: true,
  collections: [],
  requests: [],

  history: [],

  environments: [],
  activeEnvironmentId: null,

  // Actions
  setActiveRequest: (request) => set({ activeRequest: request, isDirty: false }),
  updateActiveRequest: (updates) =>
    set((state) => ({
      activeRequest: { ...state.activeRequest, ...updates, updatedAt: Date.now() },
      isDirty: true,
    })),
  setActiveRequestId: (id) => set({ activeRequestId: id }),
  resetActiveRequest: () =>
    set({ activeRequest: createDefaultRequest(), activeRequestId: null, isDirty: false, response: null, testResults: null }),
  setDirty: (dirty) => set({ isDirty: dirty }),

  setResponse: (response) => set({ response }),
  setLoading: (loading) => set({ isLoading: loading }),
  setTestResults: (results) => set({ testResults: results }),

  setSidebarView: (view) => set({ sidebarView: view }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  setCollections: (collections) => set({ collections }),
  setRequests: (requests) => set({ requests }),
  setHistory: (history) => set({ history }),

  setEnvironments: (environments) => set({ environments }),
  setActiveEnvironmentId: (id) => set({ activeEnvironmentId: id }),
}));
