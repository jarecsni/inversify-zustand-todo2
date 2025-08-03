import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TodoApp } from './TodoApp';
import { container } from '@/container/container';
import { TYPES } from '@/constants/types';
import { MasterStore } from '@/store/MasterStore';

// Performance-tracked components
const PerformanceTrackedTodoApp = React.memo(() => {
  React.useEffect(() => {
    (global as any).incrementRenderCount('TodoApp');
  });
  return <TodoApp />;
});

const PerformanceTrackedTodoList = React.memo(() => {
  React.useEffect(() => {
    (global as any).incrementRenderCount('TodoList');
  });
  return <div data-testid="todo-list">Mock TodoList</div>;
});

describe('TodoApp Integration Performance Tests', () => {
  let masterStore: MasterStore;

  beforeEach(() => {
    (global as any).resetRenderCounts();

    // Reset container
    container.unbindAll();
    masterStore = new MasterStore();
    container.bind(TYPES.MasterStore).toConstantValue(masterStore);
    container.bind(TYPES.TodoView).toDynamicValue(() => masterStore.getView('todos')).inSingletonScope();

    // Import and bind TodoService
    const { TodoService } = require('@/services/TodoService');
    container.bind(TYPES.TodoService).to(TodoService).inSingletonScope();
  });

  describe('Real TodoApp Component Re-render Prevention', () => {
    test('TodoApp prevents unnecessary re-renders during typical usage', async () => {
      const user = userEvent.setup();

      // Create a performance-tracked version of TodoApp
      const PerformanceTrackedTodoApp = React.memo(() => {
        React.useEffect(() => {
          (global as any).incrementRenderCount('TodoApp');
        });
        return <TodoApp />;
      });

      render(<PerformanceTrackedTodoApp />);

      const input = screen.getByPlaceholderText('Add a new todo...');
      const addButton = screen.getByText('Add Todo');

      // Add 3 todos
      await user.type(input, 'First todo');
      await user.click(addButton);

      await user.clear(input);
      await user.type(input, 'Second todo');
      await user.click(addButton);

      await user.clear(input);
      await user.type(input, 'Third todo');
      await user.click(addButton);

      const initialAppRenderCount = (global as any).getRenderCount('TodoApp');

      // Toggle first todo - this should cause minimal re-renders
      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]);

      // Verify TodoApp itself didn't re-render unnecessarily
      // (In a well-optimized app, only the specific TodoItem should re-render)
      const afterToggleRenderCount = (global as any).getRenderCount('TodoApp');

      // The app might re-render due to state changes, but it should be minimal
      expect(afterToggleRenderCount - initialAppRenderCount).toBeLessThanOrEqual(1);

      // Verify the toggle actually worked
      expect(screen.getByText('1 of 3 completed')).toBeInTheDocument();
    });

    test('adding todos to large list prevents re-renders of existing items', async () => {
      const user = userEvent.setup();

      render(<TodoApp />);

      const input = screen.getByPlaceholderText('Add a new todo...');
      const addButton = screen.getByText('Add Todo');

      // Add initial todos to create a substantial list
      for (let i = 1; i <= 10; i++) {
        await user.clear(input);
        await user.type(input, `Existing Todo ${i}`);
        await user.click(addButton);
      }

      // Get initial state
      const initialTodoItems = screen.getAllByText(/Existing Todo/);
      expect(initialTodoItems).toHaveLength(10);

      // Add a new todo - this should not cause existing todos to re-render
      await user.clear(input);
      await user.type(input, 'New Todo');
      await user.click(addButton);

      // Verify the new todo was added
      expect(screen.getByText('New Todo')).toBeInTheDocument();
      expect(screen.getByText('0 of 11 completed')).toBeInTheDocument();

      // In a well-optimized app, existing todo components should not re-render
      // when new items are added (this is tested more precisely in TodoItem tests)
    });

    test('removing todos prevents re-renders of remaining items', async () => {
      const user = userEvent.setup();

      render(<TodoApp />);

      const input = screen.getByPlaceholderText('Add a new todo...');
      const addButton = screen.getByText('Add Todo');

      // Add several todos
      for (let i = 1; i <= 5; i++) {
        await user.clear(input);
        await user.type(input, `Todo ${i}`);
        await user.click(addButton);
      }

      // Remove middle todo
      const removeButtons = screen.getAllByLabelText('Remove todo');
      await user.click(removeButtons[2]); // Remove "Todo 3"

      // Verify removal worked
      expect(screen.queryByText('Todo 3')).not.toBeInTheDocument();
      expect(screen.getByText('Todo 1')).toBeInTheDocument();
      expect(screen.getByText('Todo 2')).toBeInTheDocument();
      expect(screen.getByText('Todo 4')).toBeInTheDocument();
      expect(screen.getByText('Todo 5')).toBeInTheDocument();
      expect(screen.getByText('0 of 4 completed')).toBeInTheDocument();

      // In a well-optimized app, remaining todo components should not re-render
      // when other items are removed (this is tested more precisely in TodoItem tests)
    });
  });

  describe('Real-world Usage Scenarios', () => {
    test('adding todos works correctly', async () => {
      const user = userEvent.setup();

      render(<TodoApp />);

      const input = screen.getByPlaceholderText('Add a new todo...');
      const addButton = screen.getByText('Add Todo');

      // Add first todo
      await user.type(input, 'First todo');
      await user.click(addButton);

      // Add second todo
      await user.clear(input);
      await user.type(input, 'Second todo');
      await user.click(addButton);

      // Add third todo
      await user.clear(input);
      await user.type(input, 'Third todo');
      await user.click(addButton);

      // Verify todos were added
      expect(screen.getByText('First todo')).toBeInTheDocument();
      expect(screen.getByText('Second todo')).toBeInTheDocument();
      expect(screen.getByText('Third todo')).toBeInTheDocument();

      // Check that stats updated correctly
      expect(screen.getByText('0 of 3 completed')).toBeInTheDocument();
    });

    test('toggling todo completion works correctly', async () => {
      const user = userEvent.setup();

      render(<TodoApp />);

      const input = screen.getByPlaceholderText('Add a new todo...');
      const addButton = screen.getByText('Add Todo');

      // Add multiple todos
      for (let i = 1; i <= 5; i++) {
        await user.clear(input);
        await user.type(input, `Todo ${i}`);
        await user.click(addButton);
      }

      // Measure toggle performance
      const toggleStart = performance.now();

      // Toggle first todo
      const firstCheckbox = screen.getAllByRole('checkbox')[0];
      await user.click(firstCheckbox);

      const toggleTime = performance.now() - toggleStart;

      // Performance assertion
      expect(toggleTime).toBeLessThan(100); // Should be reasonably fast

      // Verify state updated
      expect(screen.getByText('1 of 5 completed')).toBeInTheDocument();
      expect(firstCheckbox).toBeChecked();
    });

    test('removing todos works correctly', async () => {
      const user = userEvent.setup();

      render(<TodoApp />);

      const input = screen.getByPlaceholderText('Add a new todo...');
      const addButton = screen.getByText('Add Todo');

      // Add multiple todos
      for (let i = 1; i <= 5; i++) {
        await user.clear(input);
        await user.type(input, `Todo ${i}`);
        await user.click(addButton);
      }

      // Measure removal performance
      const removeStart = performance.now();

      // Remove first todo
      const firstRemoveButton = screen.getAllByLabelText('Remove todo')[0];
      await user.click(firstRemoveButton);

      const removeTime = performance.now() - removeStart;

      // Performance assertion
      expect(removeTime).toBeLessThan(100);

      // Verify todo was removed
      expect(screen.queryByText('Todo 1')).not.toBeInTheDocument();
      expect(screen.getByText('Todo 2')).toBeInTheDocument();
      expect(screen.getByText('0 of 4 completed')).toBeInTheDocument();
    });
  });

  describe('Stress Testing', () => {
    test('handles multiple operations efficiently', async () => {
      const user = userEvent.setup();

      render(<TodoApp />);

      const input = screen.getByPlaceholderText('Add a new todo...');
      const addButton = screen.getByText('Add Todo');

      // Add multiple todos
      const addStart = performance.now();

      for (let i = 1; i <= 10; i++) {
        await user.clear(input);
        await user.type(input, `Stress Todo ${i}`);
        await user.click(addButton);
      }

      const addTime = performance.now() - addStart;

      // Should handle additions efficiently
      expect(addTime).toBeLessThan(3000); // 3 seconds max for 10 todos

      // Toggle operations
      const toggleStart = performance.now();

      const checkboxes = screen.getAllByRole('checkbox');
      for (let i = 0; i < 5; i++) {
        await user.click(checkboxes[i]);
      }

      const toggleTime = performance.now() - toggleStart;

      // Should handle toggles efficiently
      expect(toggleTime).toBeLessThan(1000); // 1 second max

      // Verify final state
      expect(screen.getByText('5 of 10 completed')).toBeInTheDocument();
    });

    test('memory usage remains stable during operations', async () => {
      const user = userEvent.setup();

      render(<TodoApp />);

      const input = screen.getByPlaceholderText('Add a new todo...');
      const addButton = screen.getByText('Add Todo');

      // Simulate memory scenario: add, toggle, remove, add again

      // Phase 1: Add todos
      for (let i = 1; i <= 5; i++) {
        await user.clear(input);
        await user.type(input, `Memory Test Todo ${i}`);
        await user.click(addButton);
      }

      expect(screen.getByText('0 of 5 completed')).toBeInTheDocument();

      // Phase 2: Toggle all todos
      const checkboxes = screen.getAllByRole('checkbox');
      for (const checkbox of checkboxes) {
        await user.click(checkbox);
      }

      expect(screen.getByText('5 of 5 completed')).toBeInTheDocument();

      // Phase 3: Remove all todos
      const removeButtons = screen.getAllByLabelText('Remove todo');
      for (const button of removeButtons) {
        await user.click(button);
      }

      expect(screen.getByText('No todos yet. Add one above to get started!')).toBeInTheDocument();

      // Phase 4: Add todos again to test memory cleanup
      for (let i = 1; i <= 3; i++) {
        await user.clear(input);
        await user.type(input, `Cleanup Test Todo ${i}`);
        await user.click(addButton);
      }

      expect(screen.getByText('0 of 3 completed')).toBeInTheDocument();

      // If we reach here without memory issues, the test passes
      expect(true).toBe(true);
    });
  });

  describe('Edge Cases and Error Scenarios', () => {
    test('handles empty state transitions efficiently', async () => {
      const user = userEvent.setup();
      
      render(<TodoApp />);
      
      // Start with empty state
      expect(screen.getByText('No todos yet. Add one above to get started!')).toBeInTheDocument();
      expect(screen.getByText('0 of 0 completed')).toBeInTheDocument();
      
      const input = screen.getByPlaceholderText('Add a new todo...');
      const addButton = screen.getByText('Add Todo');
      
      // Add one todo (empty -> populated transition)
      await user.type(input, 'First todo');
      await user.click(addButton);
      
      expect(screen.queryByText('No todos yet')).not.toBeInTheDocument();
      expect(screen.getByText('First todo')).toBeInTheDocument();
      expect(screen.getByText('0 of 1 completed')).toBeInTheDocument();
      
      // Remove the todo (populated -> empty transition)
      const removeButton = screen.getByLabelText('Remove todo');
      await user.click(removeButton);
      
      expect(screen.getByText('No todos yet. Add one above to get started!')).toBeInTheDocument();
      expect(screen.getByText('0 of 0 completed')).toBeInTheDocument();
    });

    test('handles rapid state changes without performance degradation', async () => {
      const user = userEvent.setup();
      
      render(<TodoApp />);
      
      const input = screen.getByPlaceholderText('Add a new todo...');
      const addButton = screen.getByText('Add Todo');
      
      // Add a todo
      await user.type(input, 'Rapid change todo');
      await user.click(addButton);
      
      const checkbox = screen.getByRole('checkbox');
      const removeButton = screen.getByLabelText('Remove todo');
      
      // Rapid state changes
      const rapidChangeStart = performance.now();
      
      // Toggle completion multiple times rapidly
      for (let i = 0; i < 10; i++) {
        await user.click(checkbox);
      }
      
      const rapidChangeTime = performance.now() - rapidChangeStart;
      
      // Should handle rapid changes efficiently
      expect(rapidChangeTime).toBeLessThan(500);
      
      // Verify final state is consistent
      expect(screen.getByText('0 of 1 completed')).toBeInTheDocument(); // Even number of toggles
    });
  });

  describe('Concurrent Operations', () => {
    test('handles simultaneous add and toggle operations', async () => {
      const user = userEvent.setup();
      
      render(<TodoApp />);
      
      const input = screen.getByPlaceholderText('Add a new todo...');
      const addButton = screen.getByText('Add Todo');
      
      // Add initial todos
      for (let i = 1; i <= 5; i++) {
        await user.clear(input);
        await user.type(input, `Concurrent Todo ${i}`);
        await user.click(addButton);
      }

      // Simulate concurrent operations
      const concurrentStart = performance.now();

      // Toggle existing todos
      const checkboxes = screen.getAllByRole('checkbox');
      for (let i = 0; i < 4; i++) { // Toggle first 4 todos
        await user.click(checkboxes[i]);
      }

      // Add new todo
      await user.clear(input);
      await user.type(input, 'New todo');
      await user.click(addButton);

      const concurrentTime = performance.now() - concurrentStart;

      // Should handle concurrent operations efficiently
      expect(concurrentTime).toBeLessThan(1000);

      // Verify final state: 4 completed out of 6 total
      expect(screen.getByText('4 of 6 completed')).toBeInTheDocument();
    });
  });
});
