/// <reference types="cypress" />

describe("Basic E2E Test", () => {
  it("should visit the home page", () => {
    cy.visit("/");
    cy.contains("Adarle 20").should("exist");
  });
});
