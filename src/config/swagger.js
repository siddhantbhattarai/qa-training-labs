const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "🧪 QA Training Lab API",
      version: "1.0.0",
      description: `
## Welcome to the QA Training Lab API

This API is **intentionally designed with bugs, validation gaps, and inconsistencies** for educational purposes.

### 🎯 Learning Objectives
- Practice manual API testing with Postman
- Identify missing validations and edge cases
- Spot inconsistent error handling across endpoints
- Explore authentication and authorization flaws
- Write automation test scripts based on real findings

### 🐛 Known Bug Categories to Find
- **Validation gaps**: Missing required field checks, no format validation
- **Auth flaws**: Weak JWT secrets, improper role enforcement
- **Logic bugs**: Incorrect price calculations, order state transitions
- **Error inconsistency**: Mixed HTTP status codes for similar errors
- **Data exposure**: Sensitive fields returned in responses

### 🔐 Authentication
Use the \`/api/auth/login\` endpoint to get a Bearer token, then click **Authorize** above.

\`\`\`
Authorization: Bearer <your_token>
\`\`\`
      `,
      contact: {
        name: "QA Lab Support",
        email: "support@qalab.dev",
      },
    },
    servers: [
      {
        url: "/",
        description: "Current Server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            message: { type: "string" },
            error: { type: "string" },
          },
        },
        Success: {
          type: "object",
          properties: {
            message: { type: "string" },
          },
        },
      },
    },
    tags: [
      { name: "Health", description: "Server health check" },
      { name: "Auth", description: "Registration, login, token refresh" },
      { name: "Users", description: "User profile management (Admin only)" },
      { name: "Products", description: "Product catalog CRUD" },
      { name: "Cart", description: "Shopping cart management" },
      { name: "Orders", description: "Order placement and tracking" },
      { name: "Dev Tools", description: "Seed data and debug utilities" },
    ],
  },
  apis: ["./src/routes/*.js", "./src/models/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
