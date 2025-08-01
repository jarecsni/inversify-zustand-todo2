import 'reflect-metadata';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { TodoApp } from '@/components/TodoApp';
import '@/container/container'; // Initialize the DI container

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element not found');
}

const root = createRoot(container);
root.render(<TodoApp />);
