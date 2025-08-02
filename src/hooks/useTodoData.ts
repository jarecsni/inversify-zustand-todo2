import { useState, useEffect, useMemo } from 'react';
import { container } from '@/container/container';
import { TYPES } from '@/constants/types';
import { MasterStore } from '@/store/MasterStore';
import type { Todo } from '@/types/Todo';

// Read-only hook that subscribes to todo collection data
export const useTodoData = (): readonly Todo[] => {
  const masterStore = useMemo(() => {
    return container.get<MasterStore>(TYPES.MasterStore);
  }, []);

  const todoView = useMemo(() => {
    return masterStore.getView<Todo>('todos');
  }, [masterStore]);

  const [todos, setTodos] = useState<Todo[]>(() => todoView.getItems());

  useEffect(() => {
    const unsubscribe = todoView.subscribe(setTodos);
    return unsubscribe;
  }, [todoView]);

  return todos;
};
