import React from 'react';
import { useTodoData } from '@/hooks/useTodoData';
import { TodoItem } from './TodoItem';

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
