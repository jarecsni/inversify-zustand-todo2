import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TodoItem } from './TodoItem';
import { Todo } from '@/types/Todo';
import { container } from '@/container/container';
import { TYPES } from '@/constants/types';
import { MasterStore } from '@/store/MasterStore';

// Performance-tracked TodoItem component
const PerformanceTrackedTodoItem = React.memo<{ todo: Todo; testId: string }>(({ todo, testId }) => {
  // Track render count
  React.useEffect(() => {
    global.incrementRenderCount(testId);
  });

  return <TodoItem todo={todo} />;
});

describe('TodoItem Rendering Performance Tests', () => {
  let masterStore: MasterStore;
  let todoView: any;

  beforeEach(() => {
    global.resetRenderCounts();

    // Reset container and create fresh store
    container.unbindAll();
    masterStore = new MasterStore();
    container.bind(TYPES.MasterStore).toConstantValue(masterStore);
    container.bind(TYPES.TodoView).toDynamicValue(() => masterStore.getView('todos')).inSingletonScope();

    // Import and bind TodoService
    const { TodoService } = require('@/services/TodoService');
    container.bind(TYPES.TodoService).to(TodoService).inSingletonScope();

    todoView = masterStore.getView('todos');
  });

  describe('Individual TodoItem Rendering Optimization', () => {
    test('TodoItem structural sharing works with object references', async () => {
      // Create multiple todos
      const todo1 = todoView.addItem({ text: 'Todo 1', completed: false, createdAt: new Date() });
      const todo2 = todoView.addItem({ text: 'Todo 2', completed: false, createdAt: new Date() });
      const todo3 = todoView.addItem({ text: 'Todo 3', completed: false, createdAt: new Date() });

      const initialTodos = todoView.getItems();

      // Update only todo-2
      todoView.updateItem(todo2.id, (draft: any) => {
        draft.completed = true;
      });

      const updatedTodos = todoView.getItems();

      // Verify structural sharing: unchanged todos should have same references
      expect(updatedTodos[0]).toBe(initialTodos[0]); // Todo 1 unchanged
      expect(updatedTodos[1]).not.toBe(initialTodos[1]); // Todo 2 changed
      expect(updatedTodos[2]).toBe(initialTodos[2]); // Todo 3 unchanged

      // Verify the change actually happened
      expect(updatedTodos[1].completed).toBe(true);
      expect(updatedTodos[0].completed).toBe(false);
      expect(updatedTodos[2].completed).toBe(false);
    });

    test('nested property changes preserve unmodified object references', () => {
      // Add todos with complex nested structure
      const todo1 = todoView.addItem({
        text: 'Complex Todo 1',
        completed: false,
        createdAt: new Date(),
        metadata: {
          priority: 'high',
          tags: ['work'],
          assignee: { name: 'Alice', id: 'user-1' }
        }
      } as any);

      const todo2 = todoView.addItem({
        text: 'Complex Todo 2',
        completed: false,
        createdAt: new Date(),
        metadata: {
          priority: 'low',
          tags: ['personal'],
          assignee: { name: 'Bob', id: 'user-2' }
        }
      } as any);

      const initialTodos = todoView.getItems();

      // Update nested property in todo1 only
      todoView.updateItem(todo1.id, (draft: any) => {
        draft.metadata.priority = 'urgent';
        draft.metadata.assignee.name = 'Alice Updated';
      });

      const updatedTodos = todoView.getItems();

      // Verify structural sharing for nested objects
      expect(updatedTodos[0]).not.toBe(initialTodos[0]); // Todo 1 changed
      expect(updatedTodos[1]).toBe(initialTodos[1]); // Todo 2 unchanged

      // Verify nested changes worked
      expect(updatedTodos[0].metadata.priority).toBe('urgent');
      expect(updatedTodos[0].metadata.assignee.name).toBe('Alice Updated');

      // Verify unchanged nested objects preserved references where possible
      expect(updatedTodos[0].metadata.tags).toBe(initialTodos[0].metadata.tags);
      expect(updatedTodos[1].metadata).toBe(initialTodos[1].metadata);
    });
  });

  describe('Batch Update Rendering Performance', () => {
    test('batch updates preserve object references efficiently', () => {
      // Create 10 todos
      const todos = [];
      for (let i = 0; i < 10; i++) {
        todos.push(todoView.addItem({
          text: `Batch Todo ${i}`,
          completed: false,
          createdAt: new Date()
        }));
      }

      const initialTodos = todoView.getItems();

      // Batch update - mark first 5 as completed
      todoView.updateItems((draft: any) => {
        for (let i = 0; i < 5; i++) {
          draft[i].completed = true;
        }
      });

      const updatedTodos = todoView.getItems();

      // Verify structural sharing in batch operations
      let changedCount = 0;
      let preservedCount = 0;

      for (let i = 0; i < 10; i++) {
        if (updatedTodos[i] === initialTodos[i]) {
          preservedCount++;
        } else {
          changedCount++;
          // Verify the change actually happened
          expect(updatedTodos[i].completed).toBe(true);
        }
      }

      // Should have changed exactly 5 and preserved 5
      expect(changedCount).toBe(5);
      expect(preservedCount).toBe(5);

      // Verify unchanged todos are still incomplete
      for (let i = 5; i < 10; i++) {
        expect(updatedTodos[i].completed).toBe(false);
      }
    });

    test('conditional batch updates preserve references selectively', () => {
      // Create todos with mixed completion status
      const todos = [];
      for (let i = 0; i < 20; i++) {
        todos.push(todoView.addItem({
          text: `Conditional Todo ${i}`,
          completed: i % 3 === 0, // Every 3rd todo is completed
          createdAt: new Date()
        }));
      }

      const initialTodos = todoView.getItems();
      const incompleteTodos = initialTodos.filter(t => !t.completed);

      // Update only incomplete todos
      todoView.updateItemsWhere(
        (todo) => !todo.completed,
        (draft: any) => {
          draft.completed = true;
          draft.completedAt = new Date();
        }
      );

      const updatedTodos = todoView.getItems();

      // Count reference changes
      let changedReferences = 0;
      let preservedReferences = 0;

      updatedTodos.forEach((todo, index) => {
        if (todo === initialTodos[index]) {
          preservedReferences++;
        } else {
          changedReferences++;
          // Verify the change actually happened
          expect(todo.completed).toBe(true);
          expect(todo.completedAt).toBeDefined();
        }
      });

      // Should match the number of incomplete todos
      expect(changedReferences).toBe(incompleteTodos.length);
      expect(preservedReferences).toBe(20 - incompleteTodos.length);

      // Verify all todos are now completed
      expect(updatedTodos.every(t => t.completed)).toBe(true);
    });
  });

  describe('Large Dataset Performance', () => {
    test('performance remains stable with large todo lists', () => {
      // Create large dataset
      const todos = [];
      for (let i = 0; i < 1000; i++) {
        todos.push(todoView.addItem({
          text: `Large Dataset Todo ${i}`,
          completed: i % 4 === 0,
          createdAt: new Date(),
          metadata: {
            priority: i % 3 === 0 ? 'high' : 'normal',
            category: `category-${i % 10}`
          }
        } as any));
      }
      
      const initialTodos = todoView.getItems();
      
      // Render first 100 todos (simulating virtualization)
      const visibleTodos = initialTodos.slice(0, 100);
      const todoComponents = visibleTodos.map((todo, index) => (
        <PerformanceTrackedTodoItem 
          key={todo.id} 
          todo={todo} 
          testId={`large-todo-${index}`} 
        />
      ));
      
      const renderStart = performance.now();
      render(<div>{todoComponents}</div>);
      const renderTime = performance.now() - renderStart;
      
      // Update single item in the middle of large dataset
      const updateStart = performance.now();
      todoView.updateItem(initialTodos[500].id, (draft: any) => {
        draft.completed = !draft.completed;
        draft.metadata.priority = 'urgent';
      });
      const updateTime = performance.now() - updateStart;
      
      // Performance assertions
      expect(renderTime).toBeLessThan(100); // Initial render < 100ms
      expect(updateTime).toBeLessThan(10);  // Update < 10ms
      
      // Verify no unnecessary re-renders in visible components
      // (since we updated item 500, which is not in the visible range 0-99)
      for (let i = 0; i < 100; i++) {
        expect(global.getRenderCount(`large-todo-${i}`)).toBe(1);
      }
    });
  });
});
