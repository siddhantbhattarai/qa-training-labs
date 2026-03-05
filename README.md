# 🧪 QA Training Lab

A comprehensive, **100% free** QA training platform designed for beginners to intermediate testers. Features an intentionally buggy REST API, modern frontend, and extensive learning resources to practice **manual testing**, **API testing**, **regression testing**, **security testing**, and **test automation**.

**Live Demo:** [https://qa-training-labs.onrender.com](https://qa-training-labs.onrender.com)

---

## 🎯 What You'll Learn

| Skill Level | Testing Type | Resources |
|-------------|--------------|-----------|
| Beginner | Smoke Testing | Checklists, Exercises, Step-by-step guides |
| Beginner | Manual/Functional Testing | UI Forms, Test Case Templates |
| Beginner | Form Validation Testing | Profile, Register, Checkout forms |
| Beginner-Medium | API Testing | Swagger, Postman, 20+ endpoints |
| Medium | Regression Testing | Test Suites, Checklists (64 items) |
| Medium | Authentication/Authorization | JWT bugs, IDOR vulnerabilities |
| Medium | Search/Filter/Pagination | Advanced product filtering |
| Medium | File Upload Testing | Avatar upload with validation |
| Medium-Advanced | Security Testing | Injection, IDOR, Mass Assignment |
| Advanced | Performance Testing | k6/JMeter guidance |
| Professional | Test Documentation | CSV/TXT downloadable templates |
| Professional | Bug Reporting | 58+ practice bugs with hints |

---

## ✨ Features

### 🖥️ Frontend Application
| Page | Description |
|------|-------------|
| **Home** | Landing page with learning path overview |
| **Dashboard** | User dashboard with activity summary |
| **Products** | Advanced catalog with search, filters, pagination |
| **Cart** | Full shopping cart with quantity management |
| **Orders** | Order history and status tracking |
| **Profile** | Account settings, avatar upload, preferences |
| **Login/Register** | Authentication with validation testing |

### 📚 Learning Resources
| Page | Description |
|------|-------------|
| **Test Scenarios** | 25+ hands-on exercises (smoke, regression, API, security, performance) |
| **QA Checklists** | 64 interactive items across 5 categories with progress tracking |
| **Test Case Templates** | Professional templates with CSV/TXT downloads |
| **Bug Hunt** | Find 58+ intentional bugs with hints and progress tracking |
| **QA Guide** | Step-by-step tutorials for beginners |

### 🔌 Backend API
- **20+ REST Endpoints** - Full CRUD operations
- **JWT Authentication** - Register, login, refresh, logout
- **Role-based Access** - User vs Admin permissions
- **Swagger UI** - Interactive API documentation
- **Postman Collection** - Ready-to-import test suite
- **58+ Intentional Bugs** - For realistic testing practice

---

## 🚀 Quick Start

### Option 1: Use Live Demo (Recommended for Learners)
Visit [https://qa-training-labs.onrender.com](https://qa-training-labs.onrender.com) and start testing immediately!

**Test Credentials:**
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@qalab.com | Admin@1234 |
| User | john@example.com | Password123 |

> 💡 Click "Seed Database" first to populate test data

### Option 2: Run Locally

#### 1. Clone & Install
```bash
git clone https://github.com/YOUR_USERNAME/qa-training-lab.git
cd qa-training-lab
npm install
```

#### 2. Configure Environment
```bash
cp .env.example .env
```

Edit `.env` with your settings:
```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/qa-lab
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-key-min-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

#### 3. Run Development Server
```bash
npm run dev       # With auto-reload (nodemon)
# or
npm start         # Production mode
```

#### 4. Access the Application
| Resource | URL |
|----------|-----|
| Frontend | http://localhost:3000 |
| Swagger API Docs | http://localhost:3000/api/docs |
| Bug Hunt | http://localhost:3000/pages/bugs.html |
| Test Scenarios | http://localhost:3000/pages/test-scenarios.html |
| Checklists | http://localhost:3000/pages/checklist.html |

---

## 📋 Complete API Reference

### Health & Setup
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/health` | None | Health check with DB status |
| POST | `/api/seed` | None | Seed database with demo data |

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | None | Create new user account |
| POST | `/api/auth/login` | None | Login and receive JWT tokens |
| POST | `/api/auth/refresh` | None | Refresh access token |
| POST | `/api/auth/logout` | Bearer | Logout (invalidate token) |

### Products
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/products` | None | List products (with filters) |
| GET | `/api/products/:id` | None | Get single product |
| POST | `/api/products` | Admin | Create new product |
| PUT | `/api/products/:id` | Admin | Update product |
| DELETE | `/api/products/:id` | Admin | Delete product |

### Shopping Cart
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/cart` | Bearer | View current cart |
| POST | `/api/cart/add` | Bearer | Add item to cart |
| PUT | `/api/cart/update/:itemId` | Bearer | Update item quantity |
| DELETE | `/api/cart/remove/:itemId` | Bearer | Remove item |
| DELETE | `/api/cart/clear` | Bearer | Clear entire cart |

### Orders
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/orders` | Bearer | Create order from cart |
| GET | `/api/orders` | Bearer | List user's orders |
| GET | `/api/orders/:id` | Bearer | Get order details |
| PUT | `/api/orders/:id/cancel` | Bearer | Cancel pending order |

### Users
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users/profile` | Bearer | Get current user profile |
| PUT | `/api/users/profile` | Bearer | Update profile |
| GET | `/api/users` | Admin | List all users |
| GET | `/api/users/:id` | Admin | Get user by ID |

---

## 🐛 Intentional Bugs (58+ Total)

The API contains **intentional bugs** for QA practice. Here are the categories:

### 🔐 Authentication & Authorization (12 bugs)
- No rate limiting on login attempts
- Token not properly invalidated on logout
- Weak password requirements (accepts "123456")
- Mass assignment vulnerability (can set role on register)
- Missing token expiration validation
- Password visible in some API responses

### 🛡️ Authorization / IDOR (8 bugs)
- User can view other users' orders
- User can cancel other users' orders
- User can access other users' cart
- Admin check missing on some routes
- Horizontal privilege escalation possible

### ✅ Validation Gaps (15 bugs)
- Negative prices accepted
- Negative quantities accepted
- Invalid email formats accepted
- No max length on text fields
- Special characters not sanitized
- Empty required fields accepted
- Zero quantity orders allowed

### 💼 Business Logic (10 bugs)
- Can order more than available stock
- Stock not reduced after order
- Cart not cleared after checkout
- Price changes affect existing carts
- Duplicate items in cart not merged
- Order total calculation errors

### ⚠️ Error Handling (8 bugs)
- Inconsistent HTTP status codes
- Stack traces leaked in production
- Generic error messages (no details)
- HTML returned instead of JSON
- Invalid ObjectId crashes server
- Missing error for non-existent resources

### 🔒 Security Issues (5 bugs)
- NoSQL injection possible
- Sensitive data in responses
- CORS too permissive
- Missing security headers
- JWT secret too weak

---

## 📊 Learning Resources Breakdown

### Test Scenarios Page (`/pages/test-scenarios.html`)
25+ hands-on exercises organized by type:

| Category | Exercises | Level |
|----------|-----------|-------|
| 🔥 Smoke Testing | 4 scenarios | Beginner |
| 🔄 Regression Testing | 4 comprehensive suites | Medium |
| ✅ Functional Testing | 4 scenarios | Beginner-Medium |
| 🔌 API Testing | 4 scenarios with Postman | Medium |
| 🔒 Security Testing | 4 scenarios | Medium-Advanced |
| ⚡ Performance Testing | 3 scenarios | Advanced |

### QA Checklists Page (`/pages/checklist.html`)
64 interactive checklist items with progress tracking:

| Checklist | Items | Focus |
|-----------|-------|-------|
| Smoke Test | 10 | Critical path verification |
| Functional Test | 15 | Feature validation |
| API Test | 15 | Endpoint verification |
| Security Test | 12 | Vulnerability checks |
| UI/UX Test | 12 | User experience |

### Test Case Templates (`/pages/test-cases.html`)
Professional templates with downloadable formats:
- **Test Case Template** (CSV)
- **Bug Report Template** (CSV)
- **Test Plan Template** (TXT)
- Example test cases for Auth, Cart, API

### Bug Hunt Challenge (`/pages/bugs.html`)
- 58+ intentional bugs to find
- Filter by severity (Critical/High/Medium/Low)
- Filter by category
- Progress tracking in localStorage
- Hints for each bug

---

## ☁️ Deployment Guide

### MongoDB Atlas (Free Tier)
1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a free M0 cluster
3. Create database user with password
4. **Important:** Whitelist IP `0.0.0.0/0` for Render access
5. Copy connection string

### Render.com (Free Tier)
1. Push code to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your GitHub repository
4. Configure:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Add Environment Variables:
   ```
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://...
   JWT_SECRET=your-secret-32-chars-min
   JWT_REFRESH_SECRET=another-secret-32-chars
   ```
6. Deploy!

> 💡 The repo includes `render.yaml` for Blueprint deployment

---

## 📁 Project Structure

```
qa-training-lab/
├── public/                          # Frontend (Static Files)
│   ├── index.html                   # Landing page
│   ├── css/
│   │   └── styles.css               # Main stylesheet
│   ├── js/
│   │   ├── api.js                   # API client module
│   │   ├── auth.js                  # Authentication module
│   │   └── app.js                   # Global app logic
│   └── pages/
│       ├── login.html               # Login form
│       ├── register.html            # Registration form
│       ├── dashboard.html           # User dashboard
│       ├── products.html            # Product catalog (with filters)
│       ├── cart.html                # Shopping cart
│       ├── orders.html              # Order history
│       ├── profile.html             # Profile settings + avatar upload
│       ├── bugs.html                # Bug hunt challenge
│       ├── guide.html               # QA learning guide
│       ├── test-scenarios.html      # 25+ test exercises
│       ├── test-cases.html          # Test case templates
│       └── checklist.html           # Interactive checklists
│
├── src/                             # Backend (Node.js/Express)
│   ├── server.js                    # Express app entry point
│   ├── config/
│   │   ├── db.js                    # MongoDB connection
│   │   └── swagger.js               # OpenAPI/Swagger config
│   ├── middleware/
│   │   └── auth.js                  # JWT authentication
│   ├── models/
│   │   ├── User.js                  # User model
│   │   ├── Product.js               # Product model
│   │   ├── Cart.js                  # Cart model
│   │   └── Order.js                 # Order model
│   └── routes/
│       ├── auth.js                  # Auth endpoints
│       ├── products.js              # Product endpoints
│       ├── cart.js                  # Cart endpoints
│       ├── orders.js                # Order endpoints
│       ├── users.js                 # User endpoints
│       └── seed.js                  # Database seeding
│
├── postman/                         # Postman Collection
│   ├── QA-Training-Lab.postman_collection.json
│   └── QA-Lab-Local.postman_environment.json
│
├── .env.example                     # Environment template
├── .gitignore                       # Git ignore rules
├── render.yaml                      # Render Blueprint config
├── package.json                     # Dependencies
└── README.md                        # This file
```

---

## 🎓 Recommended Learning Path

### Week 1: Foundation
1. **Day 1-2:** Explore the application, create account, understand domain
2. **Day 3-4:** Complete Smoke Test Checklist
3. **Day 5-7:** Read the QA Guide, understand testing concepts

### Week 2: Manual Testing
1. **Day 1-2:** Complete Functional Test Checklist
2. **Day 3-4:** Practice Functional Test Scenarios
3. **Day 5-7:** Start Bug Hunt (find 15+ bugs)

### Week 3: API Testing
1. **Day 1-2:** Explore Swagger UI, understand endpoints
2. **Day 3-4:** Import Postman collection, test all endpoints
3. **Day 5-7:** Complete API Test Checklist and Scenarios

### Week 4: Advanced Testing
1. **Day 1-2:** Complete Security Test Checklist
2. **Day 3-4:** Practice Security Test Scenarios (IDOR, injection)
3. **Day 5-7:** Try Performance Testing exercises

### Week 5: Documentation & Reporting
1. **Day 1-2:** Download and use Test Case Templates
2. **Day 3-4:** Write bug reports for bugs found
3. **Day 5-7:** Complete Bug Hunt (find all 58+ bugs)

---

## 🧰 Tools Used

| Tool | Purpose | Link |
|------|---------|------|
| Node.js | Backend runtime | [nodejs.org](https://nodejs.org) |
| Express.js | Web framework | [expressjs.com](https://expressjs.com) |
| MongoDB | Database | [mongodb.com](https://mongodb.com) |
| Mongoose | ODM for MongoDB | [mongoosejs.com](https://mongoosejs.com) |
| JWT | Authentication | [jwt.io](https://jwt.io) |
| Swagger | API documentation | [swagger.io](https://swagger.io) |
| Postman | API testing | [postman.com](https://postman.com) |
| Render | Hosting | [render.com](https://render.com) |

---

## 🔮 Roadmap

- [x] REST API with JWT authentication
- [x] Swagger/OpenAPI documentation
- [x] Postman collection
- [x] Modern frontend UI
- [x] Bug hunt challenge (58+ bugs)
- [x] QA learning guide
- [x] Test scenarios page (25+ exercises)
- [x] Interactive checklists (64 items)
- [x] Test case templates (downloadable)
- [x] Profile page with file upload
- [x] Advanced search/filter/pagination
- [x] Render deployment config
- [ ] CI/CD with GitHub Actions
- [ ] Automated test suite (Jest + Supertest)
- [ ] OWASP Top 10 security scenarios
- [ ] Mobile responsive testing guide
- [ ] Test coverage reports
- [ ] Video tutorials

---

## 🤝 Contributing

Contributions welcome! You can:
- Add more intentional bugs
- Improve documentation
- Add test examples/scripts
- Enhance the frontend
- Add more learning resources
- Report actual bugs (not intentional ones!)

---

## 📜 License

MIT License — Free for educational and personal use.

---

## 📞 Support

- **Issues:** Create a GitHub issue
- **Discussions:** Use GitHub Discussions
- **Bug Reports:** For actual bugs (not intentional ones)

---

<div align="center">

**Happy Testing! 🧪**

*Built with ❤️ for QA learners everywhere*

</div>
