import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import BookingForm from "../BookingForm";

describe("BookingForm", () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    // Reset mock function before each test
    mockOnSubmit.mockClear();
  });

  it("renders all form fields", () => {
    render(<BookingForm onSubmit={mockOnSubmit} />);

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/number of players/i)).toBeInTheDocument();
  });

  it("calls onSubmit with form data when submitted", () => {
    render(<BookingForm onSubmit={mockOnSubmit} />);

    // Fill in the form
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: "John Doe" },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "john@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/number of players/i), {
      target: { value: "2" },
    });

    // Submit the form
    fireEvent.click(screen.getByRole("button", { name: /book now/i }));

    // Check if onSubmit was called with correct data
    expect(mockOnSubmit).toHaveBeenCalledWith({
      name: "John Doe",
      email: "john@example.com",
      players: "2",
    });
  });

  it("shows error message when required fields are empty", () => {
    render(<BookingForm onSubmit={mockOnSubmit} />);

    fireEvent.click(screen.getByRole("button", { name: /book now/i }));

    expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
  });
});
