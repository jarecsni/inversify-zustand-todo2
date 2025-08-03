import 'reflect-metadata';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { TodoApp } from '@/components/TodoApp';
import { DIProvider } from '@/providers/DIProvider';
import { container as diContainer } from '@/container/container';
import { TYPES } from '@/constants/types';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

const root = createRoot(rootElement);
root.render(
  <DIProvider
    container={diContainer}
    serviceTypes={{
      TodoService: TYPES.TodoService,
      MasterStore: TYPES.MasterStore,
    }}
  >
    <TodoApp />
  </DIProvider>
);
