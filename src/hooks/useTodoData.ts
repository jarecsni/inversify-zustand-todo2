import { useState, useEffect, useMemo } from 'react';
import { useDIMasterStore } from '@/providers/DIProvider';
import type { Todo } from '@/types/Todo';

/**
 * Custom hook for accessing todo data with reactive updates.
 *
 * Provides read-only access to the todo collection with automatic re-rendering
 * when the underlying data changes. Uses subscription-based updates for efficiency.
 *
 * Features:
 * - Automatic subscription to todo data changes
 * - Optimized re-renders through structural sharing
 * - Read-only interface to prevent accidental mutations
 * - Memoized store view for performance
 * - Proper cleanup of subscriptions
 *
 * @example
 * ```tsx
 * function TodoList() {
 *   const todos = useTodoData();
 *
 *   return (
 *     <div>
 *       {todos.map(todo => (
 *         <TodoItem key={todo.id} todo={todo} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 *
 * @returns Read-only array of todo items that updates automatically
 */
export const useTodoData = (): readonly Todo[] => {
  const masterStore = useDIMasterStore();

  const todoView = useMemo(() => {
    return masterStore.getView<Todo>('todos');
  }, [masterStore]);

  const [todos, setTodos] = useState<Todo[]>(() => todoView.getItems());

  useEffect(() => {
    const unsubscribe = todoView.subscribe(setTodos);
    return unsubscribe;
  }, [todoView]);

  return todos;
};
