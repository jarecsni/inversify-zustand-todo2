import { Container } from 'inversify';
import { MasterStore } from '@/store/MasterStore';
import { TodoService } from '../services/TodoService';
import { TODO_TYPES } from './todo.types';
import type { Todo } from '../types/Todo';

/**
 * Configure a complete DI container for the Todo feature.
 * 
 * Creates a self-contained container with all dependencies needed
 * for the Todo feature to function independently.
 * 
 * This function can be used to:
 * - Create a standalone Todo feature
 * - Integrate Todo into existing apps
 * - Test the Todo feature in isolation
 * 
 * @param existingMasterStore - Optional existing MasterStore to reuse
 * @returns Configured Container with all Todo dependencies
 * 
 * @example
 * ```typescript
 * // Standalone usage
 * const container = configureTodoContainer();
 * 
 * // Integration with existing store
 * const container = configureTodoContainer(myExistingStore);
 * ```
 */
export function configureTodoContainer(existingMasterStore?: MasterStore): Container {
  const container = new Container();
  
  // Use existing store or create new one
  const masterStore = existingMasterStore || new MasterStore();
  
  // Bind core dependencies
  container.bind(TODO_TYPES.MasterStore).toConstantValue(masterStore);
  
  // Bind TodoView as a dynamic value from MasterStore
  container.bind(TODO_TYPES.TodoView).toDynamicValue(() => 
    masterStore.getView<Todo>('todos')
  ).inSingletonScope();
  
  // Bind TodoService
  container.bind(TODO_TYPES.TodoService).to(TodoService).inSingletonScope();
  
  return container;
}

/**
 * Create a minimal container for testing purposes.
 * 
 * @returns Container configured for testing
 */
export function createTestTodoContainer(): Container {
  return configureTodoContainer();
}
