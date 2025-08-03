/**
 * Dependency injection type symbols for Todo feature.
 * 
 * Self-contained DI symbols that don't conflict with other features.
 * These symbols are used internally within the Todo feature module.
 * 
 * @example
 * ```typescript
 * // Binding in feature container
 * container.bind(TODO_TYPES.TodoService).to(TodoService);
 * 
 * // Injection in service
 * constructor(@inject(TODO_TYPES.TodoView) private todoView: StoreView<Todo>) {}
 * ```
 */
export const TODO_TYPES = {
  /** Symbol for TodoService dependency injection */
  TodoService: Symbol.for('Todo.TodoService'),
  /** Symbol for MasterStore dependency injection */
  MasterStore: Symbol.for('Todo.MasterStore'),
  /** Symbol for TodoView (StoreView<Todo>) dependency injection */
  TodoView: Symbol.for('Todo.TodoView'),
} as const;

/**
 * Type definition for TODO_TYPES to ensure type safety.
 */
export type TodoTypes = typeof TODO_TYPES;
