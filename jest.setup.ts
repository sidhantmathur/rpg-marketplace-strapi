import "@testing-library/jest-dom";
import { expect } from "@jest/globals";
import { TextEncoder, TextDecoder } from "util";
import "whatwg-fetch"; // Polyfill for fetch in Node.js environment

// Set up environment variables for all tests
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";

// Add any global test setup here
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Add TextEncoder/TextDecoder polyfills
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as typeof global.TextDecoder;

// Suppress console errors during tests
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  // Filter out specific known warnings for cleaner test output
  if (
    typeof args[0] === "string" && (
      args[0].includes("Warning: ReactDOM.render") ||
      args[0].includes("Error: Not implemented") ||
      args[0].includes("Warning: An update to")
    )
  ) {
    return;
  }
  originalConsoleError(...args);
};

// Add missing window properties for Next.js components
if (typeof window !== "undefined") {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}
