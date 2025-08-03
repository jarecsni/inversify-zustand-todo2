import { TodoService, createTestTodoContainer, TODO_TYPES } from '../index';
import { MasterStore } from '@/store/MasterStore';

describe('TodoService Performance Tests', () => {
  let todoService: TodoService;
  let masterStore: MasterStore;

  beforeEach(() => {
    // Create fresh container and store for each test
    masterStore = new MasterStore();
    const container = createTestTodoContainer(masterStore);
    todoService = container.get(TODO_TYPES.TodoService);
  });

  describe('Service Operation Performance', () => {
    test('addTodo performance scales linearly', () => {
      const timings: number[] = [];
      
      // Test adding todos in batches
      for (let batch = 0; batch < 5; batch++) {
        const batchStart = performance.now();
        
        // Add 100 todos in this batch
        for (let i = 0; i < 100; i++) {
          todoService.addTodo({
            text: `Performance Test Todo ${batch * 100 + i}`
          });
        }
        
        const batchTime = performance.now() - batchStart;
        timings.push(batchTime);
      }
      
      // Performance should remain consistent (linear scaling)
      const averageTime = timings.reduce((a, b) => a + b) / timings.length;
      const maxDeviation = Math.max(...timings.map(t => Math.abs(t - averageTime)));

      // Max deviation should be less than 100% of average (allowing for variance in test environment)
      expect(maxDeviation).toBeLessThan(averageTime * 1.0);
      
      // Each batch should complete in reasonable time
      timings.forEach(timing => {
        expect(timing).toBeLessThan(200); // 100 additions in < 200ms
      });
      
      // Verify all todos were added
      expect(todoService.getAllTodos()).toHaveLength(500);
    });

    test('toggleTodo performance with large datasets', () => {
      // Create large dataset
      const todos: any[] = [];
      for (let i = 0; i < 1000; i++) {
        todos.push(todoService.addTodo({
          text: `Large Dataset Todo ${i}`
        }));
      }

      // Test toggle performance at different positions
      const positions = [0, 250, 500, 750, 999]; // Beginning, middle, end
      const toggleTimings: number[] = [];

      positions.forEach(position => {
        const todoId = todos[position].id;
        
        const toggleStart = performance.now();
        todoService.toggleTodo(todoId);
        const toggleTime = performance.now() - toggleStart;
        
        toggleTimings.push(toggleTime);
      });
      
      // All toggles should be fast regardless of position
      toggleTimings.forEach(timing => {
        expect(timing).toBeLessThan(10); // < 10ms per toggle
      });
      
      // Verify toggles worked
      const allTodos = todoService.getAllTodos();
      positions.forEach(position => {
        expect(allTodos[position].completed).toBe(true);
      });
    });

    test('removeTodo performance consistency', () => {
      // Create dataset
      const todos = [];
      for (let i = 0; i < 500; i++) {
        todos.push(todoService.addTodo({
          text: `Remove Test Todo ${i}`
        }));
      }
      
      const removeTimings: number[] = [];
      
      // Remove every 10th todo
      for (let i = 0; i < 50; i++) {
        const todoToRemove = todos[i * 10];
        
        const removeStart = performance.now();
        todoService.removeTodo(todoToRemove.id);
        const removeTime = performance.now() - removeStart;
        
        removeTimings.push(removeTime);
      }
      
      // All removals should be fast
      removeTimings.forEach(timing => {
        expect(timing).toBeLessThan(15); // < 15ms per removal
      });
      
      // Verify correct number of todos remain
      expect(todoService.getAllTodos()).toHaveLength(450);
    });
  });

  describe('Memory and Reference Management', () => {
    test('service operations maintain object reference optimization', () => {
      // Add initial todos
      const todos = [];
      for (let i = 0; i < 100; i++) {
        todos.push(todoService.addTodo({
          text: `Reference Test Todo ${i}`
        }));
      }
      
      const initialTodos = todoService.getAllTodos();
      
      // Toggle one todo
      const targetTodo = todos[50];
      todoService.toggleTodo(targetTodo.id);
      
      const updatedTodos = todoService.getAllTodos();
      
      // Verify structural sharing
      let preservedReferences = 0;
      let changedReferences = 0;
      
      updatedTodos.forEach((todo, index) => {
        if (todo === initialTodos[index]) {
          preservedReferences++;
        } else {
          changedReferences++;
        }
      });
      
      // Only one todo should have changed reference
      expect(changedReferences).toBe(1);
      expect(preservedReferences).toBe(99);
    });

    test('service handles rapid successive operations efficiently', () => {
      const operationStart = performance.now();
      
      // Rapid mixed operations
      const todos: any[] = [];

      // Add 50 todos
      for (let i = 0; i < 50; i++) {
        todos.push(todoService.addTodo({
          text: `Rapid Op Todo ${i}`
        }));
      }

      // Toggle first 25
      for (let i = 0; i < 25; i++) {
        todoService.toggleTodo(todos[i].id);
      }
      
      // Remove last 10
      for (let i = 40; i < 50; i++) {
        todoService.removeTodo(todos[i].id);
      }
      
      // Add 10 more
      for (let i = 0; i < 10; i++) {
        todoService.addTodo({
          text: `Additional Todo ${i}`
        });
      }
      
      const operationTime = performance.now() - operationStart;
      
      // All operations should complete quickly
      expect(operationTime).toBeLessThan(100); // < 100ms for all operations
      
      // Verify final state
      const finalTodos = todoService.getAllTodos();
      expect(finalTodos).toHaveLength(50); // 40 remaining + 10 new
      
      // Verify first 25 are completed
      const completedCount = finalTodos.filter(t => t.completed).length;
      expect(completedCount).toBe(25);
    });
  });

  describe('Concurrent Access Patterns', () => {
    test('service handles multiple simultaneous reads efficiently', () => {
      // Add test data
      for (let i = 0; i < 200; i++) {
        todoService.addTodo({
          text: `Concurrent Read Test Todo ${i}`
        });
      }
      
      const readStart = performance.now();
      
      // Simulate multiple concurrent reads
      const readPromises = [];
      for (let i = 0; i < 20; i++) {
        readPromises.push(
          new Promise(resolve => {
            const todos = todoService.getAllTodos();
            resolve(todos.length);
          })
        );
      }
      
      return Promise.all(readPromises).then(results => {
        const readTime = performance.now() - readStart;
        
        // All reads should complete quickly
        expect(readTime).toBeLessThan(50);
        
        // All reads should return consistent results
        results.forEach(length => {
          expect(length).toBe(200);
        });
      });
    });

    test('mixed read/write operations maintain performance', () => {
      // Initial data
      const todos: any[] = [];
      for (let i = 0; i < 100; i++) {
        todos.push(todoService.addTodo({
          text: `Mixed Op Todo ${i}`
        }));
      }

      const mixedOpStart = performance.now();

      // Simulate mixed operations
      const operations: (() => void)[] = [];

      // 10 read operations
      for (let i = 0; i < 10; i++) {
        operations.push(() => todoService.getAllTodos());
      }

      // 10 write operations
      for (let i = 0; i < 10; i++) {
        operations.push(() => todoService.toggleTodo(todos[i].id));
      }
      
      // 5 add operations
      for (let i = 0; i < 5; i++) {
        operations.push(() => todoService.addTodo({ text: `New Todo ${i}` }));
      }
      
      // Execute all operations
      operations.forEach(op => op());
      
      const mixedOpTime = performance.now() - mixedOpStart;
      
      // Mixed operations should complete efficiently
      expect(mixedOpTime).toBeLessThan(50);
      
      // Verify final state consistency
      const finalTodos = todoService.getAllTodos();
      expect(finalTodos).toHaveLength(105); // 100 + 5 new
      
      // Verify first 10 are toggled
      const toggledCount = finalTodos.slice(0, 10).filter(t => t.completed).length;
      expect(toggledCount).toBe(10);
    });
  });

  describe('Edge Case Performance', () => {
    test('operations on empty dataset are efficient', () => {
      const emptyOpStart = performance.now();
      
      // Operations on empty dataset
      const emptyTodos = todoService.getAllTodos();
      expect(emptyTodos).toHaveLength(0);
      
      // Try to toggle non-existent todo (should be safe)
      todoService.toggleTodo('non-existent-id');
      
      // Try to remove non-existent todo (should be safe)
      todoService.removeTodo('non-existent-id');
      
      const emptyOpTime = performance.now() - emptyOpStart;
      
      // Operations on empty dataset should be very fast
      expect(emptyOpTime).toBeLessThan(5);
    });

    test('operations with invalid IDs handle gracefully', () => {
      // Add some todos
      for (let i = 0; i < 10; i++) {
        todoService.addTodo({ text: `Valid Todo ${i}` });
      }
      
      const invalidOpStart = performance.now();
      
      // Operations with invalid IDs
      todoService.toggleTodo('invalid-id-1');
      todoService.toggleTodo('invalid-id-2');
      todoService.removeTodo('invalid-id-3');
      todoService.removeTodo('invalid-id-4');
      
      const invalidOpTime = performance.now() - invalidOpStart;
      
      // Invalid operations should be fast and safe
      expect(invalidOpTime).toBeLessThan(10);
      
      // Original todos should be unchanged
      const todos = todoService.getAllTodos();
      expect(todos).toHaveLength(10);
      expect(todos.every(t => !t.completed)).toBe(true);
    });
  });
});
