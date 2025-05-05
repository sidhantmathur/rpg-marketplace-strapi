import { ReactNode } from "react";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { useRouter } from "next/navigation";

interface AppRouterContextProviderMockProps {
  router: Partial<ReturnType<typeof useRouter>>;
  children: ReactNode;
}

export function AppRouterContextProviderMock({
  router,
  children,
}: AppRouterContextProviderMockProps) {
  const mockRouter = {
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    ...router,
  };

  return <AppRouterContext.Provider value={mockRouter}>{children}</AppRouterContext.Provider>;
}
