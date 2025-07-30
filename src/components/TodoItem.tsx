import React from 'react';
import { Todo } from '@/types/Todo';
import { useTodoStore } from '@/store/todoStore';

interface TodoItemProps {
  todo: Todo;
}

export const TodoItem: React.FC<TodoItemProps> = ({ todo }) => {
  const { toggleTodo, removeTodo } = useTodoStore(state => ({
    toggleTodo: state.toggleTodo,
    removeTodo: state.removeTodo,
  }));

  return (
    <div className={`todo-item ${todo.completed ? 'completed' : ''}`}>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => toggleTodo(todo.id)}
        className="todo-checkbox"
      />
      <span className="todo-text">{todo.text}</span>
      <button
        onClick={() => removeTodo(todo.id)}
        className="remove-button"
        aria-label="Remove todo"
      >
        ×
      </button>
    </div>
  );
};
