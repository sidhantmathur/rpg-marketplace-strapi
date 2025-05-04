describe("Utils", () => {
  it("should pass a basic test", () => {
    expect(true).toBe(true);
  });

  it("should add numbers correctly", () => {
    const add = (a: number, b: number) => a + b;
    expect(add(1, 2)).toBe(3);
  });
});
