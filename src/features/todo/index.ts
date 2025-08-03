/**
 * Todo Feature Module - Single Entry Point
 * 
 * This is the main entry point for the Todo feature module.
 * Import everything you need for Todo functionality from this single file.
 * 
 * Perfect for:
 * - Feature distribution and copying
 * - NPM package preparation
 * - Clear API boundaries
 * - Easy integration
 * 
 * @example
 * ```typescript
 * // Import everything from one place
 * import { 
 *   TodoApp, 
 *   TodoFeatureProvider, 
 *   useTodoService,
 *   Todo,
 *   ITodoService 
 * } from '@/features/todo';
 * 
 * // Or from npm package (future)
 * import { TodoApp, TodoFeatureProvider } from '@mycompany/todo-feature';
 * ```
 */

// === COMPONENTS ===
// Main UI components for Todo functionality
export { TodoApp } from './components/TodoApp';
export { TodoList } from './components/TodoList';
export { TodoItem } from './components/TodoItem';
export { AddTodo } from './components/AddTodo';

// === SERVICES ===
// Business logic and service interfaces
export { TodoService } from './services/TodoService';
export type { ITodoService } from './services/ITodoService';

// === HOOKS ===
// Custom React hooks for Todo functionality
export { useTodoData } from './hooks/useTodoData';
export { useTodoService } from './hooks/useTodoService';

// === TYPES ===
// TypeScript type definitions
export type { Todo, CreateTodoRequest } from './types/Todo';

// === CONFIGURATION ===
// Dependency injection and feature setup
export { 
  TodoFeatureProvider,
  useDITodoService,
  useDIMasterStore 
} from './config/todo.provider';

export { 
  configureTodoContainer,
  createTestTodoContainer 
} from './config/todo.container';

export { TODO_TYPES } from './config/todo.types';
export type { TodoTypes } from './config/todo.types';

// === FEATURE METADATA ===
/**
 * Feature metadata for tooling and documentation.
 */
export const TODO_FEATURE_INFO = {
  name: 'todo',
  version: '1.0.0',
  description: 'Complete Todo management feature with components, services, and DI configuration',
  dependencies: [
    'react',
    'inversify', 
    'immer'
  ],
  peerDependencies: [
    '@/store/MasterStore' // Will become peer dependency in npm package
  ]
} as const;
