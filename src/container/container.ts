import 'reflect-metadata';
import { Container } from 'inversify';
import { TYPES } from '@/constants/types';
import { ITodoService } from '@/services/interfaces/ITodoService';
import { TodoService } from '@/services/TodoService';
import { MasterStore, StoreView } from '@/store/MasterStore';
import type { Todo } from '@/types/Todo';

const container = new Container();

container.bind<ITodoService>(TYPES.TodoService).to(TodoService).inSingletonScope();
container.bind<MasterStore>(TYPES.MasterStore).to(MasterStore).inSingletonScope();

// Bind TodoView as a factory that gets the view from MasterStore
container.bind<StoreView<Todo>>(TYPES.TodoView)
  .toDynamicValue((context) => {
    const masterStore = context.container.get<MasterStore>(TYPES.MasterStore);
    return masterStore.getView<Todo>('todos');
  })
  .inSingletonScope();

export { container };
