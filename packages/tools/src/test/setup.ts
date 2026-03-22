import '@testing-library/jest-dom';

// Provide a proper localStorage implementation for tests.
// Node 22+ exposes a built-in `localStorage` global that lacks the full
// Web Storage API (no setItem/getItem methods), which breaks Zustand's
// persist middleware. This polyfill replaces it with a spec-compliant
// in-memory implementation.

const store = new Map<string, string>();

const localStorageMock: Storage = {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => {
    store.set(key, value);
  },
  removeItem: (key: string) => {
    store.delete(key);
  },
  clear: () => {
    store.clear();
  },
  get length() {
    return store.size;
  },
  key: (index: number) => {
    const keys = Array.from(store.keys());
    return keys[index] ?? null;
  },
};

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true,
});

// Mock window.matchMedia for Mantine components in jsdom
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
    dispatchEvent: () => false,
  }),
});

// Mock ResizeObserver for Mantine components
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
Object.defineProperty(globalThis, 'ResizeObserver', {
  value: ResizeObserverMock,
  writable: true,
});
