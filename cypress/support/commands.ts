// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
declare namespace Cypress {
  interface Chainable<Subject> {
    loginToApplication(): Cypress.Chainable<any>;
  }
}

Cypress.Commands.add("loginToApplication", () => {
  const userCredentials = {
    user: {
      email: Cypress.env("username"),
      password: Cypress.env("password"),
    },
  };

  cy.request(
    "POST",
    "http://conduit.productionready.io/api/users/login",
    userCredentials
  )
    .its("body")
    .then((body) => {
      const token = body.user.token;
      cy.wrap(token).as("token"); // Saves it in the Cypress context

      cy.visit("/", {
        onBeforeLoad(win) {
          win.localStorage.setItem("jwtToken", token);
        },
      });
    });

  /*
    cy.visit("/login");
    cy.get('[placeholder="Email"]').type("shaharshilman2@gmail.com");
    cy.get('[placeholder="Password"]').type("shahar300688");
    cy.get("form").submit();
  */
});
