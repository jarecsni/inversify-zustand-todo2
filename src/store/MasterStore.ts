import { injectable } from "inversify";
import { createStore } from "zustand/vanilla";
import { produce, Draft } from "immer";

// Base interface for entities that can be stored in collections
export interface Identifiable {
  id: string;
}

// Unified interface for both single items and collections - Pure Immer approach
export interface StoreView<T extends Identifiable> {
  // Read operations
  getItem(): T | undefined;
  getItems(): T[];
  getItems(filter: (item: T) => boolean): T[];
  findItem(predicate: (item: T) => boolean): T | undefined;
  subscribe(callback: (items: T[]) => void): () => void;

  // Write operations - ALL use Immer Draft pattern
  setItem(item: T): void;                                           // Replace with complete object
  setItem(item: Omit<T, "id">): T;                                 // Create new with auto-ID
  setItem(updater: (draft: Draft<T>) => void): void;               // Mutate single item (for single-item collections)

  addItem(item: Omit<T, "id">): T;                                 // Create new item
  updateItem(id: string, updater: (draft: Draft<T>) => void): void; // Mutate specific item
  removeItem(id: string): void;                                    // Remove item
  clearItems(): void;                                              // Clear all

  // Batch operations
  updateItems(updater: (draft: Draft<T[]>) => void): void;         // Mutate entire collection
  updateItemsWhere(                                                // Mutate items matching predicate
    predicate: (item: T) => boolean,
    updater: (draft: Draft<T>) => void
  ): void;
}

// Internal state interface for the master store
interface MasterStoreState {
  data: Record<string, any>;
  setData: (key: string, value: any) => void;
  updateData: (key: string, updater: (current: any) => any) => void;
}

// Implementation of unified StoreView that handles both single items and collections
class StoreViewImpl<T extends Identifiable> implements StoreView<T> {
  constructor(private store: any, private key: string) {}

  // Single item operations
  getItem(): T | undefined {
    const items = this.getItems();
    return items[0];
  }

  setItem(item: T): void;
  setItem(item: Omit<T, "id">): T;
  setItem(updater: (draft: Draft<T>) => void): void;
  setItem(itemOrUpdater: T | Omit<T, "id"> | ((draft: Draft<T>) => void)): T | void {
    if (typeof itemOrUpdater === 'function') {
      // Draft updater function
      const currentItems = this.getItems();
      const firstItem = currentItems[0];
      if (firstItem) {
        const updatedItem = produce(firstItem, itemOrUpdater as (draft: Draft<T>) => void);
        this.store.getState().setData(this.key, [updatedItem]);
      }
      return;
    } else if ('id' in itemOrUpdater) {
      // Replace existing item or set as single item
      this.store.getState().setData(this.key, [itemOrUpdater]);
      return;
    } else {
      // Create new item with ID
      const newItem = {
        ...itemOrUpdater,
        id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
      } as T;
      this.store.getState().setData(this.key, [newItem]);
      return newItem;
    }
  }

  // Collection operations
  getItems(): T[];
  getItems(filter: (item: T) => boolean): T[];
  getItems(filter?: (item: T) => boolean): T[] {
    const state = this.store.getState();
    const items: T[] = state.data[this.key] ?? [];
    return filter ? items.filter(filter) : items;
  }

  addItem(item: Omit<T, "id">): T {
    const newItem = {
      ...item,
      id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
    } as T;

    const currentItems = this.getItems();
    const updatedItems = [...currentItems, newItem];
    this.store.getState().setData(this.key, updatedItems);

    return newItem;
  }

  updateItem(id: string, updater: (draft: Draft<T>) => void): void {
    const currentItems = this.getItems();
    const updatedItems = produce(currentItems, draft => {
      const item = draft.find(item => item.id === id);
      if (item) {
        updater(item);
      }
    });
    this.store.getState().setData(this.key, updatedItems);
  }

  removeItem(id: string): void {
    const currentItems = this.getItems();
    const updatedItems = currentItems.filter((item) => item.id !== id);
    this.store.getState().setData(this.key, updatedItems);
  }

  findItem(predicate: (item: T) => boolean): T | undefined {
    const items = this.getItems();
    return items.find(predicate);
  }

  clearItems(): void {
    this.store.getState().setData(this.key, []);
  }

  updateItems(updater: (draft: Draft<T[]>) => void): void {
    const currentItems = this.getItems();
    const updatedItems = produce(currentItems, updater);
    this.store.getState().setData(this.key, updatedItems);
  }

  updateItemsWhere(predicate: (item: T) => boolean, updater: (draft: Draft<T>) => void): void {
    const currentItems = this.getItems();
    const updatedItems = produce(currentItems, draft => {
      draft.forEach((item, index) => {
        // Check predicate on original item structure
        if (predicate(currentItems[index])) {
          updater(item);
        }
      });
    });
    this.store.getState().setData(this.key, updatedItems);
  }

  subscribe(callback: (items: T[]) => void): () => void {
    return this.store.subscribe((state: MasterStoreState) => {
      const items: T[] = state.data[this.key] ?? [];
      callback(items);
    });
  }
}

// Master store that manages all application state
@injectable()
export class MasterStore {
  private store: any; // Temporarily use any to fix the build
  private viewCache = new Map<string, any>(); // Cache for StoreView instances

  constructor() {
    this.store = createStore<MasterStoreState>((set) => ({
      data: {},

      setData: (key: string, value: any) =>
        set((state) => ({
          data: { ...state.data, [key]: value },
        })),

      updateData: (key: string, updater: (current: any) => any) =>
        set((state) => ({
          data: {
            ...state.data,
            [key]: updater(state.data[key]),
          },
        })),
    }));
  }

  // Get a unified view that handles both single items and collections
  getView<T extends Identifiable>(key: string): StoreView<T> {
    // Use cached view if available
    if (this.viewCache.has(key)) {
      return this.viewCache.get(key) as StoreView<T>;
    }

    // Create new view and cache it
    const view = new StoreViewImpl<T>(this.store, key);
    this.viewCache.set(key, view);
    return view;
  }

  // Backward compatibility - alias for getView
  getCollection<T extends Identifiable>(key: string): StoreView<T> {
    return this.getView<T>(key);
  }

  // Get all data (for debugging/testing)
  getAllData(): Record<string, any> {
    return this.store.getState().data;
  }

  // Clear all data (for testing)
  clear(): void {
    // Use the existing setData method to clear each key
    const currentData = this.store.getState().data;
    Object.keys(currentData).forEach((key) => {
      this.store.getState().setData(key, undefined);
    });
    this.viewCache.clear();
  }
}
