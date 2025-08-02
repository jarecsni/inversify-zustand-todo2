import { injectable, inject } from 'inversify';
import { Todo, CreateTodoRequest } from '@/types/Todo';
import { ITodoService } from '@/services/interfaces/ITodoService';
import { MasterStore, StoreView } from '@/store/MasterStore';
import { TYPES } from '@/constants/types';

@injectable()
export class TodoService implements ITodoService {
  private todoView: StoreView<Todo>;

  constructor(
    @inject(TYPES.MasterStore) private masterStore: MasterStore
  ) {
    this.todoView = this.masterStore.getView<Todo>('todos');
  }

  getAllTodos(): Todo[] {
    return this.todoView.getItems();
  }

  addTodo(request: CreateTodoRequest): Todo {
    return this.todoView.addItem({
      text: request.text,
      completed: false,
      createdAt: new Date(),
    });
  }

  toggleTodo(id: string): void {
    this.todoView.updateItem(id, (todo) => ({
      ...todo,
      completed: !todo.completed,
    }));
  }

  removeTodo(id: string): void {
    this.todoView.removeItem(id);
  }
}
