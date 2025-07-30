import { injectable, inject } from 'inversify';
import { Todo, CreateTodoRequest } from '@/types/Todo';
import { ITodoService } from '@/services/interfaces/ITodoService';
import type { ITodoStore } from '@/store/interfaces/ITodoStore';
import { TYPES } from '@/constants/types';

@injectable()
export class TodoService implements ITodoService {
  private subscribers: Set<(todos: Todo[]) => void> = new Set();

  constructor(
    @inject(TYPES.TodoStore) private todoStore: ITodoStore
  ) {}

  private notifySubscribers(): void {
    const todos = this.todoStore.getTodos();
    this.subscribers.forEach(callback => callback(todos));
  }

  getAllTodos(): Todo[] {
    return this.todoStore.getTodos();
  }

  addTodo(request: CreateTodoRequest): Todo {
    const newTodo: Todo = {
      id: crypto.randomUUID(),
      text: request.text,
      completed: false,
      createdAt: new Date(),
    };

    this.todoStore.addTodo(newTodo);
    this.notifySubscribers();
    return newTodo;
  }

  toggleTodo(id: string): void {
    const todos = this.todoStore.getTodos();
    const todo = todos.find(t => t.id === id);
    if (todo) {
      this.todoStore.updateTodo(id, { completed: !todo.completed });
      this.notifySubscribers();
    }
  }

  removeTodo(id: string): void {
    this.todoStore.removeTodo(id);
    this.notifySubscribers();
  }

  subscribe(callback: (todos: Todo[]) => void): () => void {
    this.subscribers.add(callback);

    // Immediately call with current data
    callback(this.getAllTodos());

    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
    };
  }
}
