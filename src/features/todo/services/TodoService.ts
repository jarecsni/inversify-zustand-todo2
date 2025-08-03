import { injectable, inject } from 'inversify';
import { Todo, CreateTodoRequest } from '../types/Todo';
import { ITodoService } from './ITodoService';
import type { StoreView } from '@/store/MasterStore';
import { TODO_TYPES } from '../config/todo.types';

/**
 * Service layer for todo operations with dependency injection.
 *
 * Provides business logic for todo management while maintaining separation of concerns.
 * Uses Immer-powered store operations for optimal performance and structural sharing.
 *
 * @example
 * ```typescript
 * // Injected via DI container
 * const todoService = container.get<ITodoService>(TYPES.TodoService);
 *
 * // Add a new todo
 * const newTodo = todoService.addTodo({ text: 'Learn Immer' });
 *
 * // Toggle completion status
 * todoService.toggleTodo(newTodo.id);
 * ```
 */
@injectable()
export class TodoService implements ITodoService {
  /**
   * Initialize TodoService with injected dependencies.
   * @param todoView - Injected StoreView for todo operations
   */
  constructor(
    @inject(TODO_TYPES.TodoView) private todoView: StoreView<Todo>
  ) {}

  /**
   * Retrieve all todos from the store.
   * @returns Array of all todos
   */
  getAllTodos(): Todo[] {
    return this.todoView.getItems();
  }

  /**
   * Add a new todo to the store.
   * @param request - Todo creation request with text
   * @returns The created todo with generated ID and metadata
   */
  addTodo(request: CreateTodoRequest): Todo {
    return this.todoView.addItem({
      text: request.text,
      completed: false,
      createdAt: new Date(),
    });
  }

  /**
   * Toggle the completion status of a todo.
   * Uses Immer draft pattern for optimal performance.
   * @param id - ID of the todo to toggle
   */
  toggleTodo(id: string): void {
    this.todoView.updateItem(id, (draft) => {
      draft.completed = !draft.completed;
    });
  }

  /**
   * Remove a todo from the store.
   * @param id - ID of the todo to remove
   */
  removeTodo(id: string): void {
    this.todoView.removeItem(id);
  }
}
