import { injectable } from "inversify";
import { createStore } from "zustand/vanilla";
import { produce, Draft } from "immer";

/**
 * Base interface for entities that can be stored in collections.
 * All entities must have a unique string identifier.
 */
export interface Identifiable {
  /** Unique identifier for the entity */
  id: string;
}

/**
 * Unified interface for both single items and collections using pure Immer approach.
 * Provides a consistent API for CRUD operations with structural sharing optimization.
 *
 * @template T - The type of entity being stored, must extend Identifiable
 *
 * @example
 * ```typescript
 * const todoView = masterStore.getView<Todo>('todos');
 *
 * // Add a new todo
 * const newTodo = todoView.addItem({ text: 'Learn TypeScript', completed: false });
 *
 * // Update a todo using Immer draft
 * todoView.updateItem(newTodo.id, (draft) => {
 *   draft.completed = true;
 * });
 * ```
 */
export interface StoreView<T extends Identifiable> {
  // === READ OPERATIONS ===

  /**
   * Get the first item from the collection (for single-item collections).
   * @returns The first item or undefined if collection is empty
   */
  getItem(): T | undefined;

  /**
   * Get all items in the collection.
   * @returns Array of all items in the collection
   */
  getItems(): T[];

  /**
   * Get filtered items from the collection.
   * @param filter - Predicate function to filter items
   * @returns Array of items matching the filter
   */
  getItems(filter: (item: T) => boolean): T[];

  /**
   * Find the first item matching the predicate.
   * @param predicate - Function to test each item
   * @returns First matching item or undefined
   */
  findItem(predicate: (item: T) => boolean): T | undefined;

  /**
   * Subscribe to changes in the collection.
   * @param callback - Function called when collection changes
   * @returns Unsubscribe function
   */
  subscribe(callback: (items: T[]) => void): () => void;

  // === WRITE OPERATIONS (ALL use Immer Draft pattern) ===

  /**
   * Replace with complete object.
   * @param item - Complete item to set
   */
  setItem(item: T): void;

  /**
   * Create new item with auto-generated ID.
   * @param item - Item data without ID
   * @returns The created item with generated ID
   */
  setItem(item: Omit<T, "id">): T;

  /**
   * Mutate single item using Immer draft (for single-item collections).
   * @param updater - Function that mutates the draft
   */
  setItem(updater: (draft: Draft<T>) => void): void;

  /**
   * Create and add a new item to the collection.
   * @param item - Item data without ID (ID will be auto-generated)
   * @returns The created item with generated ID
   */
  addItem(item: Omit<T, "id">): T;

  /**
   * Update a specific item using Immer draft pattern.
   * @param id - ID of the item to update
   * @param updater - Function that mutates the item draft
   */
  updateItem(id: string, updater: (draft: Draft<T>) => void): void;

  /**
   * Remove an item from the collection.
   * @param id - ID of the item to remove
   */
  removeItem(id: string): void;

  /**
   * Clear all items from the collection.
   */
  clearItems(): void;

  // === BATCH OPERATIONS ===

  /**
   * Update the entire collection using Immer draft pattern.
   * @param updater - Function that mutates the entire collection draft
   */
  updateItems(updater: (draft: Draft<T[]>) => void): void;

  /**
   * Update all items matching a predicate using Immer draft pattern.
   * @param predicate - Function to test which items to update
   * @param updater - Function that mutates each matching item draft
   */
  updateItemsWhere(
    predicate: (item: T) => boolean,
    updater: (draft: Draft<T>) => void
  ): void;
}

/**
 * Internal state interface for the master store.
 * Manages the underlying Zustand store state and operations.
 */
interface MasterStoreState {
  /** Key-value storage for all collections */
  data: Record<string, any>;
  /** Set data for a specific key */
  setData: (key: string, value: any) => void;
  /** Update data for a specific key using an updater function */
  updateData: (key: string, updater: (current: any) => any) => void;
}

/**
 * Implementation of unified StoreView that handles both single items and collections.
 * Provides Immer-powered operations with structural sharing optimization.
 *
 * @template T - The type of entity being stored
 */
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

/**
 * Master store that manages all application state using Zustand + Immer.
 *
 * Provides a centralized, type-safe way to manage collections of entities with:
 * - Structural sharing optimization through Immer
 * - Unified API for single items and collections
 * - Automatic ID generation
 * - Subscription-based reactivity
 * - View caching for performance
 *
 * @example
 * ```typescript
 * const masterStore = new MasterStore();
 *
 * // Get a view for todos
 * const todoView = masterStore.getView<Todo>('todos');
 *
 * // Add a todo
 * const newTodo = todoView.addItem({
 *   text: 'Learn Immer',
 *   completed: false,
 *   createdAt: new Date()
 * });
 *
 * // Update with structural sharing
 * todoView.updateItem(newTodo.id, (draft) => {
 *   draft.completed = true;
 * });
 * ```
 */
@injectable()
export class MasterStore {
  /** Internal Zustand store instance */
  private store: any; // Temporarily use any to fix the build
  /** Cache for StoreView instances to avoid recreation */
  private viewCache = new Map<string, any>();

  /**
   * Initialize the master store with Zustand state management.
   */
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

  /**
   * Get a unified view that handles both single items and collections.
   * Views are cached for performance - subsequent calls with the same key return the same instance.
   *
   * @template T - The type of entity, must extend Identifiable
   * @param key - Unique key for the collection/view
   * @returns StoreView instance for the specified key
   */
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

  /**
   * Backward compatibility alias for getView.
   * @deprecated Use getView instead
   */
  getCollection<T extends Identifiable>(key: string): StoreView<T> {
    return this.getView<T>(key);
  }

  /**
   * Get all data from the store (for debugging/testing).
   * @returns All stored data as key-value pairs
   */
  getAllData(): Record<string, any> {
    return this.store.getState().data;
  }

  /**
   * Clear all data from the store (for testing).
   * Removes all collections and clears the view cache.
   */
  clear(): void {
    // Use the existing setData method to clear each key
    const currentData = this.store.getState().data;
    Object.keys(currentData).forEach((key) => {
      this.store.getState().setData(key, undefined);
    });
    this.viewCache.clear();
  }
}
