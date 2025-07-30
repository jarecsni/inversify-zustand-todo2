import { create } from 'zustand';
import { Todo } from '@/types/Todo';

interface TodoState {
  todos: Todo[];
  setTodos: (todos: Todo[]) => void;
  addTodo: (todo: Todo) => void;
  updateTodo: (id: string, updates: Partial<Todo>) => void;
  removeTodo: (id: string) => void;
}

export const useTodoStore = create<TodoState>((set) => ({
  todos: [],

  setTodos: (todos: Todo[]) => {
    set({ todos });
  },

  addTodo: (todo: Todo) => {
    set(state => ({ todos: [...state.todos, todo] }));
  },

  updateTodo: (id: string, updates: Partial<Todo>) => {
    set(state => ({
      todos: state.todos.map(todo =>
        todo.id === id ? { ...todo, ...updates } : todo
      )
    }));
  },

  removeTodo: (id: string) => {
    set(state => ({
      todos: state.todos.filter(todo => todo.id !== id)
    }));
  },
}));
