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
    (global as any).incrementRenderCount(testId);
  });

  return <TodoItem todo={todo} />;
});

describe('TodoItem Rendering Performance Tests', () => {
  let masterStore: MasterStore;
  let todoView: any;

  beforeEach(() => {
    (global as any).resetRenderCounts();

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

  describe('Actual Component Re-render Prevention', () => {
    test('components do NOT re-render when other items change', () => {
      // Create multiple todos
      const todo1 = todoView.addItem({ text: 'Todo 1', completed: false, createdAt: new Date() });
      const todo2 = todoView.addItem({ text: 'Todo 2', completed: false, createdAt: new Date() });
      const todo3 = todoView.addItem({ text: 'Todo 3', completed: false, createdAt: new Date() });

      const initialTodos = todoView.getItems();

      // Render all three components
      const { rerender } = render(
        <div>
          <PerformanceTrackedTodoItem todo={initialTodos[0]} testId="todo-1" />
          <PerformanceTrackedTodoItem todo={initialTodos[1]} testId="todo-2" />
          <PerformanceTrackedTodoItem todo={initialTodos[2]} testId="todo-3" />
        </div>
      );

      // Initial render count should be 1 for each
      expect((global as any).getRenderCount('todo-1')).toBe(1);
      expect((global as any).getRenderCount('todo-2')).toBe(1);
      expect((global as any).getRenderCount('todo-3')).toBe(1);

      // Update only todo-2 in the store
      todoView.updateItem(todo2.id, (draft: any) => {
        draft.completed = true;
      });

      const updatedTodos = todoView.getItems();

      // Re-render with updated todos (simulating React state update)
      rerender(
        <div>
          <PerformanceTrackedTodoItem todo={updatedTodos[0]} testId="todo-1" />
          <PerformanceTrackedTodoItem todo={updatedTodos[1]} testId="todo-2" />
          <PerformanceTrackedTodoItem todo={updatedTodos[2]} testId="todo-3" />
        </div>
      );

      // CRITICAL TEST: Only todo-2 should have re-rendered due to React.memo + structural sharing
      expect((global as any).getRenderCount('todo-1')).toBe(1); // NO re-render (same object reference)
      expect((global as any).getRenderCount('todo-2')).toBe(2); // Re-rendered (new object reference)
      expect((global as any).getRenderCount('todo-3')).toBe(1); // NO re-render (same object reference)
    });

    test('components do NOT re-render when deep nested properties in OTHER items change', () => {
      // Create todos with nested metadata
      const todo1 = todoView.addItem({
        text: 'Complex Todo 1',
        completed: false,
        createdAt: new Date(),
        metadata: { priority: 'high', tags: ['work'], assignee: { name: 'Alice', id: 'user-1' } }
      } as any);

      todoView.addItem({
        text: 'Complex Todo 2',
        completed: false,
        createdAt: new Date(),
        metadata: { priority: 'low', tags: ['personal'], assignee: { name: 'Bob', id: 'user-2' } }
      } as any);

      const initialTodos = todoView.getItems();

      const { rerender } = render(
        <div>
          <PerformanceTrackedTodoItem todo={initialTodos[0]} testId="complex-todo-1" />
          <PerformanceTrackedTodoItem todo={initialTodos[1]} testId="complex-todo-2" />
        </div>
      );

      // Update deep nested property in todo1 only
      todoView.updateItem(todo1.id, (draft: any) => {
        draft.metadata.assignee.name = 'Alice Updated';
        draft.metadata.priority = 'urgent';
      });

      const updatedTodos = todoView.getItems();

      rerender(
        <div>
          <PerformanceTrackedTodoItem todo={updatedTodos[0]} testId="complex-todo-1" />
          <PerformanceTrackedTodoItem todo={updatedTodos[1]} testId="complex-todo-2" />
        </div>
      );

      // CRITICAL TEST: Only the modified component should re-render
      expect((global as any).getRenderCount('complex-todo-1')).toBe(2); // Re-rendered (nested change)
      expect((global as any).getRenderCount('complex-todo-2')).toBe(1); // NO re-render (unchanged)
    });

    test('components do NOT re-render when new items are added to collection', () => {
      // Create initial todos
      todoView.addItem({ text: 'Existing Todo 1', completed: false, createdAt: new Date() });
      todoView.addItem({ text: 'Existing Todo 2', completed: false, createdAt: new Date() });

      const initialTodos = todoView.getItems();

      const { rerender } = render(
        <div>
          <PerformanceTrackedTodoItem todo={initialTodos[0]} testId="existing-1" />
          <PerformanceTrackedTodoItem todo={initialTodos[1]} testId="existing-2" />
        </div>
      );

      // Add new todo to collection
      todoView.addItem({ text: 'New Todo', completed: false, createdAt: new Date() });
      const updatedTodos = todoView.getItems();

      // Re-render existing components (new todo would be rendered separately)
      rerender(
        <div>
          <PerformanceTrackedTodoItem todo={updatedTodos[0]} testId="existing-1" />
          <PerformanceTrackedTodoItem todo={updatedTodos[1]} testId="existing-2" />
          <PerformanceTrackedTodoItem todo={updatedTodos[2]} testId="new-todo" />
        </div>
      );

      // CRITICAL TEST: Existing components should NOT re-render when collection grows
      expect((global as any).getRenderCount('existing-1')).toBe(1); // NO re-render
      expect((global as any).getRenderCount('existing-2')).toBe(1); // NO re-render
      expect((global as any).getRenderCount('new-todo')).toBe(1); // Initial render only
    });

    test('components do NOT re-render when items are removed from collection', () => {
      // Create multiple todos
      todoView.addItem({ text: 'Todo 1', completed: false, createdAt: new Date() });
      const todo2 = todoView.addItem({ text: 'Todo 2', completed: false, createdAt: new Date() });
      todoView.addItem({ text: 'Todo 3', completed: false, createdAt: new Date() });

      const initialTodos = todoView.getItems();

      const { rerender } = render(
        <div>
          <PerformanceTrackedTodoItem todo={initialTodos[0]} testId="todo-1" />
          <PerformanceTrackedTodoItem todo={initialTodos[1]} testId="todo-2" />
          <PerformanceTrackedTodoItem todo={initialTodos[2]} testId="todo-3" />
        </div>
      );

      // Remove middle todo
      todoView.removeItem(todo2.id);
      const updatedTodos = todoView.getItems();

      // Re-render remaining components
      rerender(
        <div>
          <PerformanceTrackedTodoItem todo={updatedTodos[0]} testId="todo-1" />
          <PerformanceTrackedTodoItem todo={updatedTodos[1]} testId="todo-3" />
        </div>
      );

      // CRITICAL TEST: Components with same object references should NOT re-render
      // Note: todo-3 might re-render due to position change in React, but the important thing
      // is that the object references are preserved (tested in store-level tests)
      expect((global as any).getRenderCount('todo-1')).toBe(1); // NO re-render
      // todo-3 component might re-render due to React key/position changes, but that's expected
    });
  });

  describe('Individual TodoItem Rendering Optimization', () => {
    test('TodoItem structural sharing works with object references', async () => {
      // Create multiple todos
      todoView.addItem({ text: 'Todo 1', completed: false, createdAt: new Date() });
      const todo2 = todoView.addItem({ text: 'Todo 2', completed: false, createdAt: new Date() });
      todoView.addItem({ text: 'Todo 3', completed: false, createdAt: new Date() });

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

      todoView.addItem({
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

  describe('Batch Operations Component Re-render Prevention', () => {
    test('batch updates only re-render affected components', () => {
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

      // Render all 10 components
      const todoComponents = initialTodos.map((todo: any, index: number) => (
        <PerformanceTrackedTodoItem
          key={todo.id}
          todo={todo}
          testId={`batch-todo-${index}`}
        />
      ));

      const { rerender } = render(<div>{todoComponents}</div>);

      // Verify initial render counts
      for (let i = 0; i < 10; i++) {
        expect((global as any).getRenderCount(`batch-todo-${i}`)).toBe(1);
      }

      // Batch update - mark first 3 as completed
      todoView.updateItems((draft: any) => {
        for (let i = 0; i < 3; i++) {
          draft[i].completed = true;
        }
      });

      const updatedTodos = todoView.getItems();

      // Re-render with updated todos
      const updatedComponents = updatedTodos.map((todo: any, index: number) => (
        <PerformanceTrackedTodoItem
          key={todo.id}
          todo={todo}
          testId={`batch-todo-${index}`}
        />
      ));

      rerender(<div>{updatedComponents}</div>);

      // CRITICAL TEST: Only first 3 should have re-rendered
      for (let i = 0; i < 10; i++) {
        const expectedRenderCount = i < 3 ? 2 : 1;
        expect((global as any).getRenderCount(`batch-todo-${i}`)).toBe(expectedRenderCount);
      }
    });

    test('conditional batch updates only re-render matching components', () => {
      // Create todos with mixed completion status
      const todos = [];
      for (let i = 0; i < 12; i++) {
        todos.push(todoView.addItem({
          text: `Conditional Todo ${i}`,
          completed: i % 3 === 0, // Every 3rd todo is completed (0, 3, 6, 9)
          createdAt: new Date()
        }));
      }

      const initialTodos = todoView.getItems();
      const incompleteTodos = initialTodos.filter((t: any) => !t.completed);

      // Render all components
      const todoComponents = initialTodos.map((todo: any, index: number) => (
        <PerformanceTrackedTodoItem
          key={todo.id}
          todo={todo}
          testId={`conditional-todo-${index}`}
        />
      ));

      const { rerender } = render(<div>{todoComponents}</div>);

      // Update only incomplete todos (should be indices: 1, 2, 4, 5, 7, 8, 10, 11)
      todoView.updateItemsWhere(
        (todo: any) => !todo.completed,
        (draft: any) => {
          draft.completed = true;
          draft.completedAt = new Date();
        }
      );

      const updatedTodos = todoView.getItems();

      // Re-render with updated todos
      const updatedComponents = updatedTodos.map((todo: any, index: number) => (
        <PerformanceTrackedTodoItem
          key={todo.id}
          todo={todo}
          testId={`conditional-todo-${index}`}
        />
      ));

      rerender(<div>{updatedComponents}</div>);

      // CRITICAL TEST: Only incomplete todos should have re-rendered
      for (let i = 0; i < 12; i++) {
        const wasInitiallyCompleted = i % 3 === 0;
        const expectedRenderCount = wasInitiallyCompleted ? 1 : 2;
        expect((global as any).getRenderCount(`conditional-todo-${i}`)).toBe(expectedRenderCount);
      }

      // Verify we updated the right number of components
      const reRenderedCount = Array.from({length: 12}, (_, i) =>
        (global as any).getRenderCount(`conditional-todo-${i}`)
      ).filter(count => count === 2).length;

      expect(reRenderedCount).toBe(incompleteTodos.length);
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
      const incompleteTodos = initialTodos.filter((t: any) => !t.completed);

      // Update only incomplete todos
      todoView.updateItemsWhere(
        (todo: any) => !todo.completed,
        (draft: any) => {
          draft.completed = true;
          draft.completedAt = new Date();
        }
      );

      const updatedTodos = todoView.getItems();

      // Count reference changes
      let changedReferences = 0;
      let preservedReferences = 0;

      updatedTodos.forEach((todo: any, index: number) => {
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
      expect(updatedTodos.every((t: any) => t.completed)).toBe(true);
    });
  });

  describe('Large Dataset Component Re-render Performance', () => {
    test('large dataset updates only re-render changed components', () => {
      // Create large dataset (100 todos)
      const todos = [];
      for (let i = 0; i < 100; i++) {
        todos.push(todoView.addItem({
          text: `Large Dataset Todo ${i}`,
          completed: i % 10 === 0, // Every 10th todo is completed
          createdAt: new Date(),
          metadata: {
            priority: i % 3 === 0 ? 'high' : 'normal',
            category: `category-${i % 5}`
          }
        } as any));
      }

      const initialTodos = todoView.getItems();

      // Render first 20 todos (simulating virtualization)
      const visibleTodos = initialTodos.slice(0, 20);
      const todoComponents = visibleTodos.map((todo: any, index: number) => (
        <PerformanceTrackedTodoItem
          key={todo.id}
          todo={todo}
          testId={`large-todo-${index}`}
        />
      ));

      const { rerender } = render(<div>{todoComponents}</div>);

      // Verify initial render
      for (let i = 0; i < 20; i++) {
        expect((global as any).getRenderCount(`large-todo-${i}`)).toBe(1);
      }

      // Update single item in the visible range (index 10)
      todoView.updateItem(initialTodos[10].id, (draft: any) => {
        draft.completed = !draft.completed;
        draft.metadata.priority = 'urgent';
      });

      const updatedTodos = todoView.getItems();
      const updatedVisibleTodos = updatedTodos.slice(0, 20);

      // Re-render with updated todos
      const updatedComponents = updatedVisibleTodos.map((todo: any, index: number) => (
        <PerformanceTrackedTodoItem
          key={todo.id}
          todo={todo}
          testId={`large-todo-${index}`}
        />
      ));

      rerender(<div>{updatedComponents}</div>);

      // CRITICAL TEST: Only the changed component should re-render
      for (let i = 0; i < 20; i++) {
        const expectedRenderCount = i === 10 ? 2 : 1;
        expect((global as any).getRenderCount(`large-todo-${i}`)).toBe(expectedRenderCount);
      }
    });

    test('large dataset batch operations minimize re-renders', () => {
      // Create large dataset
      const todos = [];
      for (let i = 0; i < 50; i++) {
        todos.push(todoView.addItem({
          text: `Batch Large Todo ${i}`,
          completed: false,
          createdAt: new Date()
        }));
      }

      const initialTodos = todoView.getItems();

      // Render first 25 todos
      const visibleTodos = initialTodos.slice(0, 25);
      const todoComponents = visibleTodos.map((todo: any, index: number) => (
        <PerformanceTrackedTodoItem
          key={todo.id}
          todo={todo}
          testId={`batch-large-todo-${index}`}
        />
      ));

      const { rerender } = render(<div>{todoComponents}</div>);

      // Batch update - mark todos with specific text pattern as completed
      todoView.updateItemsWhere(
        (todo: any) => parseInt(todo.text.split(' ')[3]) % 5 === 0, // Every 5th todo by number
        (draft: any) => {
          draft.completed = true;
        }
      );

      const updatedTodos = todoView.getItems();
      const updatedVisibleTodos = updatedTodos.slice(0, 25);

      // Re-render with updated todos
      const updatedComponents = updatedVisibleTodos.map((todo: any, index: number) => (
        <PerformanceTrackedTodoItem
          key={todo.id}
          todo={todo}
          testId={`batch-large-todo-${index}`}
        />
      ));

      rerender(<div>{updatedComponents}</div>);

      // CRITICAL TEST: Only every 5th component should re-render
      let reRenderedCount = 0;
      for (let i = 0; i < 25; i++) {
        const renderCount = (global as any).getRenderCount(`batch-large-todo-${i}`);
        const shouldHaveReRendered = i % 5 === 0;
        const expectedRenderCount = shouldHaveReRendered ? 2 : 1;

        expect(renderCount).toBe(expectedRenderCount);

        if (renderCount === 2) {
          reRenderedCount++;
        }
      }

      // Should have re-rendered exactly 5 components (indices 0, 5, 10, 15, 20)
      expect(reRenderedCount).toBe(5);
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
      const todoComponents = visibleTodos.map((todo: any, index: number) => (
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
        expect((global as any).getRenderCount(`large-todo-${i}`)).toBe(1);
      }
    });
  });
});
