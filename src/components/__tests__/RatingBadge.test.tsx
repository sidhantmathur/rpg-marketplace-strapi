import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import RatingBadge from "../RatingBadge";
import { expect, describe, it } from "@jest/globals";

interface RatingBadgeProps {
  avg: number;
  count: number;
}

describe("RatingBadge", () => {
  it("renders rating and count correctly", () => {
    const props: RatingBadgeProps = { avg: 4.5, count: 10 };
    const { container } = render(<RatingBadge {...props} />);
    expect(screen.getByText("4.5 (10)")).toBeInTheDocument();
    expect(container.querySelector("svg")).toBeInTheDocument(); // Check for SVG element
  });

  it("formats decimal places correctly", () => {
    const props: RatingBadgeProps = { avg: 4.567, count: 10 };
    render(<RatingBadge {...props} />);
    expect(screen.getByText("4.6 (10)")).toBeInTheDocument(); // Should round to 1 decimal place
  });

  it("returns null when count is 0", () => {
    const props: RatingBadgeProps = { avg: 4.5, count: 0 };
    const { container } = render(<RatingBadge {...props} />);
    expect(container).toBeEmptyDOMElement();
  });
});
