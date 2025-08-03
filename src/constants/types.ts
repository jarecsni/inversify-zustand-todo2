/**
 * Dependency injection type symbols for InversifyJS container.
 *
 * Defines unique symbols used to identify and resolve dependencies
 * in the InversifyJS dependency injection container.
 *
 * Using Symbol.for() ensures global symbol registry usage,
 * which helps with module loading and hot reloading scenarios.
 *
 * @example
 * ```typescript
 * // Binding in container
 * container.bind(TYPES.TodoService).to(TodoService);
 *
 * // Injection in class
 * constructor(@inject(TYPES.TodoService) private todoService: ITodoService) {}
 * ```
 */
export const TYPES = {
  /** Symbol for TodoService dependency injection */
  TodoService: Symbol.for('TodoService'),
  /** Symbol for MasterStore dependency injection */
  MasterStore: Symbol.for('MasterStore'),
  /** Symbol for TodoView (StoreView<Todo>) dependency injection */
  TodoView: Symbol.for('TodoView'),
} as const;
