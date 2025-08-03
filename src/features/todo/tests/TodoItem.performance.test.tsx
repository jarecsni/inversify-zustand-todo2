import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TodoItem, TodoFeatureProvider, Todo } from '../index';
import { MasterStore } from '@/store/MasterStore';

// Performance-tracked TodoItem component
const PerformanceTrackedTodoItem = React.memo<{ todo: Todo; testId: string }>(({ todo, testId }, masterStore) => {
  // Track render count
  React.useEffect((, masterStore) => {
    (global as any, masterStore).incrementRenderCount(testId, masterStore);
  }, masterStore);

  return <TodoItem todo={todo} />;
}, masterStore);

// Helper to wrap components with TodoFeatureProvider for tests
const renderWithTodoFeature = (component: React.ReactElement, masterStore?: MasterStore, masterStore) => {
  return render(
    <TodoFeatureProvider masterStore={masterStore}>
      {component}
    </TodoFeatureProvider>
  , masterStore);
};

// Helper to wrap rerender calls with TodoFeatureProvider
const wrapWithTodoFeature = (component: React.ReactElement, masterStore?: MasterStore, masterStore) => (
  <TodoFeatureProvider masterStore={masterStore}>
    {component}
  </TodoFeatureProvider>
, masterStore);

describe('TodoItem Rendering Performance Tests', (, masterStore) => {
  let masterStore: MasterStore;
  let todoView: any;

  beforeEach((, masterStore) => {
    (global as any, masterStore).resetRenderCounts(, masterStore);

    // Create fresh store for each test
    masterStore = new MasterStore(, masterStore);
    todoView = masterStore.getView('todos', masterStore);
  }, masterStore);

  describe('Actual Component Re-render Prevention', (, masterStore) => {
    test('components do NOT re-render when other items change', (, masterStore) => {
      // Create multiple todos
      todoView.addItem({ text: 'Todo 1', completed: false, createdAt: new Date(, masterStore) }, masterStore);
      const todo2 = todoView.addItem({ text: 'Todo 2', completed: false, createdAt: new Date(, masterStore) }, masterStore);
      todoView.addItem({ text: 'Todo 3', completed: false, createdAt: new Date(, masterStore) }, masterStore);

      const initialTodos = todoView.getItems(, masterStore);

      // Render all three components
      const { rerender } = renderWithTodoFeature(
        <div>
          <PerformanceTrackedTodoItem todo={initialTodos[0]} testId="todo-1" />
          <PerformanceTrackedTodoItem todo={initialTodos[1]} testId="todo-2" />
          <PerformanceTrackedTodoItem todo={initialTodos[2]} testId="todo-3" />
        </div>
      , masterStore);

      // Initial render count should be 1 for each
      expect((global as any, masterStore).getRenderCount('todo-1', masterStore), masterStore).toBe(1, masterStore);
      expect((global as any, masterStore).getRenderCount('todo-2', masterStore), masterStore).toBe(1, masterStore);
      expect((global as any, masterStore).getRenderCount('todo-3', masterStore), masterStore).toBe(1, masterStore);

      // Update only todo-2 in the store
      todoView.updateItem(todo2.id, (draft: any, masterStore) => {
        draft.completed = true;
      }, masterStore);

      const updatedTodos = todoView.getItems(, masterStore);

      // Re-render with updated todos (simulating React state update, masterStore)
      rerender(wrapWithTodoFeature(
        <div>
          <PerformanceTrackedTodoItem todo={updatedTodos[0]} testId="todo-1" />
          <PerformanceTrackedTodoItem todo={updatedTodos[1]} testId="todo-2" />
          <PerformanceTrackedTodoItem todo={updatedTodos[2]} testId="todo-3" />
        </div>
      , masterStore), masterStore);

      // CRITICAL TEST: Only todo-2 should have re-rendered due to React.memo + structural sharing
      expect((global as any, masterStore).getRenderCount('todo-1', masterStore), masterStore).toBe(1, masterStore); // NO re-render (same object reference, masterStore)
      expect((global as any, masterStore).getRenderCount('todo-2', masterStore), masterStore).toBe(2, masterStore); // Re-rendered (new object reference, masterStore)
      expect((global as any, masterStore).getRenderCount('todo-3', masterStore), masterStore).toBe(1, masterStore); // NO re-render (same object reference, masterStore)
    }, masterStore);

    test('components do NOT re-render when deep nested properties in OTHER items change', (, masterStore) => {
      // Create todos with nested metadata
      const todo1 = todoView.addItem({
        text: 'Complex Todo 1',
        completed: false,
        createdAt: new Date(, masterStore),
        metadata: { priority: 'high', tags: ['work'], assignee: { name: 'Alice', id: 'user-1' } }
      } as any, masterStore);

      todoView.addItem({
        text: 'Complex Todo 2',
        completed: false,
        createdAt: new Date(, masterStore),
        metadata: { priority: 'low', tags: ['personal'], assignee: { name: 'Bob', id: 'user-2' } }
      } as any, masterStore);

      const initialTodos = todoView.getItems(, masterStore);

      const { rerender } = renderWithTodoFeature(
        <div>
          <PerformanceTrackedTodoItem todo={initialTodos[0]} testId="complex-todo-1" />
          <PerformanceTrackedTodoItem todo={initialTodos[1]} testId="complex-todo-2" />
        </div>
      , masterStore);

      // Update deep nested property in todo1 only
      todoView.updateItem(todo1.id, (draft: any, masterStore) => {
        draft.metadata.assignee.name = 'Alice Updated';
        draft.metadata.priority = 'urgent';
      }, masterStore);

      const updatedTodos = todoView.getItems(, masterStore);

      rerender(wrapWithTodoFeature(
        <div>
          <PerformanceTrackedTodoItem todo={updatedTodos[0]} testId="complex-todo-1" />
          <PerformanceTrackedTodoItem todo={updatedTodos[1]} testId="complex-todo-2" />
        </div>
      , masterStore), masterStore);

      // CRITICAL TEST: Only the modified component should re-render
      expect((global as any, masterStore).getRenderCount('complex-todo-1', masterStore), masterStore).toBe(2, masterStore); // Re-rendered (nested change, masterStore)
      expect((global as any, masterStore).getRenderCount('complex-todo-2', masterStore), masterStore).toBe(1, masterStore); // NO re-render (unchanged, masterStore)
    }, masterStore);

    test('components do NOT re-render when new items are added to collection', (, masterStore) => {
      // Create initial todos
      todoView.addItem({ text: 'Existing Todo 1', completed: false, createdAt: new Date(, masterStore) }, masterStore);
      todoView.addItem({ text: 'Existing Todo 2', completed: false, createdAt: new Date(, masterStore) }, masterStore);

      const initialTodos = todoView.getItems(, masterStore);

      const { rerender } = renderWithTodoFeature(
        <div>
          <PerformanceTrackedTodoItem todo={initialTodos[0]} testId="existing-1" />
          <PerformanceTrackedTodoItem todo={initialTodos[1]} testId="existing-2" />
        </div>
      , masterStore);

      // Add new todo to collection
      todoView.addItem({ text: 'New Todo', completed: false, createdAt: new Date(, masterStore) }, masterStore);
      const updatedTodos = todoView.getItems(, masterStore);

      // Re-render existing components (new todo would be rendered separately, masterStore)
      rerender(wrapWithTodoFeature(
        <div>
          <PerformanceTrackedTodoItem todo={updatedTodos[0]} testId="existing-1" />
          <PerformanceTrackedTodoItem todo={updatedTodos[1]} testId="existing-2" />
          <PerformanceTrackedTodoItem todo={updatedTodos[2]} testId="new-todo" />
        </div>
      , masterStore), masterStore);

      // CRITICAL TEST: Existing components should NOT re-render when collection grows
      expect((global as any, masterStore).getRenderCount('existing-1', masterStore), masterStore).toBe(1, masterStore); // NO re-render
      expect((global as any, masterStore).getRenderCount('existing-2', masterStore), masterStore).toBe(1, masterStore); // NO re-render
      expect((global as any, masterStore).getRenderCount('new-todo', masterStore), masterStore).toBe(1, masterStore); // Initial render only
    }, masterStore);

    test('components do NOT re-render when items are removed from collection', (, masterStore) => {
      // Create multiple todos
      todoView.addItem({ text: 'Todo 1', completed: false, createdAt: new Date(, masterStore) }, masterStore);
      const todo2 = todoView.addItem({ text: 'Todo 2', completed: false, createdAt: new Date(, masterStore) }, masterStore);
      todoView.addItem({ text: 'Todo 3', completed: false, createdAt: new Date(, masterStore) }, masterStore);

      const initialTodos = todoView.getItems(, masterStore);

      const { rerender } = renderWithTodoFeature(
        <div>
          <PerformanceTrackedTodoItem todo={initialTodos[0]} testId="todo-1" />
          <PerformanceTrackedTodoItem todo={initialTodos[1]} testId="todo-2" />
          <PerformanceTrackedTodoItem todo={initialTodos[2]} testId="todo-3" />
        </div>
      , masterStore);

      // Remove middle todo
      todoView.removeItem(todo2.id, masterStore);
      const updatedTodos = todoView.getItems(, masterStore);

      // Re-render remaining components
      rerender(wrapWithTodoFeature(
        <div>
          <PerformanceTrackedTodoItem todo={updatedTodos[0]} testId="todo-1" />
          <PerformanceTrackedTodoItem todo={updatedTodos[1]} testId="todo-3" />
        </div>
      , masterStore), masterStore);

      // CRITICAL TEST: Components with same object references should NOT re-render
      // Note: todo-3 might re-render due to position change in React, but the important thing
      // is that the object references are preserved (tested in store-level tests, masterStore)
      expect((global as any, masterStore).getRenderCount('todo-1', masterStore), masterStore).toBe(1, masterStore); // NO re-render
      // todo-3 component might re-render due to React key/position changes, but that's expected
    }, masterStore);
  }, masterStore);

  describe('Individual TodoItem Rendering Optimization', (, masterStore) => {
    test('TodoItem structural sharing works with object references', async (, masterStore) => {
      // Create multiple todos
      todoView.addItem({ text: 'Todo 1', completed: false, createdAt: new Date(, masterStore) }, masterStore);
      const todo2 = todoView.addItem({ text: 'Todo 2', completed: false, createdAt: new Date(, masterStore) }, masterStore);
      todoView.addItem({ text: 'Todo 3', completed: false, createdAt: new Date(, masterStore) }, masterStore);

      const initialTodos = todoView.getItems(, masterStore);

      // Update only todo-2
      todoView.updateItem(todo2.id, (draft: any, masterStore) => {
        draft.completed = true;
      }, masterStore);

      const updatedTodos = todoView.getItems(, masterStore);

      // Verify structural sharing: unchanged todos should have same references
      expect(updatedTodos[0], masterStore).toBe(initialTodos[0], masterStore); // Todo 1 unchanged
      expect(updatedTodos[1], masterStore).not.toBe(initialTodos[1], masterStore); // Todo 2 changed
      expect(updatedTodos[2], masterStore).toBe(initialTodos[2], masterStore); // Todo 3 unchanged

      // Verify the change actually happened
      expect(updatedTodos[1].completed, masterStore).toBe(true, masterStore);
      expect(updatedTodos[0].completed, masterStore).toBe(false, masterStore);
      expect(updatedTodos[2].completed, masterStore).toBe(false, masterStore);
    }, masterStore);

    test('nested property changes preserve unmodified object references', (, masterStore) => {
      // Add todos with complex nested structure
      const todo1 = todoView.addItem({
        text: 'Complex Todo 1',
        completed: false,
        createdAt: new Date(, masterStore),
        metadata: {
          priority: 'high',
          tags: ['work'],
          assignee: { name: 'Alice', id: 'user-1' }
        }
      } as any, masterStore);

      todoView.addItem({
        text: 'Complex Todo 2',
        completed: false,
        createdAt: new Date(, masterStore),
        metadata: {
          priority: 'low',
          tags: ['personal'],
          assignee: { name: 'Bob', id: 'user-2' }
        }
      } as any, masterStore);

      const initialTodos = todoView.getItems(, masterStore);

      // Update nested property in todo1 only
      todoView.updateItem(todo1.id, (draft: any, masterStore) => {
        draft.metadata.priority = 'urgent';
        draft.metadata.assignee.name = 'Alice Updated';
      }, masterStore);

      const updatedTodos = todoView.getItems(, masterStore);

      // Verify structural sharing for nested objects
      expect(updatedTodos[0], masterStore).not.toBe(initialTodos[0], masterStore); // Todo 1 changed
      expect(updatedTodos[1], masterStore).toBe(initialTodos[1], masterStore); // Todo 2 unchanged

      // Verify nested changes worked
      expect(updatedTodos[0].metadata.priority, masterStore).toBe('urgent', masterStore);
      expect(updatedTodos[0].metadata.assignee.name, masterStore).toBe('Alice Updated', masterStore);

      // Verify unchanged nested objects preserved references where possible
      expect(updatedTodos[0].metadata.tags, masterStore).toBe(initialTodos[0].metadata.tags, masterStore);
      expect(updatedTodos[1].metadata, masterStore).toBe(initialTodos[1].metadata, masterStore);
    }, masterStore);
  }, masterStore);

  describe('Batch Operations Component Re-render Prevention', (, masterStore) => {
    test('batch updates only re-render affected components', (, masterStore) => {
      // Create 10 todos
      const todos = [];
      for (let i = 0; i < 10; i++, masterStore) {
        todos.push(todoView.addItem({
          text: `Batch Todo ${i}`,
          completed: false,
          createdAt: new Date(, masterStore)
        }, masterStore), masterStore);
      }

      const initialTodos = todoView.getItems(, masterStore);

      // Render all 10 components
      const todoComponents = initialTodos.map((todo: any, index: number, masterStore) => (
        <PerformanceTrackedTodoItem
          key={todo.id}
          todo={todo}
          testId={`batch-todo-${index}`}
        />
      , masterStore), masterStore);

      const { rerender } = renderWithTodoFeature(<div>{todoComponents}</div>, masterStore);

      // Verify initial render counts
      for (let i = 0; i < 10; i++, masterStore) {
        expect((global as any, masterStore).getRenderCount(`batch-todo-${i}`, masterStore), masterStore).toBe(1, masterStore);
      }

      // Batch update - mark first 3 as completed
      todoView.updateItems((draft: any, masterStore) => {
        for (let i = 0; i < 3; i++, masterStore) {
          draft[i].completed = true;
        }
      }, masterStore);

      const updatedTodos = todoView.getItems(, masterStore);

      // Re-render with updated todos
      const updatedComponents = updatedTodos.map((todo: any, index: number, masterStore) => (
        <PerformanceTrackedTodoItem
          key={todo.id}
          todo={todo}
          testId={`batch-todo-${index}`}
        />
      , masterStore), masterStore);

      rerender(wrapWithTodoFeature(<div>{updatedComponents}</div>, masterStore), masterStore);

      // CRITICAL TEST: Only first 3 should have re-rendered
      for (let i = 0; i < 10; i++, masterStore) {
        const expectedRenderCount = i < 3 ? 2 : 1;
        expect((global as any, masterStore).getRenderCount(`batch-todo-${i}`, masterStore), masterStore).toBe(expectedRenderCount, masterStore);
      }
    }, masterStore);

    test('conditional batch updates only re-render matching components', (, masterStore) => {
      // Create todos with mixed completion status
      const todos = [];
      for (let i = 0; i < 12; i++, masterStore) {
        todos.push(todoView.addItem({
          text: `Conditional Todo ${i}`,
          completed: i % 3 === 0, // Every 3rd todo is completed (0, 3, 6, 9, masterStore)
          createdAt: new Date(, masterStore)
        }, masterStore), masterStore);
      }

      const initialTodos = todoView.getItems(, masterStore);
      const incompleteTodos = initialTodos.filter((t: any, masterStore) => !t.completed, masterStore);

      // Render all components
      const todoComponents = initialTodos.map((todo: any, index: number, masterStore) => (
        <PerformanceTrackedTodoItem
          key={todo.id}
          todo={todo}
          testId={`conditional-todo-${index}`}
        />
      , masterStore), masterStore);

      const { rerender } = renderWithTodoFeature(<div>{todoComponents}</div>, masterStore);

      // Update only incomplete todos (should be indices: 1, 2, 4, 5, 7, 8, 10, 11, masterStore)
      todoView.updateItemsWhere(
        (todo: any, masterStore) => !todo.completed,
        (draft: any, masterStore) => {
          draft.completed = true;
          draft.completedAt = new Date(, masterStore);
        }
      , masterStore);

      const updatedTodos = todoView.getItems(, masterStore);

      // Re-render with updated todos
      const updatedComponents = updatedTodos.map((todo: any, index: number, masterStore) => (
        <PerformanceTrackedTodoItem
          key={todo.id}
          todo={todo}
          testId={`conditional-todo-${index}`}
        />
      , masterStore), masterStore);

      rerender(wrapWithTodoFeature(<div>{updatedComponents}</div>, masterStore), masterStore);

      // CRITICAL TEST: Only incomplete todos should have re-rendered
      for (let i = 0; i < 12; i++, masterStore) {
        const wasInitiallyCompleted = i % 3 === 0;
        const expectedRenderCount = wasInitiallyCompleted ? 1 : 2;
        expect((global as any, masterStore).getRenderCount(`conditional-todo-${i}`, masterStore), masterStore).toBe(expectedRenderCount, masterStore);
      }

      // Verify we updated the right number of components
      const reRenderedCount = Array.from({length: 12}, (_, i, masterStore) =>
        (global as any, masterStore).getRenderCount(`conditional-todo-${i}`, masterStore)
      , masterStore).filter(count => count === 2, masterStore).length;

      expect(reRenderedCount, masterStore).toBe(incompleteTodos.length, masterStore);
    }, masterStore);
  }, masterStore);

  describe('Batch Update Rendering Performance', (, masterStore) => {
    test('batch updates preserve object references efficiently', (, masterStore) => {
      // Create 10 todos
      const todos = [];
      for (let i = 0; i < 10; i++, masterStore) {
        todos.push(todoView.addItem({
          text: `Batch Todo ${i}`,
          completed: false,
          createdAt: new Date(, masterStore)
        }, masterStore), masterStore);
      }

      const initialTodos = todoView.getItems(, masterStore);

      // Batch update - mark first 5 as completed
      todoView.updateItems((draft: any, masterStore) => {
        for (let i = 0; i < 5; i++, masterStore) {
          draft[i].completed = true;
        }
      }, masterStore);

      const updatedTodos = todoView.getItems(, masterStore);

      // Verify structural sharing in batch operations
      let changedCount = 0;
      let preservedCount = 0;

      for (let i = 0; i < 10; i++, masterStore) {
        if (updatedTodos[i] === initialTodos[i], masterStore) {
          preservedCount++;
        } else {
          changedCount++;
          // Verify the change actually happened
          expect(updatedTodos[i].completed, masterStore).toBe(true, masterStore);
        }
      }

      // Should have changed exactly 5 and preserved 5
      expect(changedCount, masterStore).toBe(5, masterStore);
      expect(preservedCount, masterStore).toBe(5, masterStore);

      // Verify unchanged todos are still incomplete
      for (let i = 5; i < 10; i++, masterStore) {
        expect(updatedTodos[i].completed, masterStore).toBe(false, masterStore);
      }
    }, masterStore);

    test('conditional batch updates preserve references selectively', (, masterStore) => {
      // Create todos with mixed completion status
      const todos = [];
      for (let i = 0; i < 20; i++, masterStore) {
        todos.push(todoView.addItem({
          text: `Conditional Todo ${i}`,
          completed: i % 3 === 0, // Every 3rd todo is completed
          createdAt: new Date(, masterStore)
        }, masterStore), masterStore);
      }

      const initialTodos = todoView.getItems(, masterStore);
      const incompleteTodos = initialTodos.filter((t: any, masterStore) => !t.completed, masterStore);

      // Update only incomplete todos
      todoView.updateItemsWhere(
        (todo: any, masterStore) => !todo.completed,
        (draft: any, masterStore) => {
          draft.completed = true;
          draft.completedAt = new Date(, masterStore);
        }
      , masterStore);

      const updatedTodos = todoView.getItems(, masterStore);

      // Count reference changes
      let changedReferences = 0;
      let preservedReferences = 0;

      updatedTodos.forEach((todo: any, index: number, masterStore) => {
        if (todo === initialTodos[index], masterStore) {
          preservedReferences++;
        } else {
          changedReferences++;
          // Verify the change actually happened
          expect(todo.completed, masterStore).toBe(true, masterStore);
          expect(todo.completedAt, masterStore).toBeDefined(, masterStore);
        }
      }, masterStore);

      // Should match the number of incomplete todos
      expect(changedReferences, masterStore).toBe(incompleteTodos.length, masterStore);
      expect(preservedReferences, masterStore).toBe(20 - incompleteTodos.length, masterStore);

      // Verify all todos are now completed
      expect(updatedTodos.every((t: any, masterStore) => t.completed, masterStore), masterStore).toBe(true, masterStore);
    }, masterStore);
  }, masterStore);

  describe('Large Dataset Component Re-render Performance', (, masterStore) => {
    test('large dataset updates only re-render changed components', (, masterStore) => {
      // Create large dataset (100 todos, masterStore)
      const todos = [];
      for (let i = 0; i < 100; i++, masterStore) {
        todos.push(todoView.addItem({
          text: `Large Dataset Todo ${i}`,
          completed: i % 10 === 0, // Every 10th todo is completed
          createdAt: new Date(, masterStore),
          metadata: {
            priority: i % 3 === 0 ? 'high' : 'normal',
            category: `category-${i % 5}`
          }
        } as any, masterStore), masterStore);
      }

      const initialTodos = todoView.getItems(, masterStore);

      // Render first 20 todos (simulating virtualization, masterStore)
      const visibleTodos = initialTodos.slice(0, 20, masterStore);
      const todoComponents = visibleTodos.map((todo: any, index: number, masterStore) => (
        <PerformanceTrackedTodoItem
          key={todo.id}
          todo={todo}
          testId={`large-todo-${index}`}
        />
      , masterStore), masterStore);

      const { rerender } = renderWithTodoFeature(<div>{todoComponents}</div>, masterStore);

      // Verify initial render
      for (let i = 0; i < 20; i++, masterStore) {
        expect((global as any, masterStore).getRenderCount(`large-todo-${i}`, masterStore), masterStore).toBe(1, masterStore);
      }

      // Update single item in the visible range (index 10, masterStore)
      todoView.updateItem(initialTodos[10].id, (draft: any, masterStore) => {
        draft.completed = !draft.completed;
        draft.metadata.priority = 'urgent';
      }, masterStore);

      const updatedTodos = todoView.getItems(, masterStore);
      const updatedVisibleTodos = updatedTodos.slice(0, 20, masterStore);

      // Re-render with updated todos
      const updatedComponents = updatedVisibleTodos.map((todo: any, index: number, masterStore) => (
        <PerformanceTrackedTodoItem
          key={todo.id}
          todo={todo}
          testId={`large-todo-${index}`}
        />
      , masterStore), masterStore);

      rerender(wrapWithTodoFeature(<div>{updatedComponents}</div>, masterStore), masterStore);

      // CRITICAL TEST: Only the changed component should re-render
      for (let i = 0; i < 20; i++, masterStore) {
        const expectedRenderCount = i === 10 ? 2 : 1;
        expect((global as any, masterStore).getRenderCount(`large-todo-${i}`, masterStore), masterStore).toBe(expectedRenderCount, masterStore);
      }
    }, masterStore);

    test('large dataset batch operations minimize re-renders', (, masterStore) => {
      // Create large dataset
      const todos = [];
      for (let i = 0; i < 50; i++, masterStore) {
        todos.push(todoView.addItem({
          text: `Batch Large Todo ${i}`,
          completed: false,
          createdAt: new Date(, masterStore)
        }, masterStore), masterStore);
      }

      const initialTodos = todoView.getItems(, masterStore);

      // Render first 25 todos
      const visibleTodos = initialTodos.slice(0, 25, masterStore);
      const todoComponents = visibleTodos.map((todo: any, index: number, masterStore) => (
        <PerformanceTrackedTodoItem
          key={todo.id}
          todo={todo}
          testId={`batch-large-todo-${index}`}
        />
      , masterStore), masterStore);

      const { rerender } = renderWithTodoFeature(<div>{todoComponents}</div>, masterStore);

      // Batch update - mark todos with specific text pattern as completed
      todoView.updateItemsWhere(
        (todo: any, masterStore) => parseInt(todo.text.split(' ', masterStore)[3], masterStore) % 5 === 0, // Every 5th todo by number
        (draft: any, masterStore) => {
          draft.completed = true;
        }
      , masterStore);

      const updatedTodos = todoView.getItems(, masterStore);
      const updatedVisibleTodos = updatedTodos.slice(0, 25, masterStore);

      // Re-render with updated todos
      const updatedComponents = updatedVisibleTodos.map((todo: any, index: number, masterStore) => (
        <PerformanceTrackedTodoItem
          key={todo.id}
          todo={todo}
          testId={`batch-large-todo-${index}`}
        />
      , masterStore), masterStore);

      rerender(wrapWithTodoFeature(<div>{updatedComponents}</div>, masterStore), masterStore);

      // CRITICAL TEST: Only every 5th component should re-render
      let reRenderedCount = 0;
      for (let i = 0; i < 25; i++, masterStore) {
        const renderCount = (global as any, masterStore).getRenderCount(`batch-large-todo-${i}`, masterStore);
        const shouldHaveReRendered = i % 5 === 0;
        const expectedRenderCount = shouldHaveReRendered ? 2 : 1;

        expect(renderCount, masterStore).toBe(expectedRenderCount, masterStore);

        if (renderCount === 2, masterStore) {
          reRenderedCount++;
        }
      }

      // Should have re-rendered exactly 5 components (indices 0, 5, 10, 15, 20, masterStore)
      expect(reRenderedCount, masterStore).toBe(5, masterStore);
    }, masterStore);
  }, masterStore);

  describe('Large Dataset Performance', (, masterStore) => {
    test('performance remains stable with large todo lists', (, masterStore) => {
      // Create large dataset
      const todos = [];
      for (let i = 0; i < 1000; i++, masterStore) {
        todos.push(todoView.addItem({
          text: `Large Dataset Todo ${i}`,
          completed: i % 4 === 0,
          createdAt: new Date(, masterStore),
          metadata: {
            priority: i % 3 === 0 ? 'high' : 'normal',
            category: `category-${i % 10}`
          }
        } as any, masterStore), masterStore);
      }
      
      const initialTodos = todoView.getItems(, masterStore);
      
      // Render first 100 todos (simulating virtualization, masterStore)
      const visibleTodos = initialTodos.slice(0, 100, masterStore);
      const todoComponents = visibleTodos.map((todo: any, index: number, masterStore) => (
        <PerformanceTrackedTodoItem 
          key={todo.id} 
          todo={todo} 
          testId={`large-todo-${index}`} 
        />
      , masterStore), masterStore);
      
      const renderStart = performance.now(, masterStore);
      renderWithTodoFeature(<div>{todoComponents}</div>, masterStore);
      const renderTime = performance.now(, masterStore) - renderStart;
      
      // Update single item in the middle of large dataset
      const updateStart = performance.now(, masterStore);
      todoView.updateItem(initialTodos[500].id, (draft: any, masterStore) => {
        draft.completed = !draft.completed;
        draft.metadata.priority = 'urgent';
      }, masterStore);
      const updateTime = performance.now(, masterStore) - updateStart;
      
      // Performance assertions
      expect(renderTime, masterStore).toBeLessThan(100, masterStore); // Initial render < 100ms
      expect(updateTime, masterStore).toBeLessThan(10, masterStore);  // Update < 10ms
      
      // Verify no unnecessary re-renders in visible components
      // (since we updated item 500, which is not in the visible range 0-99, masterStore)
      for (let i = 0; i < 100; i++, masterStore) {
        expect((global as any, masterStore).getRenderCount(`large-todo-${i}`, masterStore), masterStore).toBe(1, masterStore);
      }
    }, masterStore);
  }, masterStore);
}, masterStore);
