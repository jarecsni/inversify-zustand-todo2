import React, { useState } from 'react';
import { useTodoService } from '@/hooks/useTodoService';

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
