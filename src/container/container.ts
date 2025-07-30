import 'reflect-metadata';
import { Container } from 'inversify';
import { TYPES } from '@/constants/types';
import { ITodoService } from '@/services/interfaces/ITodoService';
import { TodoService } from '@/services/TodoService';
import { ITodoStore } from '@/store/interfaces/ITodoStore';
import { TodoStoreAdapter } from '@/store/TodoStoreAdapter';

const container = new Container();

container.bind<ITodoService>(TYPES.TodoService).to(TodoService).inSingletonScope();
container.bind<ITodoStore>(TYPES.TodoStore).to(TodoStoreAdapter).inSingletonScope();

export { container };
