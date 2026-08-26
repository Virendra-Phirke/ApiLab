'use client';

import React, { useState, useMemo } from 'react';
import {
  Folder,
  FolderOpen,
  Plus,
  MoreVertical,
  Trash2,
  Edit2,
  Copy,
  ChevronRight,
  ChevronDown,
  Search,
  Sparkles,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CollectionDialog } from './collection-dialog';
import { useWorkspaceStore } from '@/store/workspace-store';
import { useRequest } from '@/hooks/use-request';
import { db } from '@/lib/db';
import { Collection, createDefaultCollection } from '@/types/collection';
import { ApiRequest, createDefaultRequest, HTTP_METHOD_COLORS } from '@/types/request';
import { toast } from 'sonner';

export function CollectionTree() {
  const { collections, requests, activeRequestId, setCollections, setRequests } =
    useWorkspaceStore();
  const { load, duplicate } = useRequest();

  const [search, setSearch] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);

  const toggleFolder = (id: string) => {
    setExpandedFolders((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Collection CRUD
  const handleSaveCollection = async (name: string, parentId?: string) => {
    if (editingCollection) {
      const updated = { ...editingCollection, name, updatedAt: Date.now() };
      await db.collections.put(updated);
      setCollections(collections.map((c) => (c.id === updated.id ? updated : c)));
      toast.success('Collection renamed');
    } else {
      const newCol = createDefaultCollection(name, parentId);
      await db.collections.add(newCol);
      setCollections([...collections, newCol]);
      setExpandedFolders((prev) => ({ ...prev, [newCol.id]: true }));
      toast.success(`Collection "${name}" created`);
    }
  };

  const handleDeleteCollection = async (id: string) => {
    await db.collections.delete(id);
    const colRequests = requests.filter((r) => r.collectionId === id);
    for (const req of colRequests) {
      await db.requests.update(req.id, { collectionId: undefined });
    }
    setCollections(collections.filter((c) => c.id !== id));
    setRequests(
      requests.map((r) => (r.collectionId === id ? { ...r, collectionId: undefined } : r))
    );
    toast.success('Collection deleted');
  };

  // Request CRUD
  const handleCreateRequest = async (collectionId?: string, initialData?: Partial<ApiRequest>) => {
    const newReq: ApiRequest = {
      ...createDefaultRequest(),
      name: initialData?.name || 'New Request',
      method: initialData?.method || 'GET',
      url: initialData?.url || '',
      collectionId,
      ...initialData,
    };
    await db.requests.add(newReq);
    setRequests([...requests, newReq]);
    if (collectionId) {
      setExpandedFolders((prev) => ({ ...prev, [collectionId]: true }));
    }
    load(newReq.id);
  };

  const handleDeleteRequest = async (id: string) => {
    await db.requests.delete(id);
    setRequests(requests.filter((r) => r.id !== id));
    toast.success('Request deleted');
  };

  // Sample quick starters
  const addSampleStarter = async () => {
    const col = createDefaultCollection('Weather & Demo API');
    await db.collections.add(col);
    setCollections([...collections, col]);
    setExpandedFolders((prev) => ({ ...prev, [col.id]: true }));

    const r1: ApiRequest = {
      ...createDefaultRequest(),
      name: 'Open-Meteo Weather Forecast',
      method: 'GET',
      url: 'https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&current=temperature_2m,wind_speed_10m',
      queryParams: [
        { id: 'p1', key: 'latitude', value: '52.52', enabled: true },
        { id: 'p2', key: 'longitude', value: '13.41', enabled: true },
        { id: 'p3', key: 'current', value: 'temperature_2m,wind_speed_10m', enabled: true },
      ],
      collectionId: col.id,
    };

    const r2: ApiRequest = {
      ...createDefaultRequest(),
      name: 'Get User Profile',
      method: 'GET',
      url: 'https://jsonplaceholder.typicode.com/users/1',
      collectionId: col.id,
    };

    const r3: ApiRequest = {
      ...createDefaultRequest(),
      name: 'Create Post',
      method: 'POST',
      url: 'https://jsonplaceholder.typicode.com/posts',
      collectionId: col.id,
      body: {
        type: 'json',
        content: '{\n  "title": "ApiLab Testing",\n  "body": "Local-first client",\n  "userId": 1\n}',
      },
    };
    await db.requests.bulkAdd([r1, r2, r3]);
    setRequests([...requests, r1, r2, r3]);
    load(r1.id);
    toast.success('Sample collection added');
  };

  // Filter requests
  const filteredRequests = useMemo(() => {
    if (!search.trim()) return requests;
    const q = search.toLowerCase();
    return requests.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.url.toLowerCase().includes(q) ||
        r.method.toLowerCase().includes(q)
    );
  }, [requests, search]);

  const filteredCollections = useMemo(() => {
    if (!search.trim()) return collections;
    const q = search.toLowerCase();
    return collections.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        filteredRequests.some((r) => r.collectionId === c.id)
    );
  }, [collections, filteredRequests, search]);

  const rootRequests = filteredRequests.filter((r) => !r.collectionId);

  return (
    <div className="flex flex-col h-full overflow-hidden text-foreground">
      {/* Search & Actions Bar */}
      <div className="p-2 space-y-1.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Collections
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setEditingCollection(null);
                setDialogOpen(true);
              }}
              className="h-5 px-1.5 rounded text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-surface-card transition-colors flex items-center gap-1"
            >
              <Plus className="h-2.5 w-2.5" />
              <span>Folder</span>
            </button>
            <button
              type="button"
              onClick={() => handleCreateRequest()}
              className="h-5 px-1.5 rounded text-[10px] font-semibold text-primary hover:bg-primary/10 transition-colors flex items-center gap-1"
            >
              <Plus className="h-2.5 w-2.5" />
              <span>Request</span>
            </button>
          </div>
        </div>

        {/* Search Input (Borderless surface) */}
        <div className="relative">
          <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search collections..."
            className="w-full h-7 text-xs pl-7 pr-2 rounded-md bg-surface-card hover:bg-surface-card-hover text-foreground placeholder:text-muted-foreground/60 focus:bg-surface-input transition-colors outline-none"
          />
        </div>
      </div>

      {/* Tree Content (Borderless) */}
      <div className="flex-1 overflow-y-auto px-1.5 py-1 space-y-0.5">
        {collections.length === 0 && rootRequests.length === 0 && (
          <div className="text-center py-8 px-3 text-xs text-muted-foreground rounded-xl space-y-3 bg-surface-card/40 my-2">
            <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <Folder className="h-3.5 w-3.5" />
            </div>
            <div>
              <p className="font-semibold text-foreground/80">No collections yet</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Organize your endpoints into folders or start with sample requests.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={addSampleStarter}
              className="h-7 text-xs gap-1.5 text-primary hover:bg-primary/10 font-semibold"
            >
              <Sparkles className="h-3 w-3" /> Load Sample Endpoints
            </Button>
          </div>
        )}

        {/* Collections */}
        {filteredCollections.map((collection) => {
          const isExpanded = expandedFolders[collection.id] || !!search.trim();
          const colRequests = filteredRequests.filter((r) => r.collectionId === collection.id);

          return (
            <div key={collection.id} className="space-y-0.5">
              {/* Collection Row */}
              <div className="group flex items-center justify-between px-2 py-1 rounded-md hover:bg-surface-card text-xs font-medium cursor-pointer transition-colors">
                <div
                  className="flex items-center gap-1.5 flex-1 truncate"
                  onClick={() => toggleFolder(collection.id)}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                  )}
                  {isExpanded ? (
                    <FolderOpen className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                  ) : (
                    <Folder className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                  )}
                  <span className="truncate text-foreground/90 font-medium">
                    {collection.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground/60 font-mono ml-0.5">
                    {colRequests.length}
                  </span>
                </div>

                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCreateRequest(collection.id);
                    }}
                    className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-surface-card-hover"
                    title="Add Request to Collection"
                  >
                    <Plus className="h-3 w-3" />
                  </button>

                  <DropdownMenu>
                    <DropdownMenuTrigger className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-surface-card-hover">
                      <MoreVertical className="h-3 w-3" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36 bg-surface-card border-0 card-shadow">
                      <DropdownMenuItem
                        onClick={() => {
                          setEditingCollection(collection);
                          setDialogOpen(true);
                        }}
                        className="text-xs gap-2"
                      >
                        <Edit2 className="h-3.5 w-3.5" /> Rename
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-white/5" />
                      <DropdownMenuItem
                        onClick={() => handleDeleteCollection(collection.id)}
                        className="text-xs gap-2 text-rose-400 focus:text-rose-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Nested Collection Requests with Soft Highlight on Active */}
              {isExpanded && (
                <div className="pl-4 space-y-0.5">
                  {colRequests.map((req) => {
                    const isActive = activeRequestId === req.id;
                    const methodColor =
                      HTTP_METHOD_COLORS[req.method] || '#3b82f6';

                    return (
                      <div
                        key={req.id}
                        onClick={() => load(req.id)}
                        className={`group flex items-center justify-between px-2 py-1 rounded-md text-xs cursor-pointer transition-all ${
                          isActive
                            ? 'bg-surface-card text-foreground font-semibold card-shadow'
                            : 'text-muted-foreground hover:text-foreground hover:bg-surface-card/60'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1 truncate">
                          <span
                            style={{ color: methodColor }}
                            className="font-mono text-[10px] font-bold shrink-0 w-8"
                          >
                            {req.method}
                          </span>
                          <span className="truncate">{req.name}</span>
                        </div>

                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              load(req.id);
                              duplicate();
                            }}
                            className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground"
                            title="Duplicate"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteRequest(req.id);
                            }}
                            className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground hover:text-rose-400"
                            title="Delete"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Root Requests (Not in collection) */}
        {rootRequests.length > 0 && (
          <div className="pt-2 space-y-0.5">
            <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">
              Ungrouped Requests
            </div>
            {rootRequests.map((req) => {
              const isActive = activeRequestId === req.id;
              const methodColor =
                HTTP_METHOD_COLORS[req.method] || '#3b82f6';

              return (
                <div
                  key={req.id}
                  onClick={() => load(req.id)}
                  className={`group flex items-center justify-between px-2 py-1 rounded-md text-xs cursor-pointer transition-all ${
                    isActive
                      ? 'bg-surface-card text-foreground font-semibold card-shadow'
                      : 'text-muted-foreground hover:text-foreground hover:bg-surface-card/60'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1 truncate">
                    <span
                      style={{ color: methodColor }}
                      className="font-mono text-[10px] font-bold shrink-0 w-8"
                    >
                      {req.method}
                    </span>
                    <span className="truncate">{req.name}</span>
                  </div>

                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        load(req.id);
                        duplicate();
                      }}
                      className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRequest(req.id);
                      }}
                      className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground hover:text-rose-400"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <CollectionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        collection={editingCollection}
        onSave={handleSaveCollection}
      />
    </div>
  );
}
