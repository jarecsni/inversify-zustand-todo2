import React from 'react';
import { Todo } from '@/types/Todo';
import { useTodoService } from '@/hooks/useTodoService';

interface TodoItemProps {
  todo: Todo;
}

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
