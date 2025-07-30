import { useMemo, useState, useEffect } from 'react';
import { container } from '@/container/container';
import { TYPES } from '@/constants/types';
import type { ITodoService } from '@/services/interfaces/ITodoService';
import type { Todo } from '@/types/Todo';

export const useTodoService = (): ITodoService => {
  return useMemo(() => {
    return container.get<ITodoService>(TYPES.TodoService);
  }, []);
};

export const useTodos = (): Todo[] => {
  const todoService = useTodoService();
  const [todos, setTodos] = useState<Todo[]>([]);

  useEffect(() => {
    const unsubscribe = todoService.subscribe(setTodos);
    return unsubscribe;
  }, [todoService]);

  return todos;
};
