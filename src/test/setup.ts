import '@testing-library/jest-dom';

// Mock crypto.randomUUID for consistent test IDs
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: jest.fn(() => 'test-uuid-' + Math.random().toString(36).substring(2, 9))
  }
});

// Performance testing utilities
(global as any).renderCount = new Map<string, number>();
(global as any).resetRenderCounts = () => {
  (global as any).renderCount.clear();
};
(global as any).getRenderCount = (componentName: string) => {
  return (global as any).renderCount.get(componentName) || 0;
};
(global as any).incrementRenderCount = (componentName: string) => {
  const current = (global as any).renderCount.get(componentName) || 0;
  (global as any).renderCount.set(componentName, current + 1);
};
