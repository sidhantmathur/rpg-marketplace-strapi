import "@testing-library/jest-dom";
import { expect } from "@jest/globals";

// Add any global test setup here
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}; 