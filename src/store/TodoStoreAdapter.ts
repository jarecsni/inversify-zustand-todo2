import { injectable } from 'inversify';
import { Todo } from '@/types/Todo';
import { ITodoStore } from '@/store/interfaces/ITodoStore';
import { useTodoStore } from '@/store/todoStore';

@injectable()
export class TodoStoreAdapter implements ITodoStore {
  getTodos(): Todo[] {
    return useTodoStore.getState().todos;
  }

  setTodos(todos: Todo[]): void {
    useTodoStore.getState().setTodos(todos);
  }

  addTodo(todo: Todo): void {
    useTodoStore.getState().addTodo(todo);
  }

  updateTodo(id: string, updates: Partial<Todo>): void {
    useTodoStore.getState().updateTodo(id, updates);
  }

  removeTodo(id: string): void {
    useTodoStore.getState().removeTodo(id);
  }
}
