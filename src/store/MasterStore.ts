import { injectable } from "inversify";
import { createStore } from "zustand/vanilla";

// Base interface for entities that can be stored in collections
export interface Identifiable {
  id: string;
}

// StoreView interface for typed access to store slices (for single values)
export interface StoreView<T> {
  get(): T;
  set(value: T): void;
  update(updater: (current: T) => T): void;
  subscribe(callback: (value: T) => void): () => void;
}

// CollectionView interface for typed access to collections of entities
export interface CollectionView<T extends Identifiable> {
  // Core collection operations
  getItems(): T[];
  getItems(filter: (item: T) => boolean): T[];
  addItem(item: Omit<T, "id">): T;
  updateItem(id: string, updater: (item: T) => T): void;
  removeItem(id: string): void;
  findItem(predicate: (item: T) => boolean): T | undefined;

  // Reactive subscriptions
  subscribe(callback: (items: T[]) => void): () => void;
}

// Internal state interface for the master store
interface MasterStoreState {
  data: Record<string, any>;
  setData: (key: string, value: any) => void;
  updateData: (key: string, updater: (current: any) => any) => void;
}

// Implementation of StoreView that provides typed access to a store slice
class StoreViewImpl<T> implements StoreView<T> {
  constructor(
    private store: any, // Temporarily use any to fix the build
    private key: string,
    private defaultValue: T
  ) {}

  get(): T {
    const state = this.store.getState();
    return state.data[this.key] ?? this.defaultValue;
  }

  set(value: T): void {
    this.store.getState().setData(this.key, value);
  }

  update(updater: (current: T) => T): void {
    // Get current value with default fallback, then update
    const currentValue = this.get();
    const newValue = updater(currentValue);
    this.set(newValue);
  }

  subscribe(callback: (value: T) => void): () => void {
    return this.store.subscribe((state: MasterStoreState) => {
      const value = state.data[this.key] ?? this.defaultValue;
      callback(value);
    });
  }
}

// Implementation of CollectionView that provides typed access to collections
class CollectionViewImpl<T extends Identifiable> implements CollectionView<T> {
  constructor(private store: any, private key: string) {}

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

  updateItem(id: string, updater: (item: T) => T): void {
    const currentItems = this.getItems();
    const updatedItems = currentItems.map((item) =>
      item.id === id ? updater(item) : item
    );
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
  private viewCache = new Map<string, any>(); // Cache for both StoreView and CollectionView

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

  // Get a typed view into a store slice (for single values)
  getStore<T>(key: string, defaultValue: T): StoreView<T> {
    // Use cached view if available
    if (this.viewCache.has(key)) {
      return this.viewCache.get(key) as StoreView<T>;
    }

    // Create new view and cache it
    const view = new StoreViewImpl(this.store, key, defaultValue);
    this.viewCache.set(key, view);
    return view;
  }

  // Get a typed collection view (for arrays of entities)
  getCollection<T extends Identifiable>(key: string): CollectionView<T> {
    // Use cached view if available
    if (this.viewCache.has(key)) {
      return this.viewCache.get(key) as CollectionView<T>;
    }

    // Create new collection view and cache it
    const view = new CollectionViewImpl<T>(this.store, key);
    this.viewCache.set(key, view);
    return view;
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
