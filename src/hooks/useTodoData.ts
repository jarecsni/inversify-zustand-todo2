import { useTodoStore } from '@/store/todoStore';
import type { Todo } from '@/types/Todo';

// Read-only hook that subscribes to store data
export const useTodoData = (): Todo[] => {
  return useTodoStore(state => state.todos);
};
