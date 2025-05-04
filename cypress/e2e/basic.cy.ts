/// <reference types="cypress" />

describe("Basic E2E Test", () => {
  it("should visit the home page", () => {
    cy.visit("/");
    cy.contains("RPG Marketplace").should("exist");
  });
});
