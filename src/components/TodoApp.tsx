import React from 'react';
import { useTodoData } from '@/hooks/useTodoData';
import { AddTodo } from './AddTodo';
import { TodoList } from './TodoList';

export const TodoApp: React.FC = () => {
  const todos = useTodoData();

  const completedCount = todos.filter(todo => todo.completed).length;
  const totalCount = todos.length;

  return (
    <div className="todo-app">
      <header className="app-header">
        <h1>InversifyJS + Zustand Todo App</h1>
        <p className="stats">
          {completedCount} of {totalCount} completed
        </p>
      </header>
      
      <main className="app-main">
        <AddTodo />
        <TodoList />
      </main>
    </div>
  );
};
