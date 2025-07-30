import React from 'react';
import { useTodos } from '@/hooks/useTodoService';
import { TodoItem } from './TodoItem';

export const TodoList: React.FC = () => {
  const todos = useTodos();

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
