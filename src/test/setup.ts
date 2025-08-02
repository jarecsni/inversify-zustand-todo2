import '@testing-library/jest-dom';

// Mock crypto.randomUUID for consistent test IDs
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: jest.fn(() => 'test-uuid-' + Math.random().toString(36).substring(2, 9))
  }
});

// Performance testing utilities
global.renderCount = new Map();
global.resetRenderCounts = () => {
  global.renderCount.clear();
};
global.getRenderCount = (componentName: string) => {
  return global.renderCount.get(componentName) || 0;
};
global.incrementRenderCount = (componentName: string) => {
  const current = global.renderCount.get(componentName) || 0;
  global.renderCount.set(componentName, current + 1);
};
