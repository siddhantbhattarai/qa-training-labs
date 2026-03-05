# 🧪 QA Training Lab

A complete, free QA training platform with an intentionally buggy REST API and modern frontend. Perfect for beginners to learn **manual testing**, **API testing**, and **test automation** in a realistic e-commerce environment.

**Live Demo:** [Your Render URL]

---

## ✨ Features

### Frontend UI
- **Modern Dashboard** - Track your testing progress
- **Product Catalog** - Browse, filter, and add to cart
- **Shopping Cart** - Full cart functionality with checkout
- **Order Management** - View and cancel orders
- **Bug Hunt Challenge** - Find 58+ intentional bugs with hints
- **Learning Guide** - Step-by-step tutorials for QA beginners

### Backend API
- **Authentication** - JWT-based register/login/refresh/logout
- **Product CRUD** - Full catalog management (admin-only writes)
- **Shopping Cart** - Add, update, remove items
- **Orders** - Place orders and track status
- **Swagger UI** - Interactive API documentation
- **Postman Collection** - Ready-to-import test collection

### Learning Features
- **58+ Intentional Bugs** - Validation, auth, logic, security bugs
- **Bug Categories** - Critical, High, Medium, Low severities
- **Progress Tracking** - Track which bugs you've found
- **Testing Guides** - Manual, API, and automation tutorials

---

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/YOUR_USERNAME/qa-training-lab.git
cd qa-training-lab
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your MongoDB URI and secrets
```

Required environment variables:
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret for access tokens
- `JWT_REFRESH_SECRET` - Secret for refresh tokens

### 3. Run Locally
```bash
npm run dev       # Development (with nodemon)
npm start         # Production
```

### 4. Seed the Database
Visit `http://localhost:3000` and click "Seed Database" or:
```bash
curl -X POST http://localhost:3000/api/seed
```

### 5. Start Testing!
- **Frontend:** `http://localhost:3000`
- **Swagger Docs:** `http://localhost:3000/api/docs`
- **Bug Hunt:** `http://localhost:3000/pages/bugs.html`

---

## ☁️ Free Deployment (Render + MongoDB Atlas)

### Step 1: Setup MongoDB Atlas (Free)
1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create free M0 cluster
3. Create database user with password
4. Whitelist IP `0.0.0.0/0` for access anywhere
5. Copy connection string: `mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true&w=majority`

### Step 2: Deploy to Render (Free)
1. Push code to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your GitHub repo
4. Configure:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Add Environment Variables:
   - `NODE_ENV` = `production`
   - `MONGODB_URI` = Your Atlas connection string
   - `JWT_SECRET` = Random secure string
   - `JWT_REFRESH_SECRET` = Another random secure string
6. Deploy!

### Alternative: Use render.yaml
The repo includes a `render.yaml` Blueprint for one-click deployment.

---

## 📋 API Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/health` | None | Health check with DB status |
| POST | `/api/seed` | None | Seed demo data |
| POST | `/api/auth/register` | None | Register user |
| POST | `/api/auth/login` | None | Login |
| POST | `/api/auth/refresh` | None | Refresh token |
| POST | `/api/auth/logout` | Bearer | Logout |
| GET | `/api/products` | None | List products |
| GET | `/api/products/:id` | None | Get product |
| POST | `/api/products` | Admin | Create product |
| PUT | `/api/products/:id` | Admin | Update product |
| DELETE | `/api/products/:id` | Admin | Delete product |
| GET | `/api/cart` | Bearer | View cart |
| POST | `/api/cart` | Bearer | Add to cart |
| PUT | `/api/cart` | Bearer | Update quantity |
| DELETE | `/api/cart/:productId` | Bearer | Remove item |
| DELETE | `/api/cart` | Bearer | Clear cart |
| POST | `/api/orders` | Bearer | Place order |
| GET | `/api/orders` | Bearer | My orders |
| GET | `/api/orders/:id` | Bearer | Order detail |
| PUT | `/api/orders/:id/cancel` | Bearer | Cancel order |
| GET | `/api/users/profile` | Bearer | My profile |
| PUT | `/api/users/profile` | Bearer | Update profile |

---

## 🐛 Bug Categories

### 🔐 Authentication & Authorization
- No rate limiting on login (brute force possible)
- Token not invalidated on logout
- User can access other users' orders (IDOR)
- Mass assignment - can set admin role on register

### ✅ Validation Gaps
- Negative prices and quantities accepted
- Weak password validation
- Invalid email formats accepted
- No max length on text fields

### 💥 Business Logic
- Can order more than stock available
- Stock not reduced after order
- Cart not cleared after checkout
- Price changes affect existing cart items

### 🔒 Security Issues
- Sensitive data in responses
- NoSQL injection possible
- Stack traces leaked in errors
- CORS too permissive

### ⚠️ Error Handling
- Inconsistent status codes
- HTML returned instead of JSON for 404
- Invalid ObjectId crashes server

---

## 🧰 Postman Setup

1. Import collection: `postman/QA-Training-Lab.postman_collection.json`
2. Import environment: `postman/QA-Lab-Local.postman_environment.json`
3. Update `baseUrl` variable for your deployment
4. Run "Seed Database" first
5. Run "Login" to set the `{{token}}` variable automatically

---

## 📁 Project Structure

```
qa-training-lab/
├── public/                    # Frontend static files
│   ├── index.html             # Landing page
│   ├── css/
│   │   └── styles.css         # Main stylesheet
│   ├── js/
│   │   ├── api.js             # API client module
│   │   ├── auth.js            # Authentication module
│   │   └── app.js             # Main app logic
│   └── pages/
│       ├── login.html         # Login page
│       ├── register.html      # Registration page
│       ├── dashboard.html     # User dashboard
│       ├── products.html      # Product catalog
│       ├── cart.html          # Shopping cart
│       ├── orders.html        # Order history
│       ├── bugs.html          # Bug hunt challenge
│       └── guide.html         # QA learning guide
├── src/
│   ├── server.js              # Express app entry point
│   ├── config/
│   │   ├── db.js              # MongoDB connection
│   │   └── swagger.js         # Swagger/OpenAPI config
│   ├── middleware/
│   │   └── auth.js            # JWT authentication
│   ├── models/
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Cart.js
│   │   └── Order.js
│   └── routes/
│       ├── auth.js
│       ├── products.js
│       ├── cart.js
│       ├── orders.js
│       ├── users.js
│       └── seed.js
├── postman/
│   ├── QA-Training-Lab.postman_collection.json
│   └── QA-Lab-Local.postman_environment.json
├── .env.example
├── .gitignore
├── render.yaml                # Render deployment config
├── package.json
└── README.md
```

---

## 🎓 Learning Path

1. **Setup** - Create account, seed database, explore docs
2. **Manual Testing** - Test the UI, find edge cases
3. **API Testing** - Use Postman to test all endpoints
4. **Bug Hunting** - Find and document all 58+ bugs
5. **Automation** - Write test scripts in Python/JavaScript
6. **Reporting** - Practice professional bug reports

---

## 🔮 Roadmap

- [x] REST API with authentication
- [x] Swagger documentation
- [x] Postman collection
- [x] Frontend UI with modern design
- [x] Bug hunt challenge with 58+ bugs
- [x] QA learning guides
- [x] Render deployment config
- [ ] CI/CD with GitHub Actions
- [ ] Automated test suite (Jest + Supertest)
- [ ] Security testing module (OWASP scenarios)
- [ ] Test coverage reports

---

## 📜 License

MIT — Free for educational and personal use.

---

## 🤝 Contributing

Contributions welcome! Feel free to:
- Add more intentional bugs
- Improve documentation
- Add test examples
- Enhance the frontend

---

**Happy Testing! 🧪**
