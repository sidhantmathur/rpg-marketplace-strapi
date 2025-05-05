import { AuthResponse } from "@supabase/supabase-js";

const mockSignInWithPassword = jest.fn<Promise<AuthResponse>, [{ email: string; password: string }]>();

export const supabase = {
  auth: {
    signInWithPassword: mockSignInWithPassword,
  },
};

// Export the mock function for direct manipulation in tests
export const mockFunctions = {
  signInWithPassword: mockSignInWithPassword,
}; 