import Dexie, { type EntityTable } from 'dexie';
import type { ApiRequest } from '@/types/request';
import type { Collection } from '@/types/collection';
import type { Environment } from '@/types/environment';
import type { ApiTest, HistoryEntry } from '@/types/test';

// Application settings
export interface AppSettings {
  id: string;
  key: string;
  value: string;
}

// Database definition
const db = new Dexie('apiForgeDB') as Dexie & {
  collections: EntityTable<Collection, 'id'>;
  requests: EntityTable<ApiRequest, 'id'>;
  environments: EntityTable<Environment, 'id'>;
  history: EntityTable<HistoryEntry, 'id'>;
  tests: EntityTable<ApiTest, 'id'>;
  settings: EntityTable<AppSettings, 'id'>;
};

// Schema definition with indexes
db.version(1).stores({
  collections: 'id, name, parentId, createdAt',
  requests: 'id, name, collectionId, method, createdAt, updatedAt',
  environments: 'id, name, createdAt',
  history: 'id, requestId, method, url, status, timestamp',
  tests: 'id, requestId, createdAt',
  settings: 'id, key',
});

export { db };

// Helper: clear entire workspace
export async function clearWorkspace(): Promise<void> {
  await db.transaction('rw', [db.collections, db.requests, db.environments, db.history, db.tests, db.settings], async () => {
    await db.collections.clear();
    await db.requests.clear();
    await db.environments.clear();
    await db.history.clear();
    await db.tests.clear();
    await db.settings.clear();
  });
}

// Helper: export workspace as JSON
export async function exportWorkspace(): Promise<object> {
  const [collections, requests, environments, history, tests] = await Promise.all([
    db.collections.toArray(),
    db.requests.toArray(),
    db.environments.toArray(),
    db.history.toArray(),
    db.tests.toArray(),
  ]);

  return {
    version: 1,
    exportedAt: Date.now(),
    collections,
    requests,
    environments,
    history,
    tests,
  };
}

// Helper: import workspace from JSON
export async function importWorkspace(data: {
  collections?: Collection[];
  requests?: ApiRequest[];
  environments?: Environment[];
  history?: HistoryEntry[];
  tests?: ApiTest[];
}): Promise<void> {
  await db.transaction('rw', db.collections, db.requests, db.environments, db.history, db.tests, async () => {
    if (data.collections?.length) await db.collections.bulkPut(data.collections);
    if (data.requests?.length) await db.requests.bulkPut(data.requests);
    if (data.environments?.length) await db.environments.bulkPut(data.environments);
    if (data.history?.length) await db.history.bulkPut(data.history);
    if (data.tests?.length) await db.tests.bulkPut(data.tests);
  });
}
