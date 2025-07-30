import { useMemo } from 'react';
import { container } from '@/container/container';
import { TYPES } from '@/constants/types';
import type { ITodoService } from '@/services/interfaces/ITodoService';

export const useTodoService = (): ITodoService => {
  return useMemo(() => {
    return container.get<ITodoService>(TYPES.TodoService);
  }, []);
};
