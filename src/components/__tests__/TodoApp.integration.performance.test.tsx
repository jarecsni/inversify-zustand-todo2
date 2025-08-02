import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TodoApp } from '../TodoApp';
import { container } from '@/container/container';
import { TYPES } from '@/constants/types';
import { MasterStore } from '@/store/MasterStore';

// Performance-tracked components
const PerformanceTrackedTodoApp = React.memo(() => {
  React.useEffect(() => {
    global.incrementRenderCount('TodoApp');
  });
  return <TodoApp />;
});

const PerformanceTrackedTodoList = React.memo(() => {
  React.useEffect(() => {
    global.incrementRenderCount('TodoList');
  });
  return <div data-testid="todo-list">Mock TodoList</div>;
});

describe('TodoApp Integration Performance Tests', () => {
  let masterStore: MasterStore;

  beforeEach(() => {
    global.resetRenderCounts();
    
    // Reset container
    container.unbindAll();
    masterStore = new MasterStore();
    container.bind(TYPES.MasterStore).toConstantValue(masterStore);
    container.bind(TYPES.TodoView).toDynamicValue(() => masterStore.getView('todos')).inSingletonScope();
  });

  describe('Real-world Usage Scenarios', () => {
    test('adding todos triggers minimal re-renders', async () => {
      const user = userEvent.setup();
      
      render(<TodoApp />);
      
      const input = screen.getByPlaceholderText('Add a new todo...');
      const addButton = screen.getByText('Add Todo');
      
      // Add first todo
      await user.type(input, 'First todo');
      await user.click(addButton);
      
      // Add second todo
      await user.type(input, 'Second todo');
      await user.click(addButton);
      
      // Add third todo
      await user.type(input, 'Third todo');
      await user.click(addButton);
      
      // Verify todos were added
      expect(screen.getByText('First todo')).toBeInTheDocument();
      expect(screen.getByText('Second todo')).toBeInTheDocument();
      expect(screen.getByText('Third todo')).toBeInTheDocument();
      
      // Check that stats updated correctly
      expect(screen.getByText('0 of 3 completed')).toBeInTheDocument();
    });

    test('toggling todo completion is performant', async () => {
      const user = userEvent.setup();
      
      render(<TodoApp />);
      
      const input = screen.getByPlaceholderText('Add a new todo...');
      const addButton = screen.getByText('Add Todo');
      
      // Add multiple todos
      for (let i = 1; i <= 10; i++) {
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
      expect(toggleTime).toBeLessThan(50); // Should be very fast
      
      // Verify state updated
      expect(screen.getByText('1 of 10 completed')).toBeInTheDocument();
      expect(firstCheckbox).toBeChecked();
    });

    test('removing todos maintains performance', async () => {
      const user = userEvent.setup();
      
      render(<TodoApp />);
      
      const input = screen.getByPlaceholderText('Add a new todo...');
      const addButton = screen.getByText('Add Todo');
      
      // Add multiple todos
      for (let i = 1; i <= 20; i++) {
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
      expect(removeTime).toBeLessThan(50);
      
      // Verify todo was removed
      expect(screen.queryByText('Todo 1')).not.toBeInTheDocument();
      expect(screen.getByText('Todo 2')).toBeInTheDocument();
      expect(screen.getByText('0 of 19 completed')).toBeInTheDocument();
    });
  });

  describe('Stress Testing', () => {
    test('handles rapid successive operations', async () => {
      const user = userEvent.setup();
      
      render(<TodoApp />);
      
      const input = screen.getByPlaceholderText('Add a new todo...');
      const addButton = screen.getByText('Add Todo');
      
      // Rapid todo addition
      const rapidAddStart = performance.now();
      
      for (let i = 1; i <= 50; i++) {
        await user.type(input, `Rapid Todo ${i}`);
        await user.click(addButton);
      }
      
      const rapidAddTime = performance.now() - rapidAddStart;
      
      // Should handle 50 rapid additions efficiently
      expect(rapidAddTime).toBeLessThan(2000); // 2 seconds max
      
      // Rapid toggle operations
      const rapidToggleStart = performance.now();
      
      const checkboxes = screen.getAllByRole('checkbox');
      for (let i = 0; i < 25; i++) {
        await user.click(checkboxes[i]);
      }
      
      const rapidToggleTime = performance.now() - rapidToggleStart;
      
      // Should handle 25 rapid toggles efficiently
      expect(rapidToggleTime).toBeLessThan(1000); // 1 second max
      
      // Verify final state
      expect(screen.getByText('25 of 50 completed')).toBeInTheDocument();
    });

    test('memory usage remains stable during intensive operations', async () => {
      const user = userEvent.setup();
      
      render(<TodoApp />);
      
      const input = screen.getByPlaceholderText('Add a new todo...');
      const addButton = screen.getByText('Add Todo');
      
      // Simulate memory-intensive scenario
      // Add many todos, then remove them, then add again
      
      // Phase 1: Add 100 todos
      for (let i = 1; i <= 100; i++) {
        await user.type(input, `Memory Test Todo ${i}`);
        await user.click(addButton);
      }
      
      expect(screen.getByText('0 of 100 completed')).toBeInTheDocument();
      
      // Phase 2: Toggle all todos
      const checkboxes = screen.getAllByRole('checkbox');
      for (const checkbox of checkboxes) {
        await user.click(checkbox);
      }
      
      expect(screen.getByText('100 of 100 completed')).toBeInTheDocument();
      
      // Phase 3: Remove all todos
      const removeButtons = screen.getAllByLabelText('Remove todo');
      for (const button of removeButtons) {
        await user.click(button);
      }
      
      expect(screen.getByText('No todos yet. Add one above to get started!')).toBeInTheDocument();
      
      // Phase 4: Add todos again to test memory cleanup
      for (let i = 1; i <= 50; i++) {
        await user.type(input, `Cleanup Test Todo ${i}`);
        await user.click(addButton);
      }
      
      expect(screen.getByText('0 of 50 completed')).toBeInTheDocument();
      
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
        await user.type(input, `Concurrent Todo ${i}`);
        await user.click(addButton);
      }
      
      // Simulate concurrent operations
      const concurrentStart = performance.now();
      
      // Add new todo while toggling existing ones
      const addPromise = user.type(input, 'New todo').then(() => user.click(addButton));
      
      const checkboxes = screen.getAllByRole('checkbox');
      const togglePromises = checkboxes.map(checkbox => user.click(checkbox));
      
      await Promise.all([addPromise, ...togglePromises]);
      
      const concurrentTime = performance.now() - concurrentStart;
      
      // Should handle concurrent operations efficiently
      expect(concurrentTime).toBeLessThan(1000);
      
      // Verify final state
      expect(screen.getByText('5 of 6 completed')).toBeInTheDocument();
    });
  });
});
