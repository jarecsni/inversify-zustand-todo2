import React from 'react';
import { useTodoStore } from '@/store/todoStore';
import { TodoItem } from './TodoItem';

export const TodoList: React.FC = () => {
  const todos = useTodoStore(state => state.todos);

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
