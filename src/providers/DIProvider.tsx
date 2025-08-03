import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import type { Container } from 'inversify';
import type { ITodoService } from '@/services/interfaces/ITodoService';
import type { MasterStore } from '@/store/MasterStore';

// Define the DI context interface
interface DIContextValue {
  getTodoService: () => ITodoService;
  getMasterStore: () => MasterStore;
}

// Create the context
const DIContext = createContext<DIContextValue | null>(null);

// Provider props
interface DIProviderProps {
  children: ReactNode;
  container: Container;
  serviceTypes: {
    TodoService: symbol;
    MasterStore: symbol;
  };
}

// Provider component - completely portable!
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

// Portable hooks that don't depend on specific container/types
export const useDITodoService = (): ITodoService => {
  const context = useContext(DIContext);
  if (!context) {
    throw new Error('useDITodoService must be used within a DIProvider');
  }
  return context.getTodoService();
};

export const useDIMasterStore = (): MasterStore => {
  const context = useContext(DIContext);
  if (!context) {
    throw new Error('useDIMasterStore must be used within a DIProvider');
  }
  return context.getMasterStore();
};
