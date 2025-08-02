import { MasterStore } from './MasterStore';
import { Todo } from '@/types/Todo';

describe('MasterStore Performance Tests', () => {
  let masterStore: MasterStore;
  let todoView: any;

  beforeEach(() => {
    masterStore = new MasterStore();
    todoView = masterStore.getView<Todo>('todos');
    
    // Add initial test data
    for (let i = 0; i < 100; i++) {
      todoView.addItem({
        text: `Todo ${i}`,
        completed: i % 2 === 0,
        createdAt: new Date(),
      });
    }
  });

  describe('Structural Sharing - Object Reference Preservation', () => {
    test('updateItem preserves unchanged objects', () => {
      const initialTodos = todoView.getItems();
      const targetId = initialTodos[50].id;
      
      // Update one item
      todoView.updateItem(targetId, (draft: any) => {
        draft.completed = !draft.completed;
      });
      
      const updatedTodos = todoView.getItems();
      
      // Array reference should change (new array)
      expect(updatedTodos).not.toBe(initialTodos);
      
      // Updated item should have new reference
      const updatedItem = updatedTodos.find((t: Todo) => t.id === targetId);
      const originalItem = initialTodos.find((t: Todo) => t.id === targetId);
      expect(updatedItem).not.toBe(originalItem);
      
      // All OTHER items should preserve their references (structural sharing)
      updatedTodos.forEach((todo: Todo, index: number) => {
        if (todo.id !== targetId) {
          expect(todo).toBe(initialTodos[index]);
        }
      });
    });

    test('updateItem with no actual changes preserves all references', () => {
      const initialTodos = todoView.getItems();
      const targetId = initialTodos[50].id;
      const originalCompleted = initialTodos[50].completed;
      
      // "Update" without actually changing anything
      todoView.updateItem(targetId, (draft: any) => {
        draft.completed = originalCompleted; // Same value
      });
      
      const updatedTodos = todoView.getItems();
      
      // Immer should detect no changes and return same references
      expect(updatedTodos).toBe(initialTodos);
    });

    test('nested property updates preserve parent object structure', () => {
      // Add todos with nested metadata
      todoView.clearItems();
      const todoWithMetadata = todoView.addItem({
        text: 'Complex Todo',
        completed: false,
        createdAt: new Date(),
        metadata: {
          priority: 'high',
          tags: ['work', 'urgent'],
          assignee: { name: 'John', id: 'user-1' }
        }
      } as any);

      const initialTodos = todoView.getItems();
      
      // Update nested property
      todoView.updateItem(todoWithMetadata.id, (draft: any) => {
        draft.metadata.priority = 'low';
      });
      
      const updatedTodos = todoView.getItems();
      const updatedTodo = updatedTodos[0];
      const originalTodo = initialTodos[0];
      
      // Root todo object should be new
      expect(updatedTodo).not.toBe(originalTodo);
      
      // Metadata object should be new
      expect(updatedTodo.metadata).not.toBe(originalTodo.metadata);
      
      // But unchanged nested objects should be preserved
      expect(updatedTodo.metadata.assignee).toBe(originalTodo.metadata.assignee);
      expect(updatedTodo.metadata.tags).toBe(originalTodo.metadata.tags);
    });
  });

  describe('Batch Operations Performance', () => {
    test('updateItems processes multiple changes efficiently', () => {
      // Reset all todos to incomplete state first
      todoView.updateItems((draft: any) => {
        draft.forEach((todo: any) => {
          todo.completed = false;
        });
      });

      const initialTodos = todoView.getItems();

      // Verify initial state - all todos should be incomplete
      expect(initialTodos.every((todo: Todo) => !todo.completed)).toBe(true);

      // Batch update - mark first 10 as completed
      todoView.updateItems((draft: any) => {
        for (let i = 0; i < 10; i++) {
          draft[i].completed = true;
        }
      });

      const updatedTodos = todoView.getItems();

      // Verify the update worked
      expect(updatedTodos.slice(0, 10).every((todo: Todo) => todo.completed)).toBe(true);
      expect(updatedTodos.slice(10).every((todo: Todo) => !todo.completed)).toBe(true);

      // Only first 10 should have new references
      updatedTodos.forEach((todo: Todo, index: number) => {
        if (index < 10) {
          expect(todo).not.toBe(initialTodos[index]);
          expect(todo.completed).toBe(true);
        } else {
          // Unchanged todos should preserve references
          expect(todo).toBe(initialTodos[index]);
        }
      });
    });

    test('updateItemsWhere selectively updates matching items', () => {
      const initialTodos = todoView.getItems();
      const incompleteTodos = initialTodos.filter((t: Todo) => !t.completed);

      // Update all incomplete todos
      todoView.updateItemsWhere(
        (todo: Todo) => !todo.completed,
        (draft: any) => {
          draft.completed = true;
          draft.completedAt = new Date();
        }
      );
      
      const updatedTodos = todoView.getItems();
      
      // Count reference changes
      let changedReferences = 0;
      let preservedReferences = 0;
      
      updatedTodos.forEach((todo: Todo, index: number) => {
        if (todo === initialTodos[index]) {
          preservedReferences++;
        } else {
          changedReferences++;
        }
      });
      
      // Should match the number of incomplete todos
      expect(changedReferences).toBe(incompleteTodos.length);
      expect(preservedReferences).toBe(100 - incompleteTodos.length);
    });
  });

  describe('Memory Efficiency', () => {
    test('large dataset updates maintain performance', () => {
      // Clear and add large dataset
      todoView.clearItems();
      const startTime = performance.now();
      
      // Add 1000 items
      for (let i = 0; i < 1000; i++) {
        todoView.addItem({
          text: `Large Dataset Todo ${i}`,
          completed: false,
          createdAt: new Date(),
          metadata: {
            priority: i % 3 === 0 ? 'high' : 'normal',
            tags: [`tag-${i % 5}`, `category-${i % 10}`],
            complexity: Math.floor(Math.random() * 10)
          }
        } as any);
      }
      
      const addTime = performance.now() - startTime;
      
      // Update single item in large dataset
      const todos = todoView.getItems();
      const updateStartTime = performance.now();
      
      todoView.updateItem(todos[500].id, (draft: any) => {
        draft.completed = true;
        draft.metadata.priority = 'completed';
      });
      
      const updateTime = performance.now() - updateStartTime;
      
      // Performance assertions
      expect(addTime).toBeLessThan(1000); // Should add 1000 items in < 1 second
      expect(updateTime).toBeLessThan(50); // Single update should be < 50ms
      
      // Verify structural sharing still works with large dataset
      const updatedTodos = todoView.getItems();
      let preservedCount = 0;
      
      updatedTodos.forEach((todo: Todo, index: number) => {
        if (index !== 500 && todo === todos[index]) {
          preservedCount++;
        }
      });
      
      expect(preservedCount).toBe(999); // All except the updated one
    });
  });

  describe('Subscription Performance', () => {
    test('subscribers only fire when data actually changes', () => {
      let subscriptionCallCount = 0;
      let lastReceivedData: Todo[] = [];

      const unsubscribe = todoView.subscribe((todos: Todo[]) => {
        subscriptionCallCount++;
        lastReceivedData = todos;
      });

      const initialCallCount = subscriptionCallCount;

      // Make a change that actually modifies data
      const todos = todoView.getItems();
      const originalCompleted = todos[0].completed;

      todoView.updateItem(todos[0].id, (draft: any) => {
        draft.completed = !draft.completed;
      });

      expect(subscriptionCallCount).toBe(initialCallCount + 1);

      // Make another real change
      todoView.updateItem(todos[1].id, (draft: any) => {
        draft.completed = !draft.completed;
      });

      // Should trigger another subscription call
      expect(subscriptionCallCount).toBe(initialCallCount + 2);

      unsubscribe();
    });
  });
});
