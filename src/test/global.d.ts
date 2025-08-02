declare global {
  var renderCount: Map<string, number>;
  var resetRenderCounts: () => void;
  var getRenderCount: (componentName: string) => number;
  var incrementRenderCount: (componentName: string) => void;
}

export {};
