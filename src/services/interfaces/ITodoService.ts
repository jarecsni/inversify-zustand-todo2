import { Todo, CreateTodoRequest } from '@/types/Todo';

export interface ITodoService {
  getAllTodos(): Todo[];
  addTodo(request: CreateTodoRequest): Todo;
  toggleTodo(id: string): void;
  removeTodo(id: string): void;
  subscribe(callback: (todos: Todo[]) => void): () => void;
}
