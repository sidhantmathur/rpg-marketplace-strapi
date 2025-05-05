// Reset modules before any imports
jest.resetModules();

// Mock environment variables before any imports
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";

import "@testing-library/jest-dom";
import { screen, fireEvent, waitFor, act } from "@testing-library/react";
import { render } from "@/test-utils";
import LoginForm from "@/components/LoginForm";
import { AuthError, User, Session } from "@supabase/supabase-js";
import { expect, jest, describe, it, beforeEach } from "@jest/globals";
import { AppRouterContextProviderMock } from "../../lib/test-utils";
import { useRouter } from "next/navigation";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";

// Mock Next.js router
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

// Set up MSW server to intercept network requests
const server = setupServer(
  http.post("https://test.supabase.co/auth/v1/token", () => {
    return HttpResponse.json({
      access_token: "test-token",
      refresh_token: "test-refresh-token",
      user: { id: "test-user-id", email: "test@example.com" },
    });
  })
);

// Mock router implementation
const mockPush = jest.fn();
const mockRouter = {
  push: mockPush,
};

describe("LoginForm", () => {
  // Set up and tear down test environment
  beforeAll(() => server.listen());
  afterEach(() => {
    server.resetHandlers();
    jest.clearAllMocks();
  });
  afterAll(() => server.close());

  beforeEach(() => {
    // Reset mocks before each test
    mockPush.mockReset();
    
    // Setup router mock for each test
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
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
    // Setup successful response
    const mockUser: Partial<User> = {
      id: "test-user-id",
      email: "test@example.com",
      role: "authenticated",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      app_metadata: {},
      user_metadata: {},
      aud: "authenticated",
    };
    
    const mockSession: Partial<Session> = {
      access_token: "test-token",
      refresh_token: "test-refresh-token",
      expires_in: 3600,
      token_type: "bearer",
      user: mockUser as User,
    };
    
    const mockResponse = {
      data: {
        user: mockUser as User,
        session: mockSession as Session,
      },
      error: null,
    };
    
    const { mockFunctions } = require("@/lib/__mocks__/supabaseClient");
    mockFunctions.signInWithPassword.mockResolvedValueOnce(mockResponse);

    render(
      <AppRouterContextProviderMock router={mockRouter}>
        <LoginForm />
      </AppRouterContextProviderMock>
    );
    
    // Fill out the form
    fireEvent.change(screen.getByPlaceholderText("Email"), {
      target: { value: "test@example.com" },
    });
    
    fireEvent.change(screen.getByPlaceholderText("Password"), {
      target: { value: "password123" },
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole("button", { name: /log in/i }));
    
    // Verify Supabase was called with correct credentials
    await waitFor(() => {
      expect(mockFunctions.signInWithPassword).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
    });
    
    // Verify redirect happened
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/");
    });
  });

  it("handles login error", async () => {
    const mockError = new AuthError("Invalid credentials", 400);
    
    // Setup error response
    const mockResponse = {
      data: null,
      error: mockError,
    };
    
    const { mockFunctions } = require("@/lib/__mocks__/supabaseClient");
    mockFunctions.signInWithPassword.mockResolvedValueOnce(mockResponse);

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
        target: { value: "wrong-password" },
      });
    });

    // Submit the form
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /log in/i }));
    });

    // Wait for and verify error message
    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("shows loading state during authentication", async () => {
    // Setup delayed response to test loading state
    const mockUser: Partial<User> = {
      id: "test-user-id",
      email: "test@example.com",
      role: "authenticated",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      app_metadata: {},
      user_metadata: {},
      aud: "authenticated",
    };
    
    const mockSession: Partial<Session> = {
      access_token: "test-token",
      refresh_token: "test-refresh-token",
      expires_in: 3600,
      token_type: "bearer",
      user: mockUser as User,
    };
    
    const mockResponse = {
      data: {
        user: mockUser as User,
        session: mockSession as Session,
      },
      error: null,
    };
    
    const { mockFunctions } = require("@/lib/__mocks__/supabaseClient");
    mockFunctions.signInWithPassword.mockImplementationOnce(() => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(mockResponse);
        }, 100);
      });
    });

    render(
      <AppRouterContextProviderMock router={mockRouter}>
        <LoginForm />
      </AppRouterContextProviderMock>
    );
    
    // Fill out and submit form
    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText("Email"), {
        target: { value: "test@example.com" },
      });
      fireEvent.change(screen.getByPlaceholderText("Password"), {
        target: { value: "password123" },
      });
    });
    
    fireEvent.click(screen.getByRole("button", { name: /log in/i }));
    
    // Check for loading state
    expect(screen.getByRole("button", { name: /logging in/i })).toBeDisabled();
    
    // Wait for login to complete
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/");
    });
  });
});
