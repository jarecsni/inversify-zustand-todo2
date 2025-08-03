import 'reflect-metadata';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { TodoApp, TodoFeatureProvider } from '@/features/todo';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

const root = createRoot(rootElement);
root.render(
  <TodoFeatureProvider>
    <TodoApp />
  </TodoFeatureProvider>
);
