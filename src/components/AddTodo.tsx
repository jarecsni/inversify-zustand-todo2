import React, { useState } from 'react';
import { useTodoService } from '@/hooks/useTodoService';

/**
 * Component for adding new todos to the application.
 *
 * Provides a form interface for creating new todo items with:
 * - Text input with placeholder guidance
 * - Form validation (trims whitespace, prevents empty todos)
 * - Automatic input clearing after successful submission
 * - Keyboard-friendly form submission (Enter key)
 *
 * Uses dependency injection via hooks for service access, making it portable.
 *
 * @returns JSX element containing the todo creation form
 */
export const AddTodo: React.FC = () => {
  const [text, setText] = useState('');
  const todoService = useTodoService();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      todoService.addTodo({ text: text.trim() });
      setText('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="add-todo-form">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Add a new todo..."
        className="todo-input"
      />
      <button type="submit" className="add-button">
        Add Todo
      </button>
    </form>
  );
};
