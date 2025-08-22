// ***********************************************
// This file is where you can create custom Cypress commands
// and overwrite existing commands.
//
// For comprehensive examples, visit:
// https://on.cypress.io/custom-commands
// ***********************************************

// Example custom command
// Cypress.Commands.add('login', (email, password) => { ... })

// Extend Window interface
declare global {
  interface Window {
    ANUBIS_CONFIG?: {
      agentId: string;
      apiBase: string;
    };
  }
}

// Custom command to check if element is in dark mode
Cypress.Commands.add("shouldBeDarkMode", () => {
  cy.get("html").should("have.class", "dark");
});

// Custom command to set ANUBIS_CONFIG
Cypress.Commands.add("setAnubisConfig", (config) => {
  cy.window().then((win) => {
    win.ANUBIS_CONFIG = config;
  });
});

// TypeScript definitions
declare global {
  namespace Cypress {
    interface Chainable {
      shouldBeDarkMode(): Chainable<JQuery<HTMLElement>>;
      setAnubisConfig(config: {
        agentId: string;
        apiBase: string;
      }): Chainable<Window>;
    }
  }
}

export {};
