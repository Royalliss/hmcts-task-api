import swaggerJsdoc from "swagger-jsdoc";

// Swagger spec built from JSDoc comments on the route files. We point apis at
// both .ts (dev / tsx) and .js (compiled) so the same config works in both
// modes without a separate build step.
export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.3",
    info: {
      title: "HMCTS Task API",
      version: "1.0.0",
      description:
        "Small REST API for tracking caseworker tasks. Built as part of the HMCTS DTS Developer take-home.",
    },
    servers: [{ url: "http://localhost:4000", description: "Local dev" }],
  },
  apis: ["./src/routes/*.ts", "./dist/routes/*.js"],
});
