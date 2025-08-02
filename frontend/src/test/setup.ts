import '@testing-library/jest-dom';

// Mock IntersectionObserver
Object.defineProperty(global, 'IntersectionObserver', {
  writable: true,
  value: class IntersectionObserver {
    root = null;
    rootMargin = '';
    thresholds = [];

    constructor(
      _callback: IntersectionObserverCallback,
      _options?: IntersectionObserverInit
    ) {}
    disconnect() {}
    observe() {}
    unobserve() {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  },
});

// Mock ResizeObserver
Object.defineProperty(global, 'ResizeObserver', {
  writable: true,
  value: class ResizeObserver {
    constructor(_callback: ResizeObserverCallback) {}
    disconnect() {}
    observe() {}
    unobserve() {}
  },
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});
