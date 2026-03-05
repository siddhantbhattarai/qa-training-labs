# 🧪 QA Training Lab API

A fully functional, intentionally buggy REST API built for QA engineers to practice **manual testing**, **API testing**, and **test automation** in a realistic environment.

---

## 🎯 What This Is

This project simulates a real e-commerce backend with:
- User **authentication** (JWT-based register/login/refresh)
- **Product catalog** CRUD (admin-only writes)
- **Shopping cart** management
- **Order** placement and tracking
- **Swagger UI** for documentation and in-browser testing
- **Postman-compatible** endpoints

The system contains **58+ intentional bugs** spanning validation gaps, auth flaws, logic errors, and inconsistent error handling — all labeled in the source code with `// BUG #N:` comments.

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
# Edit .env with your MongoDB URI
```

### 3. Run Locally
```bash
npm run dev       # Development (with nodemon)
npm start         # Production
```

### 4. Seed the Database
```
POST http://localhost:3000/api/seed
```

### 5. Open Swagger Docs
```
http://localhost:3000/api/docs
```

---

## ☁️ Free Deployment Stack

| Service | What For | Free Tier |
|---|---|---|
| [Render.com](https://render.com) | Node.js backend hosting | 750 hrs/month, spins down after inactivity |
| [MongoDB Atlas](https://www.mongodb.com/atlas) | Database | M0 cluster, 512MB |
| [Railway.app](https://railway.app) | Alternative to Render | $5 credit/month |

### Deploy to Render
1. Push code to GitHub
2. Create new **Web Service** on Render
3. Set environment variables from `.env.example`
4. Build command: `npm install`
5. Start command: `npm start`

---

## 📋 API Endpoints

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | None | Health check |
| POST | `/api/seed` | None | Seed demo data |
| DELETE | `/api/seed/reset` | None ⚠️ | Wipe database (bug!) |
| POST | `/api/auth/register` | None | Register user |
| POST | `/api/auth/login` | None | Login |
| POST | `/api/auth/refresh` | None | Refresh token |
| POST | `/api/auth/logout` | Bearer | Logout |
| GET | `/api/auth/me` | Bearer | Current user |
| GET | `/api/products` | None | List products |
| POST | `/api/products` | Admin | Create product |
| PUT | `/api/products/:id` | Admin | Update product |
| DELETE | `/api/products/:id` | Admin | Delete product |
| GET | `/api/cart` | Bearer | View cart |
| POST | `/api/cart/add` | Bearer | Add to cart |
| DELETE | `/api/cart/remove/:id` | Bearer | Remove item |
| DELETE | `/api/cart/clear` | Bearer | Clear cart |
| POST | `/api/orders` | Bearer | Place order |
| GET | `/api/orders` | Bearer | My orders |
| GET | `/api/orders/all` | Admin | All orders |
| GET | `/api/orders/:id` | Bearer | Order detail (IDOR!) |
| PATCH | `/api/orders/:id/status` | Admin | Update status |
| PATCH | `/api/orders/:id/cancel` | Bearer | Cancel order (IDOR!) |
| GET | `/api/users` | Admin | All users |
| PATCH | `/api/users/:id` | Admin | Update user |
| DELETE | `/api/users/:id` | Admin | Delete user |

---

## 🐛 Bug Categories for Testers

### 🔐 Authentication & Authorization
- Self-registration as admin via `role` field in body
- JWT access + refresh tokens share same secret
- Access tokens remain valid after logout
- No account lockout on repeated failed logins
- IDOR on order endpoints — any user can view/cancel any order

### ✅ Validation Gaps
- Negative product prices accepted
- Discount > 100% accepted
- Cart quantity of 0 or negative accepted
- No email format validation
- Password only requires 6 chars (no complexity)

### 💥 Error Handling Inconsistencies
- Duplicate email returns 500 instead of 409
- Invalid MongoDB ObjectId returns 500 instead of 400
- Mongoose validation errors return 500 instead of 400
- Missing auth returns 403 in some routes, 401 in others

### 🧮 Business Logic Bugs
- Cart not cleared after order placement (double-ordering)
- Stock not decremented on order
- Stock not restored on cancellation
- Order status has no state machine (pending → delivered in one jump)
- Floating point math errors in cart total
- Hard-delete of products orphans cart/order references

### 📢 Data Exposure
- User list includes password hashes
- `/api/auth/me` returns raw user object with internal fields
- Stack traces leaked in non-production errors
- Product `createdBy` (user ID) exposed in create response

---

## 🧰 Postman Setup

1. Import the collection: [`postman/QA-Training-Lab.postman_collection.json`](./postman/QA-Training-Lab.postman_collection.json)
2. Import the environment: [`postman/QA-Lab-Local.postman_environment.json`](./postman/QA-Lab-Local.postman_environment.json)
3. Run **Seed Database** request first
4. Run **Login (Admin)** and the collection will auto-set `{{token}}`

---

## 🧑‍💻 Project Structure

```
qa-training-lab/
├── src/
│   ├── server.js           # Express app entry point
│   ├── config/
│   │   ├── db.js           # MongoDB connection
│   │   └── swagger.js      # Swagger/OpenAPI config
│   ├── middleware/
│   │   └── auth.js         # JWT authenticate + requireAdmin
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
├── package.json
└── README.md
```

---

## 🔮 Roadmap

- [ ] CI/CD with GitHub Actions (run Postman/Newman on push)
- [ ] Security testing module (OWASP Top 10 scenarios)
- [ ] Automated test suite scaffold (Jest + Supertest)
- [ ] Frontend UI for visual manual testing
- [ ] Test report dashboard

---

## 📜 License

MIT — Free for educational and personal use.
