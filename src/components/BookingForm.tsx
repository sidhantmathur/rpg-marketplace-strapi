"use client";

import { useState } from "react";

interface BookingFormData {
  name: string;
  email: string;
  players: string;
}

interface BookingFormState {
  data: BookingFormData;
  errors: Partial<BookingFormData> & { submit?: string };
  isLoading: boolean;
}

interface BookingFormProps {
  onSubmit: (data: BookingFormData) => Promise<void>;
}

export default function BookingForm({ onSubmit }: BookingFormProps) {
  const [formState, setFormState] = useState<BookingFormState>({
    data: {
      name: "",
      email: "",
      players: "",
    },
    errors: {},
    isLoading: false,
  });

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<BookingFormData> = {};
    const { name, email, players } = formState.data;

    if (!name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!players.trim()) {
      newErrors.players = "Number of players is required";
    } else {
      const numPlayers = parseInt(players);
      if (isNaN(numPlayers) || numPlayers < 1) {
        newErrors.players = "Please enter a valid number of players";
      }
    }

    setFormState((prev) => ({ ...prev, errors: newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState((prev) => ({
      ...prev,
      data: { ...prev.data, [name]: value },
      errors: { ...prev.errors, [name]: undefined },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setFormState((prev) => ({ ...prev, isLoading: true }));

    try {
      await onSubmit(formState.data);
      // Reset form on success
      setFormState({
        data: { name: "", email: "", players: "" },
        errors: {},
        isLoading: false,
      });
    } catch (error) {
      setFormState((prev) => ({
        ...prev,
        errors: {
          ...prev.errors,
          submit: error instanceof Error ? error.message : "An unexpected error occurred",
        },
        isLoading: false,
      }));
    }
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)} noValidate className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="name" className="block text-sm font-medium">
          Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formState.data.name}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          disabled={formState.isLoading}
        />
        {formState.errors.name && <p className="text-red-500 text-sm">{formState.errors.name}</p>}
      </div>

      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formState.data.email}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          disabled={formState.isLoading}
        />
        {formState.errors.email && <p className="text-red-500 text-sm">{formState.errors.email}</p>}
      </div>

      <div className="space-y-2">
        <label htmlFor="players" className="block text-sm font-medium">
          Number of Players
        </label>
        <input
          type="number"
          id="players"
          name="players"
          value={formState.data.players}
          onChange={handleChange}
          min="1"
          className="w-full border p-2 rounded"
          disabled={formState.isLoading}
        />
        {formState.errors.players && (
          <p className="text-red-500 text-sm">{formState.errors.players}</p>
        )}
      </div>

      {formState.errors.submit && <p className="text-red-500 text-sm">{formState.errors.submit}</p>}

      <button
        type="submit"
        className="w-full bg-blue-600 text-white p-2 rounded disabled:opacity-50"
        disabled={formState.isLoading}
      >
        {formState.isLoading ? "Booking..." : "Book Now"}
      </button>
    </form>
  );
}
