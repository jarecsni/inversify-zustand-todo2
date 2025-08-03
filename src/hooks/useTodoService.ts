import { useDITodoService } from '@/providers/DIProvider';
import type { ITodoService } from '@/services/interfaces/ITodoService';

/**
 * Custom hook for accessing the TodoService via dependency injection.
 *
 * Provides a clean, portable interface for components to access todo operations
 * without hard-coding dependencies. Uses the DI context to resolve the service.
 *
 * Features:
 * - Complete portability (no hard-coded container dependencies)
 * - Type-safe service access
 * - Automatic DI container resolution
 * - Consistent API across different applications
 *
 * @example
 * ```tsx
 * function AddTodo() {
 *   const todoService = useTodoService();
 *
 *   const handleAdd = () => {
 *     todoService.addTodo({ text: 'New todo' });
 *   };
 *
 *   return <button onClick={handleAdd}>Add Todo</button>;
 * }
 * ```
 *
 * @returns TodoService instance from the DI container
 * @throws Error if used outside DIProvider context
 */
export const useTodoService = (): ITodoService => {
  return useDITodoService();
};
