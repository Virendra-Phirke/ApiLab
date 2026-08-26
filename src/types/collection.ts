// Collection - folder of related requests
export interface Collection {
  id: string;
  name: string;
  parentId?: string; // For nested collections
  createdAt: number;
  updatedAt: number;
}

// Default collection constructor
export const createDefaultCollection = (name: string, parentId?: string): Collection => ({
  id: crypto.randomUUID(),
  name,
  parentId,
  createdAt: Date.now(),
  updatedAt: Date.now(),
});
