import { useDITodoService } from '@/providers/DIProvider';
import type { ITodoService } from '@/services/interfaces/ITodoService';

// Completely portable hook - no hard-coded container dependencies!
export const useTodoService = (): ITodoService => {
  return useDITodoService();
};
