/// <reference types="cypress" />

describe("Test with backend", () => {
  beforeEach("login to the App", () => {
    // Old way - changed to intercept
    //cy.server();
    //cy.route("GET", "**/tags", "fixture:tags.json");

    // Stub - we set the response to be the tags.json fixture
    //cy.intercept("GET", "**/tags", { fixture: "tags.json" });
    cy.intercept({ method: "GET", path: "tags" }, { fixture: "tags.json" });

    cy.loginToApplication();
  });

  it("should gave tags with routing object", () => {
    cy.get(".tag-list")
      .should("contain", "cypress")
      .and("contain", "automation")
      .and("contain", "testing");
  });

  it("verify global feed likes count", () => {
    // Stub - we set the response to be empty
    cy.intercept("GET", "**/articles/feed*", {
      articles: [],
      articlesCount: 0,
    });

    // STUB - we set the response to be the article.json for the GET call
    cy.intercept("GET", "**/articles*", { fixture: "articles.json" });

    cy.contains("Global Feed").click();
    cy.get("app-article-list button").then((listOfButtons) => {
      expect(listOfButtons[0]).to.contain("1");
      expect(listOfButtons[1]).to.contain("5");
    });

    // Fixture - getting the articles file from the fixtures folder
    cy.fixture("articles").then((file) => {
      const articleLink = file.articles[1].slug;
      cy.intercept("POST", "**/articles/" + articleLink + "/favorite", file);
    });

    cy.get("app-article-list button").eq(1).click().should("contain", "6");
  });

  it("verify correct request and response", () => {
    // Old way - changed to intercept
    //cy.server();
    //cy.route('POST', '**/articles').as("postArticles");

    // Spying - a REAL API call (not Stub)
    // get the response and store it in “postArticles”
    cy.intercept("POST", "https://api.realworld.io/api/articles").as(
      "postArticles"
    );

    cy.contains("New Article").click();
    cy.get('[formcontrolname="title"]').type(
      "This is a title - " + Math.random().toString()
    );
    cy.get('[formcontrolname="description"]').type("This is a description");
    cy.get('[formcontrolname="body"]').type("This is a body of the Article");
    cy.contains("Publish Article").click();

    // WAIT for the “postArticle” to return after the API call finish (getting by ‘@’)
    cy.wait("@postArticles").then((xhr: any) => {
      console.log(xhr);

      expect(xhr.response.statusCode).to.equal(200);
      expect(xhr.request.body.article.body).to.equal(
        "This is a body of the Article"
      );
      expect(xhr.response.body.article.description).to.equal(
        "This is a description"
      );
    });
  });

  it("intercepting and modifying the request and response", () => {
    /*
    cy.intercept("POST", "https://api.realworld.io/api/articles", (req) => {
      req.body.article.description = "This is a description 2";
    }).as("postArticles");
    */

    cy.intercept("POST", "https://api.realworld.io/api/articles", (req) => {
      req.reply((res) => {
        // getting expected result
        expect(res.body.article.description).to.equal("This is a description");
        // set the result so the "postArticles" will get the modified value
        res.body.article.description = "This is a description 2";
      });
    }).as("postArticles");

    cy.contains("New Article").click();
    cy.get('[formcontrolname="title"]').type(
      "This is a title - " + Math.random().toString()
    );
    cy.get('[formcontrolname="description"]').type("This is a description");
    cy.get('[formcontrolname="body"]').type("This is a body of the Article");
    cy.contains("Publish Article").click();

    // WAIT for the “postArticle” to return after the API call finish (getting by ‘@’)
    cy.wait("@postArticles").then((xhr: any) => {
      console.log(xhr);

      expect(xhr.response.statusCode).to.equal(200);
      expect(xhr.request.body.article.body).to.equal(
        "This is a body of the Article"
      );
      expect(xhr.response.body.article.description).to.equal(
        "This is a description 2"
      );
    });
  });

  it("deleting a article in global feed", () => {
    const bodyReq = {
      article: {
        tagList: [],
        title: "Request from API",
        description: "API testing is easy",
        body: "Cypress is cool",
      },
    };

    // Create a new article by API call so we will have it for the delete test

    // Getting the token from the Cypress context (Alias) and login

    cy.get("@token").then((token) => {
      // Adding new article by API call
      cy.request({
        url: "http://conduit.productionready.io/api/articles",
        headers: { Authorization: "Token " + token },
        method: "POST",
        body: bodyReq,
      }).then((res) => {
        expect(res.status).to.equal(200);
      });

      // Go to the Global Feed and delete the new API article
      cy.contains("Global Feed").click();
      cy.get(".article-preview").first().click();
      cy.get(".article-actions").contains("Delete Article").click();

      // Getting all the Articles and validate the the new one been deleted
      cy.request({
        url: "http://conduit.productionready.io/api/articles?limit=10&offset=0",
        headers: { Authorization: "Token" + token },
        method: "GET",
      })
        .its("body")
        .then((body) => {
          expect(body.articles[0].title).not.to.equal("Request from API");
        });
    });
  });
});
