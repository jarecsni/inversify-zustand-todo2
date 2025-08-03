import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import type { Container } from 'inversify';
import type { ITodoService } from '@/services/interfaces/ITodoService';
import type { MasterStore } from '@/store/MasterStore';

/**
 * Context value interface for dependency injection.
 * Provides factory functions for retrieving services from the DI container.
 */
interface DIContextValue {
  /** Factory function to get TodoService instance */
  getTodoService: () => ITodoService;
  /** Factory function to get MasterStore instance */
  getMasterStore: () => MasterStore;
}

/**
 * React context for dependency injection.
 * Provides access to the DI container throughout the component tree.
 */
const DIContext = createContext<DIContextValue | null>(null);

/**
 * Props for the DIProvider component.
 */
interface DIProviderProps {
  /** Child components that will have access to DI services */
  children: ReactNode;
  /** InversifyJS container instance */
  container: Container;
  /** Service type symbols for container resolution */
  serviceTypes: {
    /** Symbol for TodoService binding */
    TodoService: symbol;
    /** Symbol for MasterStore binding */
    MasterStore: symbol;
  };
}

/**
 * Dependency Injection Provider component - completely portable!
 *
 * Provides dependency injection context to React components, making them
 * portable across different applications by externalizing DI configuration.
 *
 * @example
 * ```tsx
 * // App entry point
 * <DIProvider
 *   container={myContainer}
 *   serviceTypes={{
 *     TodoService: TYPES.TodoService,
 *     MasterStore: TYPES.MasterStore,
 *   }}
 * >
 *   <App />
 * </DIProvider>
 * ```
 */
export const DIProvider: React.FC<DIProviderProps> = ({
  children,
  container,
  serviceTypes
}) => {
  const contextValue = useMemo<DIContextValue>(() => ({
    getTodoService: () => container.get<ITodoService>(serviceTypes.TodoService),
    getMasterStore: () => container.get<MasterStore>(serviceTypes.MasterStore),
  }), [container, serviceTypes]);

  return (
    <DIContext.Provider value={contextValue}>
      {children}
    </DIContext.Provider>
  );
};

/**
 * Hook to access TodoService from DI context.
 * Components using this hook are completely portable - no hard-coded dependencies.
 *
 * @returns TodoService instance from the DI container
 * @throws Error if used outside DIProvider
 */
export const useDITodoService = (): ITodoService => {
  const context = useContext(DIContext);
  if (!context) {
    throw new Error('useDITodoService must be used within a DIProvider');
  }
  return context.getTodoService();
};

/**
 * Hook to access MasterStore from DI context.
 * Components using this hook are completely portable - no hard-coded dependencies.
 *
 * @returns MasterStore instance from the DI container
 * @throws Error if used outside DIProvider
 */
export const useDIMasterStore = (): MasterStore => {
  const context = useContext(DIContext);
  if (!context) {
    throw new Error('useDIMasterStore must be used within a DIProvider');
  }
  return context.getMasterStore();
};
