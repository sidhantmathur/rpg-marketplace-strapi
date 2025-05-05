import { describe, it, expect } from "@jest/globals";
import { add } from "@/utils/math";

describe("Utils", () => {
  it("should pass a basic test", () => {
    expect(true).toBe(true);
  });

  it("should add numbers correctly", () => {
    const result = add(1, 2);
    expect(result).toBe(3);
  });
});
