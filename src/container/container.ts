import 'reflect-metadata';
import { Container } from 'inversify';
import { TYPES } from '@/constants/types';
import { ITodoService } from '@/services/interfaces/ITodoService';
import { TodoService } from '@/services/TodoService';

const container = new Container();

container.bind<ITodoService>(TYPES.TodoService).to(TodoService).inSingletonScope();

export { container };
