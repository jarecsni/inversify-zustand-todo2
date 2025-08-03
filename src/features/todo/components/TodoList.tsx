import React from 'react';
import { useTodoData } from '../hooks/useTodoData';
import { TodoItem } from './TodoItem';

/**
 * Component that renders the list of todos.
 *
 * Displays all todos in a scrollable list with:
 * - Empty state message when no todos exist
 * - Efficient rendering with React keys for performance
 * - Automatic updates via reactive data subscription
 * - Individual TodoItem components for each todo
 *
 * Performance optimized through:
 * - Structural sharing from Immer (prevents unnecessary re-renders)
 * - Proper React key usage for efficient list updates
 * - Memoized child components (TodoItem)
 *
 * @returns JSX element containing the todo list or empty state
 */
export const TodoList: React.FC = () => {
  const todos = useTodoData();

  if (todos.length === 0) {
    return (
      <div className="empty-state">
        <p>No todos yet. Add one above to get started!</p>
      </div>
    );
  }

  return (
    <div className="todo-list">
      {todos.map(todo => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
    </div>
  );
};
