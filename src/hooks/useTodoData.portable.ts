import { useState, useEffect, useMemo } from 'react';
import { useDIMasterStore } from '@/providers/DIProvider';
import type { Todo } from '@/types/Todo';

// Completely portable hook - no hard-coded container dependencies!
export const useTodoData = (): readonly Todo[] => {
  const masterStore = useDIMasterStore();

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
