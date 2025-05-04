import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import RatingBadge from "../RatingBadge";

describe("RatingBadge", () => {
  it("renders rating and count correctly", () => {
    const { container } = render(<RatingBadge avg={4.5} count={10} />);
    expect(screen.getByText("4.5 (10)")).toBeInTheDocument();
    expect(container.querySelector("svg")).toBeInTheDocument(); // Check for SVG element
  });

  it("formats decimal places correctly", () => {
    render(<RatingBadge avg={4.567} count={10} />);
    expect(screen.getByText("4.6 (10)")).toBeInTheDocument(); // Should round to 1 decimal place
  });

  it("returns null when count is 0", () => {
    const { container } = render(<RatingBadge avg={4.5} count={0} />);
    expect(container).toBeEmptyDOMElement();
  });
});
