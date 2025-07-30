import { injectable } from 'inversify';
import { Todo, CreateTodoRequest } from '@/types/Todo';
import { ITodoService } from '@/services/interfaces/ITodoService';

@injectable()
export class TodoService implements ITodoService {
  private todos: Todo[] = [];

  getAllTodos(): Todo[] {
    return [...this.todos];
  }

  addTodo(request: CreateTodoRequest): Todo {
    const newTodo: Todo = {
      id: crypto.randomUUID(),
      text: request.text,
      completed: false,
      createdAt: new Date(),
    };
    
    this.todos.push(newTodo);
    return newTodo;
  }

  toggleTodo(id: string): void {
    const todo = this.todos.find(t => t.id === id);
    if (todo) {
      todo.completed = !todo.completed;
    }
  }

  removeTodo(id: string): void {
    this.todos = this.todos.filter(t => t.id !== id);
  }
}
