import { injectable, inject } from 'inversify';
import { Todo, CreateTodoRequest } from '@/types/Todo';
import { ITodoService } from '@/services/interfaces/ITodoService';
import { MasterStore, CollectionView } from '@/store/MasterStore';
import { TYPES } from '@/constants/types';

@injectable()
export class TodoService implements ITodoService {
  private todoCollection: CollectionView<Todo>;

  constructor(
    @inject(TYPES.MasterStore) private masterStore: MasterStore
  ) {
    this.todoCollection = this.masterStore.getCollection<Todo>('todos');
  }

  getAllTodos(): Todo[] {
    return this.todoCollection.getItems();
  }

  addTodo(request: CreateTodoRequest): Todo {
    return this.todoCollection.addItem({
      text: request.text,
      completed: false,
      createdAt: new Date(),
    });
  }

  toggleTodo(id: string): void {
    this.todoCollection.updateItem(id, (todo) => ({
      ...todo,
      completed: !todo.completed,
    }));
  }

  removeTodo(id: string): void {
    this.todoCollection.removeItem(id);
  }
}
