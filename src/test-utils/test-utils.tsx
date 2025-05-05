import React from "react";
import { render as rtlRender } from "@testing-library/react";

// Create a mock router context
const RouterContext = React.createContext({});

// Create a custom render function that includes the router context
const createMockRouter = (router: Partial<any>) => {
  return {
    back: jest.fn(),
    forward: jest.fn(),
    push: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    ...router,
  };
};

const customRender = (
  ui: React.ReactElement,
  { router = {}, ...options }: { router?: Partial<any> } = {}
) => {
  const mockRouter = createMockRouter(router);

  return rtlRender(
    <RouterContext.Provider value={mockRouter}>
      {ui}
    </RouterContext.Provider>,
    options
  );
};

// Re-export everything
export * from "@testing-library/react";

// Override render method
export { customRender as render }; 