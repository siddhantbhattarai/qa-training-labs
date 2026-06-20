# 🧪 QA Training Lab

A free, hands-on platform for **learning the craft of QA** — manual/functional
testing, boundary &amp; negative testing, API testing, business-logic testing,
regression testing, and **writing professional bug reports**.

What makes it different: a **DVWA-style difficulty switch**. The *same* feature
behaves differently at each level, so you practise the same test from
**beginner → advanced**, then compare against a correct **reference build**.

**🌐 Live demo:** <https://qa-training-labs.onrender.com>
&nbsp;·&nbsp; [Curriculum](https://qa-training-labs.onrender.com/pages/curriculum.html)
&nbsp;·&nbsp; [Tools](https://qa-training-labs.onrender.com/pages/tools.html)
&nbsp;·&nbsp; [API docs](https://qa-training-labs.onrender.com/api/docs)

> This is a **QA learning** lab, not a hacking lab. Every "bug" is a real-world
> quality defect — wrong validation, wrong status codes, broken business rules,
> data-integrity issues — the kind a tester finds and reports.

---

## 🎚️ The difficulty levels (the big idea)

Switch the level from the **navbar dropdown**, or send an `X-QA-Level` header,
or `POST /api/lab/level`.

| Level | For | You practise | The same feature… |
|-------|-----|--------------|-------------------|
| 🟢 **Low** | Beginner | Smoke & functional testing | …has **obvious** defects |
| 🟡 **Medium** | Intermediate | Boundary value analysis, equivalence partitioning, negative testing | …fixed the obvious case but a **boundary/edge** variant remains |
| 🔴 **High** | Advanced | Business-logic, integration & exploratory testing | …only breaks via **chained, state-based** steps |
| 🔵 **Stable** | Everyone | Regression baseline | …is **correct** — learn the expected behaviour, diff the buggy levels against it |

**Example — registering with `role: "admin"`:**
- **Low** → you become admin (defect).
- **Medium/High** → ignored on register… but at Medium the same flaw still hides in *edit profile*.
- **Stable** → always blocked. ✓

See the full **[defect matrix](SOLUTIONS/README.md)** (instructor answer keys).

---

## 🚀 Quick start

Prefer not to install anything? Just use the **[live demo](https://qa-training-labs.onrender.com)**.

To run it yourself (zero-config — no database account, no Docker):

```bash
git clone https://github.com/siddhantbhattarai/qa-training-labs.git
cd qa-training-labs
npm install
npm start
```

That's it. On first boot the app starts an **in-memory MongoDB**, **auto-seeds**
demo data, and runs at <http://localhost:3000>.

| Resource | URL |
|----------|-----|
| App | <http://localhost:3000> |
| Curriculum (start here) | `/pages/curriculum.html` |
| Bug Hunt | `/pages/bugs.html` |
| Reporting Guide | `/pages/reporting.html` |
| Swagger API docs | `/api/docs` |
| Set difficulty (API) | `GET`/`POST` `/api/lab/level` |

**Demo accounts** (also printed on boot):

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@qalab.com` | `Admin@1234` |
| User | `user@qalab.com` | `User@1234` |
| User 2 | `user2@qalab.com` | `User@1234` |

> Two normal users let you test "can user A touch user B's data?" ownership rules.

### Optional configuration
Copy `.env.example` to `.env` only if you want to change defaults:
- **`MONGODB_URI`** — set it to use a real/Atlas MongoDB (data then persists). Leave blank for in-memory.
- **`AUTO_RESET_HOURS`** — the lab wipes test data and re-seeds fresh every N hours (default **24**, `0` to disable). Keeps a shared classroom clean.
- **`JWT_SECRET` / `JWT_REFRESH_SECRET`** — dev fallbacks are built in for local use; **required** in production (the app refuses to start with `NODE_ENV=production` unless you set your own). See [Security & secrets](#-security--secrets-please-read-before-deploying).

---

## 🎓 Learn in order

Follow the **[Curriculum](public/pages/curriculum.html)** (8 modules, beginner → advanced):

1. Foundations & Smoke Testing — *Low*
2. Functional Testing & Bug Hunting — *Low*
3. Boundary & Negative Testing — *Medium*
4. API Testing — *Medium*
5. Business-Logic & Exploratory Testing — *High*
6. Regression Testing with the Stable baseline — *High vs Stable*
7. Reporting & Test Summary — *all levels*
8. **Automation & CI** — *Low → Stable* (a real, runnable Playwright suite — see [`tests/`](tests/))

Each module says which level to set, what to test, and what to hand in.

---

## 📝 Reporting

Knowing how to **report** a defect is as important as finding it. The
**[Reporting Guide](REPORTING-GUIDE.md)** (also in-app at `/pages/reporting.html`)
covers the anatomy of a bug report, **severity vs priority**, reproducible steps,
the bug lifecycle, and how to write a **Test Summary Report**.

Downloadable templates are in **[`templates/`](templates/)**:
bug report (MD/CSV), test cases (CSV), test summary (MD).

> 🔑 Killer trick: write your **"Expected Result"** by running the same steps at
> `X-QA-Level: stable`. Whatever the reference build does *is* the expected result.

---

## 🤖 Automation & CI

When you're ready to stop testing by hand, **Module 8** is a real, runnable
automation suite in **[`tests/`](tests/)** — one **Playwright** framework for both
API and end-to-end browser tests, plus a **GitHub Actions** workflow that runs it
on every push.

```bash
npm install && npx playwright install chromium
npm test            # auto-starts the lab, runs API + E2E
npm run test:smoke  # quick API smoke checks

# point it at the live demo (or any deploy) instead of localhost:
BASE_URL=https://qa-training-labs.onrender.com npm run test:smoke
```

The centerpiece, `tests/api/defect-detection.spec.js`, asserts the **correct**
(Stable) behaviour and runs it at *every* difficulty level — marking the buggy
levels `test.fail()`, exactly how a regression suite encodes "known bug here,
expected fixed there." Full walkthrough and exercises in
**[`tests/README.md`](tests/README.md)**.

---

## 🎤 Interview prep

Going for a QA role? The **[Interview Q&A bank](INTERVIEW-QUESTIONS.md)** has **87
must-know questions with model answers** across 11 topics (fundamentals, test
design, defect management, API testing, automation, SQL, scenario/behavioral, and
more). The in-app version at `/pages/interview.html` lets you **filter by topic,
search, and reveal answers** quiz-style — and many answers tie back to defects you
can go practise in this very lab.

---

## 🧰 Tools you'll use

New to QA tooling? The **[Tools You'll Use guide](TOOLS-GUIDE.md)** (also in-app at
`/pages/tools.html`) has clickable links and **how-to-use-it-for-this-lab** notes
for: Browser DevTools, the built-in difficulty switcher, Swagger UI, Postman,
Newman, curl, jq, and the reporting templates.

---

## 🔌 Setting the level per request (API testers)

```bash
# (Running locally? swap the host for http://localhost:3000)
BASE=https://qa-training-labs.onrender.com

# Same endpoint, two different behaviours:
curl -s $BASE/api/products/bad-id -H "X-QA-Level: low"     # -> 500 (defect)
curl -s $BASE/api/products/bad-id -H "X-QA-Level: stable"  # -> 400 (correct)

# Inspect / change the active level
curl $BASE/api/lab/level
curl -X POST $BASE/api/lab/level -H "Content-Type: application/json" -d '{"level":"medium"}'
```

Precedence: `X-QA-Level` header → `qa_level` cookie (set by the UI) → default `low`.
Every response echoes an `X-QA-Level` header so you always know what you tested.

---

## 🧩 How it works (for contributors)

The difficulty logic lives in **one place** so it's easy to read and extend:

| File | Role |
|------|------|
| `src/lab/level.js` | Resolves the active level per request (header/cookie/default). |
| `src/lab/behaviors.js` | **Single source of truth** — how every defect behaves at each level. |
| `src/lab/seedData.js` | Shared seed + the 24h auto-reset. |
| `src/routes/*.js` | Thin handlers that call a behaviour helper with `req.qaLevel`. |
| `public/js/nav.js` | **Two-zone navigation** — renders the right navbar per page. |
| `public/js/qalevel.js` | Front-end level switcher (lab pages only). |
| `SOLUTIONS/` | Instructor answer keys (matrix + per-level). |

### Two zones (learn vs. practice)

The site is deliberately split so the reading material and the app-under-test
never get tangled together. Each page declares its zone with
`<body data-zone="…">` and `public/js/nav.js` renders the matching navbar:

| Zone | `data-zone` | Pages | Navbar |
|------|-------------|-------|--------|
| 📚 **Learn** (notes & guidance) | `learn` | home, curriculum, guide, tools, interview, reporting, checklist, templates, scenarios, bug hunt | learning links + a **Start Training ▶** button |
| 🧪 **Practice** (the testing site) | `lab` | login, register, dashboard, products, cart, orders, profile | app links + difficulty switcher + auth, with a **← Learning Hub** link back |

**Start Training** sends the student to `/pages/login.html`, so a practice
session always begins by signing in (demo accounts are on the login page).

**Add a new level-aware defect:** add a helper to `behaviors.js` that branches on
the level, call it from the route, and document it in `SOLUTIONS/`. Done.

---

## 📋 API reference (high level)

Auth (`/api/auth`): register, login, refresh, logout, me ·
Products (`/api/products`) · Cart (`/api/cart`) · Orders (`/api/orders`) ·
Users (`/api/users`) · Lab (`/api/lab/level`) · Dev tools (`/api/seed`, `/api/seed/reset`).
Full interactive docs at **`/api/docs`**; Postman collection in `/postman`.

---

## 🗂️ Project structure

```
qa-training-labs/
├── src/
│   ├── lab/                  # ★ difficulty engine
│   │   ├── level.js          #   per-request level resolution
│   │   ├── behaviors.js      #   how each defect behaves per level
│   │   └── seedData.js       #   shared seed + 24h auto-reset
│   ├── config/ (db, swagger) # db.js = zero-config in-memory Mongo
│   ├── middleware/auth.js     # level-aware auth
│   ├── models/                # User, Product, Cart, Order
│   └── routes/                # auth, products, cart, orders, users, seed, lab
├── public/                    # frontend
│   ├── js/qalevel.js          # ★ level switcher
│   └── pages/                 # curriculum.html, reporting.html, bugs.html, …
├── SOLUTIONS/                 # ★ instructor answer keys (matrix + per level)
├── templates/                 # ★ bug-report / test-case / summary templates
├── REPORTING-GUIDE.md         # ★ how to report defects
└── postman/                   # API collection
```

---

## ☁️ Deployment

Works on any Node host. For a persistent DB set `MONGODB_URI` (e.g. MongoDB
Atlas free tier) and a `JWT_SECRET`; otherwise it runs in zero-config in-memory
mode (data resets on restart, and every `AUTO_RESET_HOURS`). Build: `npm install`,
start: `npm start`.

---

## 🔐 Security & secrets (please read before deploying)

This repo contains **no real secrets** — but it does contain *intentional* test
data and *intentional* defects. Don't mistake them for leaks:

- **Demo accounts are public on purpose.** `admin@qalab.com / Admin@1234`,
  `user@qalab.com / User@1234` (in `.env.example`, the seed, and the Postman
  env) are throwaway lab logins — that's seed data, not a credential leak.
- **At `level=low` the app deliberately exposes data.** For example it returns
  the bcrypt password hash and refresh token in a user object (see
  `src/lab/behaviors.js`, `serializeUser`). These are **teaching defects** a
  student is meant to *find and report* — they do not occur at `high`/`stable`.
- **JWT signing keys must be real in production.** The built-in
  `qa-lab-dev-…-change-me-please` values are public dev fallbacks. When
  `NODE_ENV=production`, the app **refuses to start** unless `JWT_SECRET` and
  `JWT_REFRESH_SECRET` are set to your own strong, secret values — so a real
  deployment can never run on a forgeable, publicly-known key. Set them in your
  host's environment (e.g. Render dashboard) before deploying.

---

## 📜 License

MIT — free for educational and personal use. **Happy testing! 🧪**
