import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TodoItem } from '../TodoItem';
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
    
    todoView = masterStore.getView('todos');
  });

  describe('Individual TodoItem Rendering Optimization', () => {
    test('TodoItem only re-renders when its own data changes', async () => {
      const user = userEvent.setup();
      
      // Create multiple todos
      const todo1 = todoView.addItem({ text: 'Todo 1', completed: false, createdAt: new Date() });
      const todo2 = todoView.addItem({ text: 'Todo 2', completed: false, createdAt: new Date() });
      const todo3 = todoView.addItem({ text: 'Todo 3', completed: false, createdAt: new Date() });
      
      const todos = todoView.getItems();
      
      render(
        <div>
          <PerformanceTrackedTodoItem todo={todos[0]} testId="todo-1" />
          <PerformanceTrackedTodoItem todo={todos[1]} testId="todo-2" />
          <PerformanceTrackedTodoItem todo={todos[2]} testId="todo-3" />
        </div>
      );
      
      // Initial render count
      expect(global.getRenderCount('todo-1')).toBe(1);
      expect(global.getRenderCount('todo-2')).toBe(1);
      expect(global.getRenderCount('todo-3')).toBe(1);
      
      // Update only todo-2
      todoView.updateItem(todo2.id, (draft: any) => {
        draft.completed = true;
      });
      
      // Force re-render by updating component props
      const updatedTodos = todoView.getItems();
      render(
        <div>
          <PerformanceTrackedTodoItem todo={updatedTodos[0]} testId="todo-1" />
          <PerformanceTrackedTodoItem todo={updatedTodos[1]} testId="todo-2" />
          <PerformanceTrackedTodoItem todo={updatedTodos[2]} testId="todo-3" />
        </div>
      );
      
      // Only todo-2 should have re-rendered due to structural sharing
      expect(global.getRenderCount('todo-1')).toBe(1); // No change, same reference
      expect(global.getRenderCount('todo-2')).toBe(2); // Changed, new reference
      expect(global.getRenderCount('todo-3')).toBe(1); // No change, same reference
    });

    test('nested property changes only affect relevant TodoItems', () => {
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
      
      const todos = todoView.getItems();
      
      render(
        <div>
          <PerformanceTrackedTodoItem todo={todos[0]} testId="complex-todo-1" />
          <PerformanceTrackedTodoItem todo={todos[1]} testId="complex-todo-2" />
        </div>
      );
      
      // Update nested property in todo1 only
      todoView.updateItem(todo1.id, (draft: any) => {
        draft.metadata.priority = 'urgent';
        draft.metadata.assignee.name = 'Alice Updated';
      });
      
      const updatedTodos = todoView.getItems();
      
      render(
        <div>
          <PerformanceTrackedTodoItem todo={updatedTodos[0]} testId="complex-todo-1" />
          <PerformanceTrackedTodoItem todo={updatedTodos[1]} testId="complex-todo-2" />
        </div>
      );
      
      // Only the modified todo should re-render
      expect(global.getRenderCount('complex-todo-1')).toBe(2);
      expect(global.getRenderCount('complex-todo-2')).toBe(1);
    });
  });

  describe('Batch Update Rendering Performance', () => {
    test('batch updates minimize re-renders', () => {
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
      
      // Render all TodoItems
      const todoComponents = initialTodos.map((todo, index) => (
        <PerformanceTrackedTodoItem 
          key={todo.id} 
          todo={todo} 
          testId={`batch-todo-${index}`} 
        />
      ));
      
      render(<div>{todoComponents}</div>);
      
      // Batch update - mark first 5 as completed
      todoView.updateItems((draft: any) => {
        draft.slice(0, 5).forEach((todo: any) => {
          todo.completed = true;
        });
      });
      
      const updatedTodos = todoView.getItems();
      
      // Re-render with updated todos
      const updatedComponents = updatedTodos.map((todo, index) => (
        <PerformanceTrackedTodoItem 
          key={todo.id} 
          todo={todo} 
          testId={`batch-todo-${index}`} 
        />
      ));
      
      render(<div>{updatedComponents}</div>);
      
      // Only first 5 should have re-rendered
      for (let i = 0; i < 10; i++) {
        const expectedRenderCount = i < 5 ? 2 : 1;
        expect(global.getRenderCount(`batch-todo-${i}`)).toBe(expectedRenderCount);
      }
    });

    test('conditional batch updates are selective', () => {
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
      
      // Render all TodoItems
      const todoComponents = initialTodos.map((todo, index) => (
        <PerformanceTrackedTodoItem 
          key={todo.id} 
          todo={todo} 
          testId={`conditional-todo-${index}`} 
        />
      ));
      
      render(<div>{todoComponents}</div>);
      
      // Update only incomplete todos
      todoView.updateItemsWhere(
        (todo) => !todo.completed,
        (draft: any) => {
          draft.completed = true;
          draft.completedAt = new Date();
        }
      );
      
      const updatedTodos = todoView.getItems();
      
      // Re-render with updated todos
      const updatedComponents = updatedTodos.map((todo, index) => (
        <PerformanceTrackedTodoItem 
          key={todo.id} 
          todo={todo} 
          testId={`conditional-todo-${index}`} 
        />
      ));
      
      render(<div>{updatedComponents}</div>);
      
      // Count actual re-renders
      let reRenderedCount = 0;
      let preservedCount = 0;
      
      for (let i = 0; i < 20; i++) {
        const renderCount = global.getRenderCount(`conditional-todo-${i}`);
        if (renderCount === 2) {
          reRenderedCount++;
        } else if (renderCount === 1) {
          preservedCount++;
        }
      }
      
      // Should match the number of incomplete todos
      expect(reRenderedCount).toBe(incompleteTodos.length);
      expect(preservedCount).toBe(20 - incompleteTodos.length);
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
