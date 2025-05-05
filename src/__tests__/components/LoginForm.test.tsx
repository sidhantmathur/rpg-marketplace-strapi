// Reset modules before any imports
jest.resetModules();

// Mock environment variables before any imports
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";

import "@testing-library/jest-dom";
import { screen, fireEvent, waitFor, act } from "@testing-library/react";
import { render } from "@/test-utils";
import LoginForm from "@/components/LoginForm";
import { AuthResponse, User, Session, AuthError } from "@supabase/supabase-js";
import { expect, jest, describe, it, beforeEach } from "@jest/globals";
import { AppRouterContextProviderMock } from "../../lib/test-utils";

// Mock the entire next/navigation module
jest.mock("next/navigation", () => {
  const mockRouter = {
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  };

  return {
    useRouter: () => mockRouter,
    usePathname: () => "/",
    useSearchParams: () => new URLSearchParams(),
  };
});

// Create mock function
const mockSignInWithPassword = jest.fn();

// Mock Supabase client with proper implementation
jest.mock("../../lib/supabaseClient", () => ({
  supabase: {
    auth: {
      signInWithPassword: mockSignInWithPassword,
    },
  },
}));

// Import the mocked module after defining the mock
import { supabase } from "../../lib/supabaseClient";

describe("LoginForm", () => {
  const mockRouter = {
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  };

  beforeEach(() => {
    // Clear all mocks and reset modules
    jest.clearAllMocks();
    jest.resetModules();

    // Log mock status for debugging
    console.log(
      "Is signInWithPassword mocked?",
      jest.isMockFunction(supabase.auth.signInWithPassword)
    );
  });

  it("renders login form", () => {
    render(
      <AppRouterContextProviderMock router={mockRouter}>
        <LoginForm />
      </AppRouterContextProviderMock>
    );

    expect(screen.getByPlaceholderText("Email")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /log in/i })).toBeInTheDocument();
    expect(screen.getByText(/account/, { exact: false })).toBeInTheDocument();
  });

  it("handles successful login", async () => {
    const mockUser: User = {
      id: "test-id",
      email: "test@example.com",
      created_at: new Date().toISOString(),
      aud: "authenticated",
      role: "authenticated",
      app_metadata: {},
      user_metadata: {},
    };

    const mockSession: Session = {
      access_token: "test-token",
      refresh_token: "test-refresh-token",
      expires_in: 3600,
      expires_at: Date.now() + 3600,
      token_type: "bearer",
      user: mockUser,
    };

    const mockAuthResponse: AuthResponse = {
      data: {
        user: mockUser,
        session: mockSession,
      },
      error: null,
    };

    // Setup mock implementation
    mockSignInWithPassword.mockImplementationOnce(() => Promise.resolve(mockAuthResponse));

    render(
      <AppRouterContextProviderMock router={mockRouter}>
        <LoginForm />
      </AppRouterContextProviderMock>
    );

    // Fill in the form
    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText("Email"), {
        target: { value: "test@example.com" },
      });
      fireEvent.change(screen.getByPlaceholderText("Password"), {
        target: { value: "password123" },
      });
    });

    // Submit the form
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /log in/i }));
    });

    // Log mock calls for debugging
    console.log("Mock calls:", mockSignInWithPassword.mock.calls);

    // Wait for and verify the redirect
    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
      expect(mockRouter.push).toHaveBeenCalledWith("/");
    });
  });

  it("handles login error", async () => {
    const mockError = new AuthError("Invalid credentials", 400);
    const mockAuthResponse: AuthResponse = {
      data: {
        user: null,
        session: null,
      },
      error: mockError,
    };

    // Setup mock implementation
    mockSignInWithPassword.mockImplementationOnce(() => Promise.resolve(mockAuthResponse));

    render(
      <AppRouterContextProviderMock router={mockRouter}>
        <LoginForm />
      </AppRouterContextProviderMock>
    );

    // Fill in the form
    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText("Email"), {
        target: { value: "test@example.com" },
      });
      fireEvent.change(screen.getByPlaceholderText("Password"), {
        target: { value: "wrongpassword" },
      });
    });

    // Submit the form
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /log in/i }));
    });

    // Log mock calls for debugging
    console.log("Mock calls:", mockSignInWithPassword.mock.calls);

    // Wait for and verify error message
    await waitFor(() => {
      expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
    });
    expect(mockRouter.push).not.toHaveBeenCalled();
  });
});
