import { describe, it, expect } from "@jest/globals";

describe("Utils", () => {
  it("should pass a basic test", () => {
    expect(true).toBe(true);
  });

  it("should add numbers correctly", () => {
    const add = (a: number, b: number): number => a + b;
    const result = add(1, 2);
    expect(result).toBe(3);
  });
});
