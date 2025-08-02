import 'reflect-metadata';
import { Container } from 'inversify';
import { TYPES } from '@/constants/types';
import { ITodoService } from '@/services/interfaces/ITodoService';
import { TodoService } from '@/services/TodoService';
import { MasterStore } from '@/store/MasterStore';

const container = new Container();

container.bind<ITodoService>(TYPES.TodoService).to(TodoService).inSingletonScope();
container.bind<MasterStore>(TYPES.MasterStore).to(MasterStore).inSingletonScope();

export { container };
