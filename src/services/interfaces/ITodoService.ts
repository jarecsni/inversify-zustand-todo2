import { Todo, CreateTodoRequest } from '@/types/Todo';

/**
 * Service interface for todo operations.
 *
 * Defines the contract for todo business logic operations.
 * Implementations should handle data persistence, validation, and business rules.
 *
 * This interface enables:
 * - Dependency injection and testability
 * - Multiple implementations (e.g., different storage backends)
 * - Clear separation between business logic and UI
 * - Type safety for service operations
 *
 * @example
 * ```typescript
 * // In a component
 * const todoService = useTodoService();
 *
 * // Add a new todo
 * const newTodo = todoService.addTodo({ text: 'Learn interfaces' });
 *
 * // Toggle completion
 * todoService.toggleTodo(newTodo.id);
 * ```
 */
export interface ITodoService {
  /**
   * Retrieve all todos from the data store.
   * @returns Array of all todo items
   */
  getAllTodos(): Todo[];

  /**
   * Create and add a new todo item.
   * @param request - Todo creation request with text content
   * @returns The created todo with generated ID and metadata
   */
  addTodo(request: CreateTodoRequest): Todo;

  /**
   * Toggle the completion status of a todo item.
   * @param id - Unique identifier of the todo to toggle
   */
  toggleTodo(id: string): void;

  /**
   * Remove a todo item from the data store.
   * @param id - Unique identifier of the todo to remove
   */
  removeTodo(id: string): void;
}
