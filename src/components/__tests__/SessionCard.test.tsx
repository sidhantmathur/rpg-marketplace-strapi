import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import SessionCard from "../SessionCard";
import { expect, describe, it } from "@jest/globals";

interface Session {
  id: string;
  title: string;
  description: string;
  date: string;
  maxPlayers: number;
  currentPlayers: number;
}

describe("SessionCard", () => {
  const mockSession: Session = {
    id: "1",
    title: "D&D Adventure",
    description: "An epic fantasy adventure",
    date: "2024-05-10",
    maxPlayers: 4,
    currentPlayers: 2,
  };

  it("renders session information correctly", () => {
    render(<SessionCard session={mockSession} />);

    expect(screen.getByText("D&D Adventure")).toBeInTheDocument();
    expect(screen.getByText("An epic fantasy adventure")).toBeInTheDocument();
    expect(screen.getByText("2024-05-10")).toBeInTheDocument();
    expect(screen.getByText("2/4 players")).toBeInTheDocument();
  });

  it("shows correct player count", () => {
    render(<SessionCard session={mockSession} />);

    const playerCount = screen.getByText("2/4 players");
    expect(playerCount).toBeInTheDocument();
  });
});
