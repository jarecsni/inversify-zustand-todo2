import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import type { Container } from 'inversify';
import type { MasterStore } from '@/store/MasterStore';
import type { ITodoService } from '../services/ITodoService';
import { configureTodoContainer } from './todo.container';
import { TODO_TYPES } from './todo.types';

/**
 * Context value interface for Todo feature dependency injection.
 */
interface TodoDIContextValue {
  /** Factory function to get TodoService instance */
  getTodoService: () => ITodoService;
  /** Factory function to get MasterStore instance */
  getMasterStore: () => MasterStore;
}

/**
 * React context for Todo feature dependency injection.
 */
const TodoDIContext = createContext<TodoDIContextValue | null>(null);

/**
 * Props for the TodoFeatureProvider component.
 */
interface TodoFeatureProviderProps {
  /** Child components that will have access to Todo DI services */
  children: ReactNode;
  /** Optional existing container to use instead of creating new one */
  container?: Container;
  /** Optional existing MasterStore to reuse */
  masterStore?: MasterStore;
}

/**
 * Self-contained Todo Feature Provider - Zero Configuration Required!
 * 
 * This provider automatically configures all dependencies needed for the Todo feature.
 * No manual DI setup required - just wrap your components and go!
 * 
 * Features:
 * - Automatic container configuration
 * - Optional integration with existing stores/containers
 * - Complete isolation from other features
 * - Ready for npm package extraction
 * 
 * @example
 * ```tsx
 * // Simplest usage - zero configuration
 * <TodoFeatureProvider>
 *   <TodoApp />
 * </TodoFeatureProvider>
 * 
 * // Integration with existing store
 * <TodoFeatureProvider masterStore={myExistingStore}>
 *   <TodoApp />
 * </TodoFeatureProvider>
 * ```
 */
export const TodoFeatureProvider: React.FC<TodoFeatureProviderProps> = ({
  children,
  container: existingContainer,
  masterStore
}) => {
  const container = useMemo(() => {
    return existingContainer || configureTodoContainer(masterStore);
  }, [existingContainer, masterStore]);

  const contextValue = useMemo<TodoDIContextValue>(() => ({
    getTodoService: () => container.get<ITodoService>(TODO_TYPES.TodoService),
    getMasterStore: () => container.get<MasterStore>(TODO_TYPES.MasterStore),
  }), [container]);

  return (
    <TodoDIContext.Provider value={contextValue}>
      {children}
    </TodoDIContext.Provider>
  );
};

/**
 * Hook to access TodoService from Todo feature DI context.
 * 
 * @returns TodoService instance from the feature container
 * @throws Error if used outside TodoFeatureProvider
 */
export const useDITodoService = (): ITodoService => {
  const context = useContext(TodoDIContext);
  if (!context) {
    throw new Error('useDITodoService must be used within a TodoFeatureProvider');
  }
  return context.getTodoService();
};

/**
 * Hook to access MasterStore from Todo feature DI context.
 * 
 * @returns MasterStore instance from the feature container
 * @throws Error if used outside TodoFeatureProvider
 */
export const useDIMasterStore = (): MasterStore => {
  const context = useContext(TodoDIContext);
  if (!context) {
    throw new Error('useDIMasterStore must be used within a TodoFeatureProvider');
  }
  return context.getMasterStore();
};
