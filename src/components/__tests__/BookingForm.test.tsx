import "@testing-library/jest-dom";
import { render, screen, fireEvent, act } from "@testing-library/react";
import BookingForm from "../BookingForm";
import { expect, jest, describe, it, beforeEach } from "@jest/globals";

interface BookingFormData {
  name: string;
  email: string;
  players: string;
}

describe("BookingForm", () => {
  const mockOnSubmit = jest.fn(async (_data: BookingFormData) => {
    await Promise.resolve();
  });

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it("renders all form fields", () => {
    render(<BookingForm onSubmit={mockOnSubmit} />);

    const nameInput = screen.getByLabelText(/name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const playersInput = screen.getByLabelText(/number of players/i);

    expect(nameInput).toBeDefined();
    expect(emailInput).toBeDefined();
    expect(playersInput).toBeDefined();
  });

  it("calls onSubmit with form data when submitted", async () => {
    render(<BookingForm onSubmit={mockOnSubmit} />);

    const testData: BookingFormData = {
      name: "John Doe",
      email: "john@example.com",
      players: "4",
    };

    await act(async () => {
      fireEvent.change(screen.getByLabelText(/name/i), {
        target: { value: testData.name },
      });
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: testData.email },
      });
      fireEvent.change(screen.getByLabelText(/number of players/i), {
        target: { value: testData.players },
      });
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /book now/i }));
    });

    expect(mockOnSubmit).toHaveBeenCalledWith(testData);
  });

  it("shows error message when required fields are empty", async () => {
    render(<BookingForm onSubmit={mockOnSubmit} />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /book now/i }));
    });

    expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/number of players is required/i)).toBeInTheDocument();
  });

  it("shows validation error for invalid email", async () => {
    render(<BookingForm onSubmit={mockOnSubmit} />);

    await act(async () => {
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: "invalid-email" },
      });
      fireEvent.click(screen.getByRole("button", { name: /book now/i }));
    });

    expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
  });

  it("shows validation error for invalid number of players", async () => {
    render(<BookingForm onSubmit={mockOnSubmit} />);

    await act(async () => {
      fireEvent.change(screen.getByLabelText(/number of players/i), {
        target: { value: "0" },
      });
      fireEvent.click(screen.getByRole("button", { name: /book now/i }));
    });

    expect(screen.getByText(/please enter a valid number of players/i)).toBeInTheDocument();
  });

  it("handles form submission error", async () => {
    const errorMessage = "Failed to book session";
    const mockErrorSubmit = jest.fn(async () => {
      throw new Error(errorMessage);
    });

    render(<BookingForm onSubmit={mockErrorSubmit} />);

    const testData: BookingFormData = {
      name: "John Doe",
      email: "john@example.com",
      players: "4",
    };

    await act(async () => {
      fireEvent.change(screen.getByLabelText(/name/i), {
        target: { value: testData.name },
      });
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: testData.email },
      });
      fireEvent.change(screen.getByLabelText(/number of players/i), {
        target: { value: testData.players },
      });
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /book now/i }));
    });

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });
});
