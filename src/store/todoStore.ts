import { create } from 'zustand';
import { Todo, CreateTodoRequest } from '@/types/Todo';
import { container } from '@/container/container';
import { TYPES } from '@/constants/types';
import { ITodoService } from '@/services/interfaces/ITodoService';

interface TodoState {
  todos: Todo[];
  addTodo: (request: CreateTodoRequest) => void;
  toggleTodo: (id: string) => void;
  removeTodo: (id: string) => void;
  refreshTodos: () => void;
}

export const useTodoStore = create<TodoState>((set, get) => {
  const todoService = container.get<ITodoService>(TYPES.TodoService);

  return {
    todos: [],
    
    addTodo: (request: CreateTodoRequest) => {
      todoService.addTodo(request);
      set({ todos: todoService.getAllTodos() });
    },
    
    toggleTodo: (id: string) => {
      todoService.toggleTodo(id);
      set({ todos: todoService.getAllTodos() });
    },
    
    removeTodo: (id: string) => {
      todoService.removeTodo(id);
      set({ todos: todoService.getAllTodos() });
    },
    
    refreshTodos: () => {
      set({ todos: todoService.getAllTodos() });
    },
  };
});
