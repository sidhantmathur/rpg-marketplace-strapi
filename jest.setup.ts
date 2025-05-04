import "@testing-library/jest-dom";
import { expect } from "@jest/globals";
import * as matchers from "@testing-library/jest-dom/matchers";

expect.extend(matchers);

// Add any global test setup here
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}; 