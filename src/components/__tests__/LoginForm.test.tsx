import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import LoginPage from "@/app/login/page";
import { AuthResponse, User, Session } from "@supabase/supabase-js";
import { expect, jest, describe, it, beforeEach } from "@jest/globals";

type SignInWithPasswordFn = (credentials: { email: string; password: string }) => Promise<AuthResponse>;

jest.mock("next/navigation");
jest.mock("@/lib/supabaseClient", () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn<SignInWithPasswordFn>(),
    },
  },
}));

describe("LoginPage", () => {
  const mockRouter = {
    push: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  it("renders login form", () => {
    render(<LoginPage />);

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

    const mockSignIn = supabase.auth.signInWithPassword as jest.MockedFunction<SignInWithPasswordFn>;
    mockSignIn.mockResolvedValue(mockAuthResponse);

    render(<LoginPage />);

    // Fill in the form
    fireEvent.change(screen.getByPlaceholderText("Email"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Password"), {
      target: { value: "password123" },
    });

    // Submit the form
    fireEvent.click(screen.getByRole("button", { name: /log in/i }));

    // Wait for and verify the redirect
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
      expect(mockRouter.push).toHaveBeenCalledWith("/");
    });
  });

  it("handles login error", async () => {
    const mockError = new Error("Invalid credentials");

    const mockSignIn = supabase.auth.signInWithPassword as jest.MockedFunction<SignInWithPasswordFn>;
    mockSignIn.mockRejectedValue(mockError);

    render(<LoginPage />);

    // Fill in the form
    fireEvent.change(screen.getByPlaceholderText("Email"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Password"), {
      target: { value: "wrongpassword" },
    });

    // Submit the form
    fireEvent.click(screen.getByRole("button", { name: /log in/i }));

    // Wait for and verify error message
    await waitFor(() => {
      expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
    });
    expect(mockRouter.push).not.toHaveBeenCalled();
  });
});
