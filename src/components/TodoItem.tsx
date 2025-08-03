import React from 'react';
import { Todo } from '@/types/Todo';
import { useTodoService } from '@/hooks/useTodoService';

/**
 * Props for the TodoItem component.
 */
interface TodoItemProps {
  /** The todo item to display and interact with */
  todo: Todo;
}

/**
 * Individual todo item component with interactive controls.
 *
 * Renders a single todo with:
 * - Checkbox for toggling completion status
 * - Text display with completion styling
 * - Remove button with accessibility support
 * - Conditional CSS classes for visual states
 *
 * Performance optimized through:
 * - React.memo compatibility (structural sharing prevents unnecessary re-renders)
 * - Efficient event handlers using service layer
 * - Minimal DOM updates via conditional classes
 *
 * @param props - Component props containing the todo item
 * @returns JSX element representing a single todo item
 */
export const TodoItem: React.FC<TodoItemProps> = ({ todo }) => {
  const todoService = useTodoService();

  return (
    <div className={`todo-item ${todo.completed ? 'completed' : ''}`}>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => todoService.toggleTodo(todo.id)}
        className="todo-checkbox"
      />
      <span className="todo-text">{todo.text}</span>
      <button
        onClick={() => todoService.removeTodo(todo.id)}
        className="remove-button"
        aria-label="Remove todo"
      >
        ×
      </button>
    </div>
  );
};
