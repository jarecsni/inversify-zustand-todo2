import type { Identifiable } from '@/store/MasterStore';

/**
 * Todo entity interface representing a single todo item.
 *
 * Extends Identifiable to work with the MasterStore system.
 * Contains all the data needed to represent and manage a todo item.
 *
 * @example
 * ```typescript
 * const todo: Todo = {
 *   id: 'todo-123',
 *   text: 'Learn TypeScript',
 *   completed: false,
 *   createdAt: new Date()
 * };
 * ```
 */
export interface Todo extends Identifiable {
  /** The todo item's text content */
  text: string;
  /** Whether the todo has been completed */
  completed: boolean;
  /** Timestamp when the todo was created */
  createdAt: Date;
}

/**
 * Request interface for creating new todo items.
 *
 * Contains only the user-provided data needed to create a todo.
 * The system will automatically generate id, completed status, and createdAt timestamp.
 *
 * @example
 * ```typescript
 * const request: CreateTodoRequest = {
 *   text: 'Buy groceries'
 * };
 *
 * const newTodo = todoService.addTodo(request);
 * ```
 */
export interface CreateTodoRequest {
  /** The text content for the new todo */
  text: string;
}
