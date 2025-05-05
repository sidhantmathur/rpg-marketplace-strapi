import React, { ReactElement, ReactNode, JSX } from "react";
import { render as rtlRender, RenderOptions } from "@testing-library/react";

// Define a type for router
interface RouterType {
  back?: () => void;
  forward?: () => void;
  push?: (url: string) => Promise<boolean>;
  prefetch?: (url: string) => Promise<void>;
  replace?: (url: string) => Promise<boolean>;
  refresh?: () => void;
  [key: string]: any;
}

// Mock Next.js router context
const createMockRouter = (router: Partial<RouterType>): RouterType => {
  return {
    back: jest.fn(),
    forward: jest.fn(),
    push: jest.fn(() => Promise.resolve(true)),
    prefetch: jest.fn(() => Promise.resolve()),
    replace: jest.fn(() => Promise.resolve(true)),
    refresh: jest.fn(),
    ...router,
  };
};

// Create a context for the App Router
const AppRouterContext = React.createContext<RouterType>({
  push: () => Promise.resolve(true),
  replace: () => Promise.resolve(true),
  prefetch: () => Promise.resolve(),
});

// Next.js App Router context provider mock
export function AppRouterContextProviderMock({
  router = {},
  children,
}: {
  router?: Partial<RouterType>;
  children: ReactNode;
}): JSX.Element {
  const mockRouter = createMockRouter(router);
  
  return (
    <AppRouterContext.Provider value={mockRouter}>
      {children}
    </AppRouterContext.Provider>
  );
}

// Custom render function with types
interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  router?: Partial<RouterType>;
}

function render(
  ui: ReactElement,
  { 
    router = {},
    ...renderOptions 
  }: CustomRenderOptions = {}
) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <AppRouterContextProviderMock router={router}>
      {children}
    </AppRouterContextProviderMock>
  );
  
  return rtlRender(ui, { wrapper, ...renderOptions });
}

// Re-export everything from RTL
export * from "@testing-library/react";
export { render }; 