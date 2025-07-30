import React, { useEffect } from 'react';
import { useTodoStore } from '@/store/todoStore';
import { useTodoService } from '@/hooks/useTodoService';
import { AddTodo } from './AddTodo';
import { TodoList } from './TodoList';

export const TodoApp: React.FC = () => {
  const todos = useTodoStore(state => state.todos);
  const todoService = useTodoService();

  useEffect(() => {
    // Initialize the store with data from the service
    const initialTodos = todoService.getAllTodos();
    useTodoStore.getState().setTodos(initialTodos);
  }, [todoService]);

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
