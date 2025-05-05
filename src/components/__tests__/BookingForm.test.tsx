import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
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

    await fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: testData.name },
    });
    await fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: testData.email },
    });
    await fireEvent.change(screen.getByLabelText(/number of players/i), {
      target: { value: testData.players },
    });

    fireEvent.click(screen.getByRole("button", { name: /book now/i }));

    expect(mockOnSubmit).toHaveBeenCalledWith(testData);
  });

  it("shows error message when required fields are empty", () => {
    render(<BookingForm onSubmit={mockOnSubmit} />);

    fireEvent.click(screen.getByRole("button", { name: /book now/i }));

    expect(screen.getByText(/name is required/i)).toBeDefined();
    expect(screen.getByText(/email is required/i)).toBeDefined();
  });
});
