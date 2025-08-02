import type { Identifiable } from '@/store/MasterStore';

export interface Todo extends Identifiable {
  text: string;
  completed: boolean;
  createdAt: Date;
}

export interface CreateTodoRequest {
  text: string;
}
