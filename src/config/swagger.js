const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "QA Training Lab API",
      version: "1.0.0",
      description: `
# Welcome to the QA Training Lab API 🧪

This is an **intentionally buggy** e-commerce API designed for QA engineers to practice testing skills.

---

## 🎯 Purpose

This API contains **58+ intentional bugs** across different categories:
- Validation gaps
- Authentication flaws  
- Authorization issues (IDOR)
- Business logic errors
- Inconsistent error handling
- Security vulnerabilities
- Performance issues

---

## 🚀 Getting Started

### 1. Seed the Database
First, call \`POST /api/seed\` to populate test data including:
- Admin user: \`admin@qalab.com\` / \`Admin@1234\`
- Test user: \`john@example.com\` / \`Password123\`
- Sample products

### 2. Authenticate
Call \`POST /api/auth/login\` with credentials to get a JWT token.

### 3. Authorize
Click the **Authorize** button above and enter:
\`\`\`
Bearer <your_access_token>
\`\`\`

### 4. Start Testing!
Explore endpoints and try to find bugs. Check the Bug Hunt page for hints.

---

## 🔐 Authentication

All protected endpoints require a Bearer token in the Authorization header:
\`\`\`
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
\`\`\`

---

## 📚 Resources

- **Bug Hunt Challenge**: Find all 58+ bugs at \`/pages/bugs.html\`
- **Learning Guide**: QA tutorials at \`/pages/guide.html\`
- **Postman Collection**: Available in \`/postman\` folder
      `,
      contact: {
        name: "QA Lab Support",
        url: "https://github.com/siddhantbhattarai/qa-training-labs",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    externalDocs: {
      description: "View Bug Hunt Challenge",
      url: "/pages/bugs.html",
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
          description: "Enter your JWT token from /api/auth/login",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            message: { 
              type: "string",
              example: "Error description"
            },
            error: { 
              type: "string",
              example: "Error details"
            },
          },
        },
        User: {
          type: "object",
          properties: {
            _id: { type: "string", example: "507f1f77bcf86cd799439011" },
            name: { type: "string", example: "John Doe" },
            email: { type: "string", example: "john@example.com" },
            role: { type: "string", enum: ["user", "admin"], example: "user" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Product: {
          type: "object",
          properties: {
            _id: { type: "string", example: "507f1f77bcf86cd799439011" },
            name: { type: "string", example: "Wireless Mouse" },
            description: { type: "string", example: "Ergonomic wireless mouse" },
            price: { type: "number", example: 29.99 },
            stock: { type: "integer", example: 100 },
            category: { type: "string", example: "electronics" },
          },
        },
        CartItem: {
          type: "object",
          properties: {
            product: { "$ref": "#/components/schemas/Product" },
            quantity: { type: "integer", example: 2 },
            price: { type: "number", example: 29.99 },
          },
        },
        Order: {
          type: "object",
          properties: {
            _id: { type: "string" },
            orderNumber: { type: "string", example: "ORD-123456" },
            user: { type: "string" },
            items: { 
              type: "array",
              items: { "$ref": "#/components/schemas/CartItem" }
            },
            totalAmount: { type: "number", example: 59.98 },
            status: { 
              type: "string", 
              enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
              example: "pending"
            },
            shippingAddress: {
              type: "object",
              properties: {
                street: { type: "string" },
                city: { type: "string" },
                state: { type: "string" },
                zipCode: { type: "string" },
                country: { type: "string" },
              },
            },
          },
        },
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email", example: "admin@qalab.com" },
            password: { type: "string", example: "Admin@1234" },
          },
        },
        RegisterRequest: {
          type: "object",
          required: ["name", "email", "password"],
          properties: {
            name: { type: "string", example: "John Doe" },
            email: { type: "string", format: "email", example: "john@example.com" },
            password: { type: "string", minLength: 6, example: "Password123" },
          },
        },
        AuthResponse: {
          type: "object",
          properties: {
            message: { type: "string", example: "Login successful" },
            accessToken: { type: "string", example: "eyJhbGciOiJIUzI1NiIs..." },
            refreshToken: { type: "string", example: "eyJhbGciOiJIUzI1NiIs..." },
            user: { "$ref": "#/components/schemas/User" },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: "Access token is missing or invalid",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: { type: "string", example: "Unauthorized" },
                },
              },
            },
          },
        },
        NotFoundError: {
          description: "Resource not found",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: { type: "string", example: "Resource not found" },
                },
              },
            },
          },
        },
        ValidationError: {
          description: "Validation error",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  message: { type: "string", example: "Validation failed" },
                  errors: { 
                    type: "array",
                    items: { type: "string" }
                  },
                },
              },
            },
          },
        },
      },
    },
    tags: [
      { 
        name: "Health", 
        description: "Server health and status checks" 
      },
      { 
        name: "Dev Tools", 
        description: "🌱 Database seeding and development utilities. **Start here!**" 
      },
      { 
        name: "Auth", 
        description: "🔐 User registration, login, and token management" 
      },
      { 
        name: "Users", 
        description: "👤 User profile and account management" 
      },
      { 
        name: "Products", 
        description: "📦 Product catalog (Admin required for create/update/delete)" 
      },
      { 
        name: "Cart", 
        description: "🛒 Shopping cart operations (requires authentication)" 
      },
      { 
        name: "Orders", 
        description: "📋 Order placement and tracking (requires authentication)" 
      },
    ],
  },
  apis: ["./src/routes/*.js", "./src/server.js"],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
