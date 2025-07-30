# InversifyJS + Zustand Todo App

A modern React TypeScript todo application demonstrating the integration of InversifyJS for dependency injection and Zustand for state management.

## Features

- ✅ Add new todos
- ✅ Mark todos as complete/incomplete
- ✅ Remove todos
- ✅ Real-time todo count and completion stats
- ✅ Modern TypeScript with strict type checking
- ✅ Dependency injection with InversifyJS
- ✅ State management with Zustand
- ✅ Modern Webpack build system

## Architecture

- **React 18** - Modern React with hooks and concurrent features
- **TypeScript 5.3** - Strict type checking and modern language features
- **InversifyJS** - Dependency injection container for clean architecture
- **Zustand** - Lightweight state management
- **Webpack 5** - Modern build system with hot reload

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser to `http://localhost:3000`

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run type-check` - Run TypeScript type checking
- `npm run lint` - Run ESLint
- `npm run clean` - Clean build directory

## Project Structure

```
src/
├── components/          # React components
├── services/           # Business logic services
├── store/              # Zustand store
├── types/              # TypeScript type definitions
├── container/          # InversifyJS DI container
└── constants/          # Application constants
```

## Architecture Highlights

- **Separation of Concerns**: Business logic is separated from UI components through services
- **Dependency Injection**: Services are injected using InversifyJS for better testability
- **Type Safety**: Full TypeScript coverage with strict type checking
- **State Management**: Zustand provides simple and efficient state management
- **Modern Build**: Webpack 5 with TypeScript, hot reload, and production optimization
