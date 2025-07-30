import { Todo } from '@/types/Todo';

export interface ITodoStore {
  getTodos(): Todo[];
  setTodos(todos: Todo[]): void;
  addTodo(todo: Todo): void;
  updateTodo(id: string, updates: Partial<Todo>): void;
  removeTodo(id: string): void;
}
